import { Controller, Delete, Get, HttpCode } from '@nestjs/common';
import type { HistoryEntry, ListResponse, PlaybackState } from '@pulse/shared';
import { CurrentUser } from '../auth/session.guard';
import type { AuthUser } from '../auth/auth.factory';
import { PlaybackService } from '../playback/playback.service';

@Controller('history')
export class HistoryController {
  constructor(private readonly playback: PlaybackService) {}

  /** Mais recente primeiro (topo da pilha). */
  @Get()
  list(@CurrentUser() user: AuthUser): ListResponse<HistoryEntry> {
    return { items: this.playback.getHistory(user.id) };
  }

  @Delete()
  @HttpCode(200)
  clear(@CurrentUser() user: AuthUser): PlaybackState {
    return this.playback.clearHistory(user.id);
  }
}
