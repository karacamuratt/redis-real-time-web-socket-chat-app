import { Injectable, OnModuleInit } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class RedisSubscriber implements OnModuleInit {  

    constructor(private redis: RedisService) {}

    async onModuleInit() {
        await this.redis.subscribe('room:room1', (message) => {
            console.log('PUB SUB =>', message);
        });
    }
}
