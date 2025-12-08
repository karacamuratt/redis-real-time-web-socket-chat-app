import { MongooseModule } from "@nestjs/mongoose";
import { StreamConsumer } from "./stream.consumer";
import { ChatMessage, ChatMessageSchema } from "./chat-message.schema";
import { Module } from "@nestjs/common";
import { RedisModule } from "src/redis/redis.module";

@Module({
    imports: [
        MongooseModule.forFeature([
        { name: ChatMessage.name, schema: ChatMessageSchema }
        ]),
        RedisModule
    ],
    providers: [StreamConsumer],
})

export class StreamModule {}
