import { Module } from '@nestjs/common';
import { PlaybackStateManager } from './playback-state.manager';

/** Modulo de baixo nivel (sem dependencias): evita ciclo entre music e playback. */
@Module({ providers: [PlaybackStateManager], exports: [PlaybackStateManager] })
export class PlaybackStateModule {}
