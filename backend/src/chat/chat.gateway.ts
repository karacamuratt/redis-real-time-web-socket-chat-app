import {
  WebSocketGateway,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { RedisService } from 'src/redis/redis.service';

@WebSocketGateway({
    cors: {
        origin: "http://localhost:3001",
        credentials: true,
    },
})

export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {

    constructor(
        private jwt: JwtService, 
        private configService: ConfigService,
        private redis: RedisService
    ) {}

    @SubscribeMessage('typing')
    async handleTyping(
        @MessageBody() data: { room: string; isTyping: boolean },
        @ConnectedSocket() socket: Socket
    ) {
        const user = socket.data.user;
        const key = `typing:room:${data.room}`;

        if (data.isTyping) {
            await this.redis.redis.sAdd(key, user);
        } else {
            await this.redis.redis.sRem(key, user);
        }

        // Broadcast typing status to room
        socket.to(data.room).emit('typing', {
            user,
            isTyping: data.isTyping,
        });
    }

    async handleConnection(socket: Socket) {
        try {
            const token = socket.handshake.auth?.token ?? socket.handshake.query?.token;
            const payload = this.jwt.verify(token, { 
                secret: this.configService.get('JWT_SECRET') 
            });

            const email = payload.email;
            socket.data.user = email;

            await this.redis.redis.set(`presence:user:${email}`, 'online');
            await this.redis.redis.set(`presence:user:lastSeen:${email}`, Date.now().toString());

            console.log(`${email} is now ONLINE`);
        } catch (e) {
            socket.disconnect();
        }
    }

    async handleDisconnect(socket: Socket) {
        const email = socket.data.user;
        await this.redis.redis.set(`presence:user:${email}`, 'offline');
        await this.redis.redis.set(`presence:user:lastSeen:${email}`, Date.now().toString());

        console.log(`${email} is now OFFLINE`);
    }

    @SubscribeMessage('join')
    async handleJoin(
    @MessageBody() room: string,
    @ConnectedSocket() socket: Socket
    ) {
        socket.join(room);

        await this.redis.sAdd(`room:${room}`, socket.data.user);
        await this.redis.sAdd(`user:${socket.data.user}:rooms`, room);

        socket.to(room).emit('joined', {
            user: socket.data.user,
            room,
        });
    }

    @SubscribeMessage("message:local")
    handleLocal(
        @MessageBody() data: any,
        @ConnectedSocket() socket: Socket
    ) {
        socket.emit("message:local", data);
    }

    @SubscribeMessage("message")
    async handleMessage(
        @MessageBody() data: { room: string; text: string },
        @ConnectedSocket() socket: Socket
    ) {
        console.log("received message:", data);
        const user = socket.data.user;

        // 🟦 USER ACTIVITY UPDATE
        await this.redis.redis.set(`presence:lastActive:${user}`, Date.now().toString());

        const event = {
            room: data.room,
            user: socket.data.user,
            text: data.text,
            timestamp: Date.now(),
        };

        const streamKey = `stream:room:${event.room}`;

        await this.redis.redis.xAdd(
            streamKey,
            '*',
            {
                user: event.user,
                text: event.text,
                timestamp: event.timestamp.toString(),
            }
        );

        await this.redis.redis.xTrim(
            streamKey,
            'MAXLEN',
            1000
        );

        socket.to(event.room).emit('message', event);
    }
}
