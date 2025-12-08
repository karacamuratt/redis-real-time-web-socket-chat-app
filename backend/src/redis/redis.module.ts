import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis.service';
import { RedisSubscriber } from './redis.subscriber';

@Module({
    imports: [ConfigModule],
    providers: [RedisService, RedisSubscriber],
    exports: [RedisService],
})

export class RedisModule {}
