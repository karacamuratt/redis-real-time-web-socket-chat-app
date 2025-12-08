import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatMessage } from '../stream/chat-message.schema';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class ChatService {
    constructor(
        @InjectModel(ChatMessage.name)
        private messageModel: Model<ChatMessage>,
        private redis: RedisService
    ) {}

    async getHistory(room: string) {
        return this.messageModel
            .find({ room })
            .sort({ timestamp: 1 })
            .limit(500);
    }

    async sync(room: string, fromId: string) {
        const streamKey = `stream:room:${room}`;

        const entries = await this.redis.redis.xRange(streamKey, fromId, '+');

        if (entries.length > 0) {
            return entries.map(e => ({
                id: e.id,
                user: e.message.user,
                text: e.message.text,
                timestamp: Number(e.message.timestamp),
            }));
        }

        const fallbackTimestamp = Number(fromId.split('-')[0]);

        const mongoMessages = await this.messageModel
            .find({
                room,
                timestamp: { $gt: fallbackTimestamp }
            })
            .sort({ timestamp: 1 });

        return mongoMessages.map(m => ({
            id: m.timestamp + '-fallback',
            user: m.user,
            text: m.text,
            timestamp: m.timestamp,
        }));
    }
}
