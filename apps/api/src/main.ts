import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';
import { APP_ENV, AppEnv, loadDotEnv, loadEnv } from './config/env';

async function bootstrap(): Promise<void> {
  loadDotEnv();
  // Falha cedo e com mensagem clara se o ambiente estiver incompleto.
  const env = loadEnv();

  const app = await NestFactory.create(AppModule);
  await configureApp(app);
  app.enableShutdownHooks();
  await app.listen(env.port);
  Logger.log(`API em http://localhost:${app.get<AppEnv>(APP_ENV).port}/api`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
