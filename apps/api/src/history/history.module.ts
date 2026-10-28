import { Module } from '@nestjs/common';
import { PlaybackModule } from '../playback/playback.module';
import { HistoryController } from './history.controller';

@Module({ imports: [PlaybackModule], controllers: [HistoryController] })
export class HistoryModule {}
