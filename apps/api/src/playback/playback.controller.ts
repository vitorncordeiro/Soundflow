import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import type { PlaybackState } from '@pulse/shared';
import { CurrentUser } from '../auth/session.guard';
import type { AuthUser } from '../auth/auth.factory';
import { ReportErrorDto, RunIdDto, TrackIdDto } from './playback.dto';
import { PlaybackService } from './playback.service';

/** Todas as operacoes devolvem o estado completo para o cliente atualizar a tela. */
@Controller('playback')
export class PlaybackController {
  constructor(private readonly playback: PlaybackService) {}

  @Get()
  get(@CurrentUser() user: AuthUser): PlaybackState {
    return this.playback.getState(user.id);
  }

  @Post('play')
  @HttpCode(200)
  play(@CurrentUser() user: AuthUser, @Body() dto: TrackIdDto): Promise<PlaybackState> {
    return this.playback.play(user.id, dto.trackId);
  }

  @Post('pause')
  @HttpCode(200)
  pause(@CurrentUser() user: AuthUser): PlaybackState {
    return this.playback.pause(user.id);
  }

  @Post('resume')
  @HttpCode(200)
  resume(@CurrentUser() user: AuthUser): PlaybackState {
    return this.playback.resume(user.id);
  }

  @Post('next')
  @HttpCode(200)
  next(@CurrentUser() user: AuthUser): PlaybackState {
    return this.playback.next(user.id);
  }

  @Post('previous')
  @HttpCode(200)
  previous(@CurrentUser() user: AuthUser): PlaybackState {
    return this.playback.previous(user.id);
  }

  @Post('ended')
  @HttpCode(200)
  ended(@CurrentUser() user: AuthUser, @Body() dto: RunIdDto): PlaybackState {
    return this.playback.ended(user.id, dto.runId);
  }

  @Post('error')
  @HttpCode(200)
  error(@CurrentUser() user: AuthUser, @Body() dto: ReportErrorDto): PlaybackState {
    return this.playback.reportError(user.id, dto.runId, dto.message);
  }
}
