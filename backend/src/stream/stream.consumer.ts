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
    ) {}

    async onModuleInit() {
        const streamKey = "stream:room:general";

        try {
            await this.redis.redis.xGroupCreate(
                streamKey,
                this.group,
                "$",
                { MKSTREAM: true }
            );
        } catch (e) {
            if (!e.message.includes("BUSYGROUP")) {
                this.logger.error("xGroupCreate error:", e);
            }
        }

        this.consume(streamKey);
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
