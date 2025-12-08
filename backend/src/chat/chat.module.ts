import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { JwtModule } from '@nestjs/jwt';
import { RedisModule } from 'src/redis/redis.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatMessage, ChatMessageSchema } from 'src/stream/chat-message.schema';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { StreamConsumer } from 'src/stream/stream.consumer';

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET,
        }),
        RedisModule,
        MongooseModule.forFeature([
            { name: ChatMessage.name, schema: ChatMessageSchema }
        ])
    ],
    controllers: [ChatController],
    providers: [ChatService, ChatGateway, StreamConsumer],
})

export class ChatModule {}
