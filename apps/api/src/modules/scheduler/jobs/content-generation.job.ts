import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { TrendsService } from '../../trends/trends.service';
import { ContentsService } from '../../contents/contents.service';
import { ContentFormat, ToneType } from '../../contents/contents.dto';
import { ContentGenerationResult } from '../scheduler.interface';
import { NicheType } from '@tubegenius/shared';

@Injectable()
export class ContentGenerationJob {
  private readonly logger = new Logger(ContentGenerationJob.name);
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly trendsService: TrendsService,
    private readonly contentsService: ContentsService,
  ) {}

  /**
   * Generate scheduled content for all active automations
   * Runs daily at 9:00 AM KST
   */
  @Cron('0 9 * * *', {
    name: 'content-generation',
    timeZone: 'Asia/Seoul',
  })
  async generateScheduledContent(): Promise<ContentGenerationResult[]> {
    if (this.isRunning) {
      this.logger.warn('Content generation job is already running, skipping...');
      return [];
    }

    this.isRunning = true;
    this.logger.log('Starting scheduled content generation...');
    const results: ContentGenerationResult[] = [];

    try {
      // Get all projects with automation enabled
      const automations = await this.prisma.projectAutomation.findMany({
        where: {
          isEnabled: true,
        },
        include: {
          project: {
            include: {
              user: true,
            },
          },
        },
      });

      this.logger.log(`Found ${automations.length} active automations`);

      for (const automation of automations) {
        try {
          // Check daily limit
          const todayContentsCount = await this.getTodayContentCount(
            automation.projectId,
          );

          if (todayContentsCount >= automation.dailyLimit) {
            this.logger.log(
              `Project ${automation.projectId} reached daily limit (${automation.dailyLimit})`,
            );
            continue;
          }

          // Generate content
          const result = await this.generateContentForProject(
            automation.project.userId,
            automation.projectId,
            automation.project.niche,
            automation.useTrends,
          );

          if (result) {
            results.push(result);
          }
        } catch (error) {
          this.logger.error(
            `Failed to generate content for project ${automation.projectId}`,
            error instanceof Error ? error.stack : error,
          );
        }
      }

      this.logger.log(
        `Content generation completed. Generated ${results.length} contents`,
      );
    } catch (error) {
      this.logger.error(
        'Content generation job failed',
        error instanceof Error ? error.stack : error,
      );
    } finally {
      this.isRunning = false;
    }

    return results;
  }

  /**
   * Get count of contents generated today for a project
   */
  private async getTodayContentCount(projectId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.content.count({
      where: {
        projectId,
        createdAt: {
          gte: today,
        },
      },
    });
  }

  /**
   * Generate content for a specific project
   */
  private async generateContentForProject(
    userId: string,
    projectId: string,
    niche: string,
    useTrends: boolean,
  ): Promise<ContentGenerationResult | null> {
    this.logger.log(`Generating content for project: ${projectId}`);

    let topic: string;

    if (useTrends) {
      // Get trending topic suggestion
      const suggestions = await this.trendsService.getTopicSuggestions(niche as NicheType);
      const topSuggestion = suggestions[0];

      if (!topSuggestion) {
        this.logger.warn(
          `No trend suggestions found for project ${projectId}, using default topic`,
        );
        topic = this.getDefaultTopic(niche);
      } else {
        topic = topSuggestion.topic;
        this.logger.log(
          `Using trending topic for project ${projectId}: ${topic} (score: ${topSuggestion.trendScore})`,
        );
      }
    } else {
      topic = this.getDefaultTopic(niche);
    }

    try {
      // Create content using ContentsService
      const content = await this.contentsService.create(userId, {
        projectId,
        config: {
          topic,
          niche,
          format: ContentFormat.SHORTS,
          tone: ToneType.FRIENDLY,
          language: 'ko',
        },
      });

      this.logger.log(
        `Content created for project ${projectId}: ${content.id}`,
      );

      return {
        projectId,
        contentId: content.id,
        status: 'pending',
        topic,
        generatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to create content for project ${projectId}`,
        error instanceof Error ? error.stack : error,
      );
      return null;
    }
  }

  /**
   * Get default topic based on niche
   */
  private getDefaultTopic(niche: string): string {
    const defaultTopics: Record<string, string[]> = {
      SENIOR_HEALTH: [
        '시니어를 위한 건강한 아침 습관',
        '관절 건강을 위한 스트레칭',
        '혈압 관리를 위한 생활 팁',
      ],
      FINANCE: [
        '초보자를 위한 투자 기초',
        '월급 관리 꿀팁',
        '연금 저축의 모든 것',
      ],
      TECH: [
        '스마트폰 활용 꿀팁',
        'AI 기술의 일상 활용',
        '최신 IT 트렌드',
      ],
      HISTORY: [
        '오늘의 역사 이야기',
        '한국사 속 숨겨진 이야기',
        '세계사의 결정적 순간',
      ],
      COMMERCE: [
        '알뜰 쇼핑 꿀팁',
        '최고의 가성비 제품 추천',
        '트렌드 아이템 리뷰',
      ],
    };

    const nicheTopics = defaultTopics[niche] || defaultTopics['TECH'];
    const randomIndex = Math.floor(Math.random() * nicheTopics.length);
    return nicheTopics[randomIndex] || '오늘의 콘텐츠';
  }

  /**
   * Manual trigger for content generation (for testing or on-demand)
   */
  async generateContentManually(
    userId: string,
    projectId: string,
  ): Promise<ContentGenerationResult | null> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      this.logger.warn(
        `Project ${projectId} not found for manual content generation`,
      );
      return null;
    }

    return this.generateContentForProject(
      userId,
      projectId,
      project.niche,
      true,
    );
  }
}
