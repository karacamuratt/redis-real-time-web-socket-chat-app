import { Controller, Get } from '@nestjs/common';
import { RedisService } from './redis/redis.service';

@Controller('health')
export class HealthController {
    constructor(
        private redis: RedisService
    ) {}

    @Get()
    check() {
        return { status: 'ok' };
    }

    @Get('redis')
    async redisStatus() {
        const ping = await this.redis.ping();

        return { redis: ping };
    }
}
