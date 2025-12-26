import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { TrendCollectionJob } from './jobs/trend-collection.job';
import { ContentGenerationJob } from './jobs/content-generation.job';
import { ScheduledTask, TrendCollectionResult, ContentGenerationResult } from './scheduler.interface';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly trendCollectionJob: TrendCollectionJob,
    private readonly contentGenerationJob: ContentGenerationJob,
  ) {}

  /**
   * Get all registered cron jobs
   */
  getCronJobs(): ScheduledTask[] {
    const jobs = this.schedulerRegistry.getCronJobs();
    const tasks: ScheduledTask[] = [];

    jobs.forEach((job, name) => {
      const cronTime = job.cronTime as any;
      const nextDate = job.nextDate();
      tasks.push({
        id: name,
        name: this.formatJobName(name),
        cronExpression: cronTime?.source || 'unknown',
        lastRun: job.lastDate() || undefined,
        nextRun: nextDate ? nextDate.toJSDate() : undefined,
        isActive: nextDate !== null,
      });
    });

    return tasks;
  }

  /**
   * Get status of a specific cron job
   */
  getCronJobStatus(name: string): ScheduledTask | null {
    try {
      const job = this.schedulerRegistry.getCronJob(name);
      const cronTime = job.cronTime as any;
      const nextDate = job.nextDate();

      return {
        id: name,
        name: this.formatJobName(name),
        cronExpression: cronTime?.source || 'unknown',
        lastRun: job.lastDate() || undefined,
        nextRun: nextDate ? nextDate.toJSDate() : undefined,
        isActive: nextDate !== null,
      };
    } catch {
      return null;
    }
  }

  /**
   * Start a cron job
   */
  startCronJob(name: string): boolean {
    try {
      const job = this.schedulerRegistry.getCronJob(name);
      job.start();
      this.logger.log(`Started cron job: ${name}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to start cron job ${name}`, error);
      return false;
    }
  }

  /**
   * Stop a cron job
   */
  stopCronJob(name: string): boolean {
    try {
      const job = this.schedulerRegistry.getCronJob(name);
      job.stop();
      this.logger.log(`Stopped cron job: ${name}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to stop cron job ${name}`, error);
      return false;
    }
  }

  /**
   * Manually trigger trend collection for a project
   */
  async triggerTrendCollection(projectId: string): Promise<TrendCollectionResult | null> {
    this.logger.log(`Manually triggering trend collection for project: ${projectId}`);
    return this.trendCollectionJob.collectTrendsManually(projectId);
  }

  /**
   * Manually trigger content generation for a project
   */
  async triggerContentGeneration(
    userId: string,
    projectId: string,
  ): Promise<ContentGenerationResult | null> {
    this.logger.log(`Manually triggering content generation for project: ${projectId}`);
    return this.contentGenerationJob.generateContentManually(userId, projectId);
  }

  /**
   * Add a dynamic cron job
   */
  addCronJob(name: string, cronExpression: string, callback: () => void): boolean {
    try {
      const job = new CronJob(
        cronExpression,
        callback,
        null,
        true,
        'Asia/Seoul',
      );

      this.schedulerRegistry.addCronJob(name, job);
      this.logger.log(`Added new cron job: ${name} (${cronExpression})`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to add cron job ${name}`, error);
      return false;
    }
  }

  /**
   * Delete a dynamic cron job
   */
  deleteCronJob(name: string): boolean {
    try {
      this.schedulerRegistry.deleteCronJob(name);
      this.logger.log(`Deleted cron job: ${name}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete cron job ${name}`, error);
      return false;
    }
  }

  /**
   * Format job name for display
   */
  private formatJobName(name: string): string {
    return name
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}
