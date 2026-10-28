import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { ListTracksParams, Track } from '@pulse/shared';
import type { TrackRow } from '../database/schema';
import { PlaybackStateManager } from '../playback/playback-state.manager';
import { MusicRepository, TrackChanges } from './music.repository';
import type { CreateTrackDto, UpdateTrackDto } from './music.dto';

export function toTrackDto(row: TrackRow): Track {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    artist: row.artist,
    album: row.album,
    coverUrl: row.coverUrl,
    audioUrl: row.audioUrl,
    durationSeconds: row.durationSeconds,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Injectable()
export class MusicService {
  constructor(
    private readonly repository: MusicRepository,
    private readonly playbackState: PlaybackStateManager,
  ) {}

  async list(userId: string, params: ListTracksParams): Promise<Track[]> {
    // O catalogo e representado como array nativo, ja ordenado pelo PostgreSQL.
    const rows = await this.repository.list(userId, params);
    return rows.map(toTrackDto);
  }

  async getOwned(userId: string, id: string): Promise<Track> {
    const row = await this.repository.findOwned(userId, id);
    if (!row) throw new NotFoundException('Musica nao encontrada.');
    return toTrackDto(row);
  }

  async create(userId: string, dto: CreateTrackDto): Promise<Track> {
    return toTrackDto(await this.repository.create(userId, dto));
  }

  async update(userId: string, id: string, dto: UpdateTrackDto): Promise<Track> {
    // Lista permitida de campos: o userId e outros campos nunca sao editaveis.
    const changes: TrackChanges = {};
    if (dto.title !== undefined) changes.title = dto.title;
    if (dto.artist !== undefined) changes.artist = dto.artist;
    if (dto.album !== undefined) changes.album = dto.album;
    if (dto.coverUrl !== undefined) changes.coverUrl = dto.coverUrl;
    if (dto.audioUrl !== undefined) changes.audioUrl = dto.audioUrl;
    if (dto.durationSeconds !== undefined) changes.durationSeconds = dto.durationSeconds;
    if (Object.keys(changes).length === 0) {
      throw new BadRequestException('Informe ao menos um campo para atualizar.');
    }
    const row = await this.repository.updateOwned(userId, id, changes);
    if (!row) throw new NotFoundException('Musica nao encontrada.');
    return toTrackDto(row);
  }

  async delete(userId: string, id: string): Promise<void> {
    const deleted = await this.repository.deleteOwned(userId, id);
    if (!deleted) throw new NotFoundException('Musica nao encontrada.');
    // Comportamento definido: sai da fila; historico e faixa atual guardam o snapshot.
    this.playbackState.purgeTrack(userId, id);
  }
}
