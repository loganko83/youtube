import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { TrendsService } from '../../trends/trends.service';
import { TrendCollectionResult } from '../scheduler.interface';
import { NicheType } from '@tubegenius/shared';

@Injectable()
export class TrendCollectionJob {
  private readonly logger = new Logger(TrendCollectionJob.name);
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly trendsService: TrendsService,
  ) {}

  /**
   * Collect trends for all active projects
   * Runs daily at 6:00 AM KST
   */
  @Cron('0 6 * * *', {
    name: 'trend-collection',
    timeZone: 'Asia/Seoul',
  })
  async collectDailyTrends(): Promise<TrendCollectionResult[]> {
    if (this.isRunning) {
      this.logger.warn('Trend collection job is already running, skipping...');
      return [];
    }

    this.isRunning = true;
    this.logger.log('Starting daily trend collection...');
    const results: TrendCollectionResult[] = [];

    try {
      // Get all projects with automation enabled
      const projects = await this.prisma.project.findMany({
        where: {
          // Only active projects (you might add an isActive field or check automation settings)
          deletedAt: null,
        },
        include: {
          dataSources: true,
        },
      });

      this.logger.log(`Found ${projects.length} projects for trend collection`);

      for (const project of projects) {
        try {
          const result = await this.collectTrendsForProject(project);
          results.push(result);
        } catch (error) {
          this.logger.error(
            `Failed to collect trends for project ${project.id}`,
            error instanceof Error ? error.stack : error,
          );
        }
      }

      this.logger.log(
        `Trend collection completed. Processed ${results.length} projects`,
      );
    } catch (error) {
      this.logger.error(
        'Trend collection job failed',
        error instanceof Error ? error.stack : error,
      );
    } finally {
      this.isRunning = false;
    }

    return results;
  }

  /**
   * Collect trends for a specific project
   */
  private async collectTrendsForProject(project: {
    id: string;
    niche: string;
    dataSources: any[];
  }): Promise<TrendCollectionResult> {
    this.logger.log(`Collecting trends for project: ${project.id}`);

    // Get aggregated trends from all sources
    const aggregatedTrends = await this.trendsService.getAggregatedTrends({
      limit: 50,
    });

    // Get topic suggestions based on trends
    const suggestions = await this.trendsService.getTopicSuggestions(
      project.niche as NicheType,
    );

    // Store trends in cache or database for later use
    // For now, we'll just log and return the result
    this.logger.log(
      `Project ${project.id}: Found ${aggregatedTrends.length} trends, ` +
        `generated ${suggestions.length} topic suggestions`,
    );

    return {
      projectId: project.id,
      trendCount: aggregatedTrends.length,
      topicsGenerated: suggestions.length,
      collectedAt: new Date(),
    };
  }

  /**
   * Manual trigger for trend collection (for testing or on-demand)
   */
  async collectTrendsManually(projectId: string): Promise<TrendCollectionResult | null> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { dataSources: true },
    });

    if (!project) {
      this.logger.warn(`Project ${projectId} not found for manual trend collection`);
      return null;
    }

    return this.collectTrendsForProject(project);
  }
}
