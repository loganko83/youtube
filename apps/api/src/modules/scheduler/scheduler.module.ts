import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { SchedulerController } from './scheduler.controller';
import { AutomationController, AutomationStatsController } from './automation.controller';
import { AutomationService } from './automation.service';
import { TrendCollectionJob } from './jobs/trend-collection.job';
import { ContentGenerationJob } from './jobs/content-generation.job';
import { PrismaModule } from '../prisma/prisma.module';
import { TrendsModule } from '../trends/trends.module';
import { ContentsModule } from '../contents/contents.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    TrendsModule,
    forwardRef(() => ContentsModule),
  ],
  controllers: [
    SchedulerController,
    AutomationController,
    AutomationStatsController,
  ],
  providers: [
    SchedulerService,
    AutomationService,
    TrendCollectionJob,
    ContentGenerationJob,
  ],
  exports: [SchedulerService, AutomationService],
})
export class SchedulerModule {}
