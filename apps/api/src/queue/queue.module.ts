import { Module } from '@nestjs/common';
import { PlaybackModule } from '../playback/playback.module';
import { QueueController } from './queue.controller';

@Module({ imports: [PlaybackModule], controllers: [QueueController] })
export class QueueModule {}
