import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';
import { HistoryModule } from './history/history.module';
import { MusicModule } from './music/music.module';
import { PlaybackModule } from './playback/playback.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
    MusicModule,
    PlaybackModule,
    QueueModule,
    HistoryModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
