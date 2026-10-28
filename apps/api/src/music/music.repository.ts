import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';
import type { ListTracksParams } from '@pulse/shared';
import type { Database } from '../database/database';
import { DB } from '../database/database.module';
import { track, TrackRow } from '../database/schema';

export interface NewTrackData {
  title: string;
  artist: string;
  album?: string | null;
  coverUrl?: string | null;
  audioUrl: string;
  durationSeconds?: number | null;
}

export type TrackChanges = Partial<NewTrackData>;

/**
 * Camada de persistencia do catalogo. TODA consulta filtra tambem por `userId`
 * (vindo da sessao), entao um usuario nunca enxerga nem altera musicas de outro.
 */
@Injectable()
export class MusicRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  list(userId: string, params: ListTracksParams): Promise<TrackRow[]> {
    const sort = params.sort ?? 'createdAt';
    const order = params.order ?? (sort === 'createdAt' ? 'desc' : 'asc');
    const direction = order === 'asc' ? asc : desc;
    const orderBy =
      sort === 'createdAt'
        ? [direction(track.createdAt), asc(track.id)]
        : [direction(sql`lower(${sort === 'title' ? track.title : track.artist})`), asc(track.id)];

    const filters = [eq(track.userId, userId)];
    if (params.q) {
      // Escapa os curingas do LIKE para a busca ser literal.
      const pattern = `%${params.q.replace(/[\\%_]/g, '\\$&')}%`;
      const match = or(ilike(track.title, pattern), ilike(track.artist, pattern));
      if (match) filters.push(match);
    }
    return this.db
      .select()
      .from(track)
      .where(and(...filters))
      .orderBy(...orderBy);
  }

  async findOwned(userId: string, id: string): Promise<TrackRow | undefined> {
    const [row] = await this.db
      .select()
      .from(track)
      .where(and(eq(track.id, id), eq(track.userId, userId)))
      .limit(1);
    return row;
  }

  async create(userId: string, data: NewTrackData): Promise<TrackRow> {
    const [row] = await this.db
      .insert(track)
      .values({
        userId,
        title: data.title,
        artist: data.artist,
        album: data.album ?? null,
        coverUrl: data.coverUrl ?? null,
        audioUrl: data.audioUrl,
        durationSeconds: data.durationSeconds ?? null,
      })
      .returning();
    if (!row) throw new Error('Falha ao inserir musica');
    return row;
  }

  async updateOwned(
    userId: string,
    id: string,
    changes: TrackChanges,
  ): Promise<TrackRow | undefined> {
    const [row] = await this.db
      .update(track)
      .set(changes)
      .where(and(eq(track.id, id), eq(track.userId, userId)))
      .returning();
    return row;
  }

  async deleteOwned(userId: string, id: string): Promise<boolean> {
    const rows = await this.db
      .delete(track)
      .where(and(eq(track.id, id), eq(track.userId, userId)))
      .returning({ id: track.id });
    return rows.length > 0;
  }
}
