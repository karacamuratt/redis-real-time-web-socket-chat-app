import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit {
    private client: RedisClientType;

    async onModuleInit() {
        this.client = createClient({
            url: 'redis://localhost:6379',
        });

        this.client.on('error', (err) => console.error('Redis Error', err));

        await this.client.connect();

        console.log('[Redis] connected:', await this.client.ping());
    }

    get redis() {
        return this.client;
    }

    async ping() {
        return await this.client.ping();
    }

    async set(key: string, value: string, ttl?: number) {
        if (ttl) return this.client.set(key, value, { EX: ttl });
        return this.client.set(key, value);
    }

    async get(key: string) {
        return this.client.get(key);
    }

    async del(key: string) {
        return this.client.del(key);
    }

    async publish(channel: string, message: string) {
        return this.client.publish(channel, message);
    }

    async subscribe(channel: string, cb: (message: string) => void) {
        const sub = this.client.duplicate();
        await sub.connect();
        await sub.subscribe(channel, cb);
    }

    async sAdd(key: string, value: string) {
        return this.client.sAdd(key, value);
    }

    async sMembers(key: string) {
        return this.client.sMembers(key);
    }

    async sRem(key: string, value: string) {
        return this.client.sRem(key, value);
    }
}
