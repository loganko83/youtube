import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAutomationDto, UpdateAutomationDto } from './automation.dto';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get automation settings for a project
   */
  async getAutomation(userId: string, projectId: string) {
    // Verify project ownership
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Get or create automation settings
    let automation = await this.prisma.projectAutomation.findUnique({
      where: { projectId },
    });

    if (!automation) {
      // Create default automation settings
      automation = await this.prisma.projectAutomation.create({
        data: {
          projectId,
          isEnabled: false,
          generateTime: '09:00',
          publishTime: '12:00',
          timezone: 'Asia/Seoul',
          dailyLimit: 1,
          autoPublish: false,
          useTrends: true,
          trendSources: ['google', 'naver', 'rss'],
        },
      });
    }

    return automation;
  }

  /**
   * Create or update automation settings
   */
  async upsertAutomation(
    userId: string,
    projectId: string,
    dto: CreateAutomationDto,
  ) {
    // Verify project ownership
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const automation = await this.prisma.projectAutomation.upsert({
      where: { projectId },
      create: {
        projectId,
        isEnabled: dto.isEnabled ?? false,
        generateTime: dto.generateTime ?? '09:00',
        publishTime: dto.publishTime ?? '12:00',
        timezone: dto.timezone ?? 'Asia/Seoul',
        dailyLimit: dto.dailyLimit ?? 1,
        autoPublish: dto.autoPublish ?? false,
        useTrends: dto.useTrends ?? true,
        trendSources: dto.trendSources ?? ['google', 'naver', 'rss'],
      },
      update: {
        isEnabled: dto.isEnabled,
        generateTime: dto.generateTime,
        publishTime: dto.publishTime,
        timezone: dto.timezone,
        dailyLimit: dto.dailyLimit,
        autoPublish: dto.autoPublish,
        useTrends: dto.useTrends,
        trendSources: dto.trendSources,
      },
    });

    this.logger.log(
      `Automation settings updated for project ${projectId}: enabled=${automation.isEnabled}`,
    );

    return automation;
  }

  /**
   * Enable automation for a project
   */
  async enableAutomation(userId: string, projectId: string) {
    return this.upsertAutomation(userId, projectId, { isEnabled: true });
  }

  /**
   * Disable automation for a project
   */
  async disableAutomation(userId: string, projectId: string) {
    return this.upsertAutomation(userId, projectId, { isEnabled: false });
  }

  /**
   * Delete automation settings
   */
  async deleteAutomation(userId: string, projectId: string) {
    // Verify project ownership
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const automation = await this.prisma.projectAutomation.findUnique({
      where: { projectId },
    });

    if (!automation) {
      throw new NotFoundException('Automation settings not found');
    }

    await this.prisma.projectAutomation.delete({
      where: { projectId },
    });

    this.logger.log(`Automation settings deleted for project ${projectId}`);

    return { success: true };
  }

  /**
   * Get all enabled automations (for scheduler)
   */
  async getEnabledAutomations() {
    return this.prisma.projectAutomation.findMany({
      where: { isEnabled: true },
      include: {
        project: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get automation statistics
   */
  async getAutomationStats(userId: string) {
    const projects = await this.prisma.project.findMany({
      where: { userId },
      include: {
        automation: true,
        _count: {
          select: {
            contents: {
              where: {
                createdAt: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0)),
                },
              },
            },
          },
        },
      },
    });

    const enabledCount = projects.filter((p) => p.automation?.isEnabled).length;
    const totalContentsToday = projects.reduce(
      (acc, p) => acc + p._count.contents,
      0,
    );

    return {
      totalProjects: projects.length,
      enabledAutomations: enabledCount,
      disabledAutomations: projects.length - enabledCount,
      contentsGeneratedToday: totalContentsToday,
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        niche: p.niche,
        isEnabled: p.automation?.isEnabled ?? false,
        dailyLimit: p.automation?.dailyLimit ?? 0,
        contentsToday: p._count.contents,
      })),
    };
  }
}
