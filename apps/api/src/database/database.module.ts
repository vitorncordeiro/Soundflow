import { Global, Inject, Logger, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { APP_ENV, AppEnv } from '../config/env';
import { createDatabase } from './database';
import type { DatabaseHandle } from './database';

export const DB_HANDLE = Symbol('DB_HANDLE');
export const DB = Symbol('DB');

@Global()
@Module({
  providers: [
    {
      provide: DB_HANDLE,
      inject: [APP_ENV],
      useFactory: (env: AppEnv) => createDatabase(env.databaseUrl),
    },
    { provide: DB, inject: [DB_HANDLE], useFactory: (handle: DatabaseHandle) => handle.db },
  ],
  exports: [DB, DB_HANDLE],
})
export class DatabaseModule implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(@Inject(DB_HANDLE) private readonly handle: DatabaseHandle) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.handle.db.execute(sql`select 1`);
    } catch (error) {
      // Nao derruba a API: as rotas falham com 500 generico e /api/health mostra 503.
      this.logger.error(
        `Nao foi possivel conectar ao PostgreSQL: ${error instanceof Error ? error.message : 'erro desconhecido'}`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.handle.pool.end();
  }
}
