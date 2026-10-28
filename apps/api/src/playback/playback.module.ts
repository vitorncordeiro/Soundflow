import { Module } from '@nestjs/common';
import { MusicModule } from '../music/music.module';
import { PlaybackController } from './playback.controller';
import { PlaybackStateModule } from './playback-state.module';
import { PlaybackService } from './playback.service';

@Module({
  imports: [MusicModule, PlaybackStateModule],
  controllers: [PlaybackController],
  providers: [PlaybackService],
  exports: [PlaybackService],
})
export class PlaybackModule {}
