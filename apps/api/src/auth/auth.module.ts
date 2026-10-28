import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { APP_ENV, AppEnv } from '../config/env';
import { DB } from '../database/database.module';
import type { Database } from '../database/database';
import { createAuth } from './auth.factory';
import { AUTH } from './auth.constants';
import { SessionGuard } from './session.guard';

@Module({
  providers: [
    {
      provide: AUTH,
      inject: [APP_ENV, DB],
      useFactory: (env: AppEnv, db: Database) =>
        createAuth({
          db,
          secret: env.authSecret,
          baseURL: env.authUrl,
          webOrigin: env.webOrigin,
          isProduction: env.nodeEnv === 'production',
        }),
    },
    { provide: APP_GUARD, useClass: SessionGuard },
  ],
  exports: [AUTH],
})
export class AuthModule {}
