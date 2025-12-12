import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { RedisService } from "../redis/redis.service";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ChatMessage } from "./chat-message.schema";

@Injectable()
export class StreamConsumer implements OnModuleInit {
    private readonly logger = new Logger(StreamConsumer.name);
    private group = "chat-group";

    constructor(
        private readonly redis: RedisService,
        @InjectModel(ChatMessage.name)
        private readonly chatModel: Model<ChatMessage>,
    ) { }

    async onModuleInit() {
        const streamKey = "stream:room:general";

        try {
            await this.redis.redis.xGroupCreate(
                streamKey,
                this.group,
                "$",
                { MKSTREAM: true }
            );

            await this.recoverPending(streamKey);
        } catch (e) {
            if (!e.message.includes("BUSYGROUP")) {
                this.logger.error("xGroupCreate error:", e);
            }
        }

        this.consume(streamKey);
    }

    async recoverPending(streamKey: string) {
        this.logger.warn("Checking for pending messages...");

        const summary = await (this.redis.redis as any).xPending(streamKey, this.group);

        if (!summary?.pending || summary.pending.length === 0) {
            this.logger.log("No pending messages.");
            return;
        }

        this.logger.warn(`Found ${summary.pending.length} pending messages.`);

        for (const item of summary.pending) {
            const id = item.id;

            this.logger.warn(`Reclaiming message: ${id}`);

            const claimed = await this.redis.redis.xClaim(
                streamKey,
                this.group,
                "consumer-1",
                0, // min idle time, 0
                id
            );

            if (claimed.length === 0) {
                this.logger.error("Claim failed for", id);
                continue;
            }

            const msg = claimed[0];
            const data = (msg as any).message;

            await this.chatModel.create({
                room: streamKey.replace("stream:room:", ""),
                user: data.user,
                text: data.text,
                timestamp: Number(data.timestamp),
            });

            this.logger.log(`Recovered + saved: ${data.text}`);

            // ACK
            await this.redis.redis.xAck(streamKey, this.group, id);
        }
    }

    async consume(streamKey: string) {
        this.logger.log(`Listening Redis Stream: ${streamKey}`);

        while (true) {
            const res = await this.redis.redis.xReadGroup(
                this.group,
                "consumer-1",
                [{ key: streamKey, id: ">" }],
                { COUNT: 10, BLOCK: 5000 }
            );

            if (!res) continue;

            for (const stream of res) {
                for (const msg of stream.messages) {
                    const data = msg.message;

                    await this.chatModel.create({
                        room: streamKey.replace("stream:room:", ""),
                        user: data.user,
                        text: data.text,
                        timestamp: Number(data.timestamp),
                    });

                    this.logger.log(
                        `Saved message to Mongo: ${data.user}: ${data.text}`
                    );

                    await this.redis.redis.xAck(
                        streamKey,
                        this.group,
                        msg.id
                    );
                }
            }
        }
    }
}
