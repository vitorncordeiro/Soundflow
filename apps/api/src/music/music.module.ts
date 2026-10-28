import { Module } from '@nestjs/common';
import { PlaybackStateModule } from '../playback/playback-state.module';
import { MusicController } from './music.controller';
import { MusicRepository } from './music.repository';
import { MusicService } from './music.service';

@Module({
  imports: [PlaybackStateModule],
  controllers: [MusicController],
  providers: [MusicRepository, MusicService],
  exports: [MusicService],
})
export class MusicModule {}
