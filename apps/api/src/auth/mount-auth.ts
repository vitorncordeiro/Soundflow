import type { INestApplication } from '@nestjs/common';
import type { AuthInstance } from './auth.factory';
import { AUTH } from './auth.constants';

/**
 * Monta o handler do Better Auth em /api/auth/*.
 * Deve ser chamado ANTES de app.init(): assim a rota fica a frente do body parser
 * do Nest e o Better Auth le o corpo da requisicao por conta propria.
 */
export async function mountAuth(app: INestApplication): Promise<void> {
  const auth = app.get<AuthInstance>(AUTH);
  const { toNodeHandler } = await import('better-auth/node');
  const express = app.getHttpAdapter().getInstance();
  express.all('/api/auth/*splat', toNodeHandler(auth as never));
}
