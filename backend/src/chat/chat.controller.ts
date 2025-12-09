import { Controller, Get, Param, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { RedisService } from 'src/redis/redis.service';

interface Result {
    email: string;
    status: string | null;
}

@Controller('chat')
export class ChatController {
    constructor(
        private chatService: ChatService,
        private redis: RedisService
    ) { }

    /*
    @Get('history')
    async getHistory(@Query('room') room: string) {
        return await this.chatService.getHistory(room);
    }
    */

    @Get("history/:room")
    async getHistory(
        @Param("room") room: string,
        @Query("count") count: number = 50
    ) {
        const streamKey = `stream:room:${room}`;

        // Redis v4 XRANGE
        const messages = await this.redis.redis.xRange(
            streamKey,
            "-",
            "+",
            { COUNT: count }
        );

        // XRANGE mapping
        const result = messages.map((msg) => {
            const id = msg.id;
            const fields = msg.message;

            return {
                id,
                user: fields.user,
                text: fields.text,
                timestamp: Number(fields.timestamp),
            };
        });

        return { room, history: result };
    }

    @Get('sync')
    async sync(
        @Query('room') room: string,
        @Query('fromId') fromId: string
    ) {
        return this.chatService.sync(room, fromId);
    }

    @Get('presence/:email')
    async getPresence(@Param('email') email: string) {
        const status = await this.redis.redis.get(`presence:user:${email}`);
        const lastSeen = await this.redis.redis.get(`presence:user:lastSeen:${email}`);

        return {
            email,
            status,
            lastSeen: Number(lastSeen),
        };
    }

    @Get('presence/room/:room')
    async roomPresence(@Param('room') room: string) {
        const users = await this.redis.redis.sMembers(`presence:room:${room}`);
        const results: Result[] = [];

        for (const u of users) {
            const status = await this.redis.redis.get(`presence:user:${u}`);
            results.push({ email: u, status });
        }

        return results;
    }
}
