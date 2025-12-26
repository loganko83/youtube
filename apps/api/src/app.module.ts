import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { ContentsModule } from './modules/contents/contents.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { YouTubeModule } from './modules/youtube/youtube.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { TrendsModule } from './modules/trends/trends.module';
import { DataSourcesModule } from './modules/data-sources/data-sources.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    AuthModule,
    ProjectsModule,
    ContentsModule,
    WebhooksModule,
    YouTubeModule,
    TrendsModule,
    DataSourcesModule,
    SchedulerModule,
    AnalyticsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
