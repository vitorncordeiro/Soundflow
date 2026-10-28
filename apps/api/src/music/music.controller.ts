import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import type { Track } from '@pulse/shared';
import { CurrentUser } from '../auth/session.guard';
import type { AuthUser } from '../auth/auth.factory';
import { CreateTrackDto, ListTracksQueryDto, UpdateTrackDto } from './music.dto';
import { MusicService } from './music.service';

@Controller('music')
export class MusicController {
  constructor(private readonly music: MusicService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ListTracksQueryDto): Promise<Track[]> {
    return this.music.list(user.id, query);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<Track> {
    return this.music.getOwned(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTrackDto): Promise<Track> {
    return this.music.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTrackDto,
  ): Promise<Track> {
    return this.music.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.music.delete(user.id, id);
  }
}
