import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import type { ListResponse, PlaybackState, QueueEntry } from '@pulse/shared';
import { CurrentUser } from '../auth/session.guard';
import type { AuthUser } from '../auth/auth.factory';
import { TrackIdDto } from '../playback/playback.dto';
import { PlaybackService } from '../playback/playback.service';

@Controller('queue')
export class QueueController {
  constructor(private readonly playback: PlaybackService) {}

  @Get()
  list(@CurrentUser() user: AuthUser): ListResponse<QueueEntry> {
    return { items: this.playback.getQueue(user.id) };
  }

  @Post()
  enqueue(@CurrentUser() user: AuthUser, @Body() dto: TrackIdDto): Promise<PlaybackState> {
    return this.playback.enqueue(user.id, dto.trackId);
  }

  @Delete()
  @HttpCode(200)
  clear(@CurrentUser() user: AuthUser): PlaybackState {
    return this.playback.clearQueue(user.id);
  }

  @Delete(':entryId')
  @HttpCode(200)
  remove(
    @CurrentUser() user: AuthUser,
    @Param('entryId', ParseUUIDPipe) entryId: string,
  ): PlaybackState {
    return this.playback.removeQueueEntry(user.id, entryId);
  }
}
