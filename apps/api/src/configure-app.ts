import { INestApplication, ValidationPipe } from '@nestjs/common';
import { mountAuth } from './auth/mount-auth';
import { APP_ENV, AppEnv } from './config/env';

/** Configuracao compartilhada entre main.ts e os testes de integracao. */
export async function configureApp(app: INestApplication): Promise<void> {
  const env = app.get<AppEnv>(APP_ENV);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: [env.webOrigin],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await mountAuth(app);
}
