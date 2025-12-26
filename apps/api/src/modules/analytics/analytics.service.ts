/**
 * Analytics Service - Cost tracking and success rate metrics
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CostBreakdown, SuccessRateMetrics, AutomationMetrics } from './analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get cost breakdown for a user
   */
  async getCostBreakdown(userId: string): Promise<CostBreakdown> {
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all contents for user with metadata
    const contents = await this.prisma.content.findMany({
      where: {
        project: { userId },
        status: { in: ['COMPLETED', 'SCHEDULED'] },
      },
      include: {
        project: {
          select: { niche: true },
        },
      },
    });

    let totalTts = 0;
    let edgeTtsCost = 0;
    let elevenLabsCost = 0;
    let totalVideo = 0;
    const nichesCosts: Record<string, number> = {};
    let todayCost = 0;
    let weekCost = 0;
    let monthCost = 0;

    for (const content of contents) {
      const metadata = content.metadata as Record<string, any> | null;
      const ttsInfo = metadata?.tts;
      const videoInfo = metadata?.video;

      // TTS costs
      if (ttsInfo?.costUsd) {
        const cost = Number(ttsInfo.costUsd) || 0;
        totalTts += cost;

        if (ttsInfo.provider === 'edge-tts') {
          edgeTtsCost += cost;
        } else if (ttsInfo.provider === 'elevenlabs') {
          elevenLabsCost += cost;
        }
      }

      // Video costs
      if (videoInfo?.cost) {
        const cost = Number(videoInfo.cost) || 0;
        totalVideo += cost;
      }

      // Per-niche costs
      const niche = content.project?.niche || 'unknown';
      const contentCost = (ttsInfo?.costUsd || 0) + (videoInfo?.cost || 0);
      nichesCosts[niche] = (nichesCosts[niche] || 0) + contentCost;

      // Period costs
      const createdAt = new Date(content.createdAt);
      if (createdAt >= startOfToday) {
        todayCost += contentCost;
      }
      if (createdAt >= startOfWeek) {
        weekCost += contentCost;
      }
      if (createdAt >= startOfMonth) {
        monthCost += contentCost;
      }
    }

    // Calculate savings (what would have cost with ElevenLabs if using Edge TTS)
    // Estimate: Edge TTS saves ~$0.30 per 1000 chars
    const edgeTtsContents = contents.filter(
      (c) => (c.metadata as any)?.tts?.provider === 'edge-tts',
    );
    const estimatedSavings = edgeTtsContents.reduce((sum, c) => {
      const chars = (c.metadata as any)?.tts?.characterCount || 0;
      return sum + (chars / 1000) * 0.3;
    }, 0);

    return {
      total: totalTts + totalVideo,
      tts: {
        total: totalTts,
        edgeTts: edgeTtsCost,
        elevenlabs: elevenLabsCost,
        savings: estimatedSavings,
      },
      video: {
        total: totalVideo,
        creatomate: totalVideo,
      },
      byNiche: nichesCosts,
      byPeriod: {
        today: todayCost,
        thisWeek: weekCost,
        thisMonth: monthCost,
      },
    };
  }

  /**
   * Get success rate metrics for a user
   */
  async getSuccessRates(userId: string): Promise<SuccessRateMetrics> {
    // Get all contents
    const contents = await this.prisma.content.findMany({
      where: { project: { userId } },
      select: {
        id: true,
        title: true,
        status: true,
        error: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = contents.length;
    const completed = contents.filter((c) =>
      ['COMPLETED', 'SCHEDULED'].includes(c.status),
    ).length;
    const failed = contents.filter((c) => c.status === 'FAILED').length;

    // Stage failure analysis
    const scriptFailed = contents.filter(
      (c) => c.status === 'FAILED' && c.error?.includes('script'),
    ).length;
    const ttsFailed = contents.filter(
      (c) =>
        c.status === 'FAILED' && c.error?.toLowerCase().includes('tts'),
    ).length;
    const videoFailed = contents.filter(
      (c) =>
        c.status === 'FAILED' &&
        (c.error?.toLowerCase().includes('video') ||
          c.error?.toLowerCase().includes('render')),
    ).length;
    const uploadFailed = contents.filter(
      (c) =>
        c.status === 'FAILED' &&
        (c.error?.toLowerCase().includes('youtube') ||
          c.error?.toLowerCase().includes('upload')),
    ).length;

    // Recent failures
    const recentFailures = contents
      .filter((c) => c.status === 'FAILED')
      .slice(0, 10)
      .map((c) => ({
        id: c.id,
        title: c.title || '제목 없음',
        stage: this.getFailedStage(c.error),
        error: c.error || '알 수 없는 오류',
        createdAt: c.createdAt,
      }));

    // Daily trend (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const trend = last7Days.map((date) => {
      const dayContents = contents.filter(
        (c) => c.createdAt.toISOString().split('T')[0] === date,
      );
      return {
        date,
        total: dayContents.length,
        success: dayContents.filter((c) =>
          ['COMPLETED', 'SCHEDULED'].includes(c.status),
        ).length,
        failed: dayContents.filter((c) => c.status === 'FAILED').length,
      };
    });

    const stagesReached = contents.filter((c) =>
      !['PENDING', 'SCRIPT_GENERATING'].includes(c.status),
    ).length;

    return {
      overall: {
        total,
        success: completed,
        failed,
        successRate: total > 0 ? (completed / total) * 100 : 0,
      },
      byStage: {
        script: {
          total,
          failed: scriptFailed,
          failureRate: total > 0 ? (scriptFailed / total) * 100 : 0,
        },
        tts: {
          total: stagesReached,
          failed: ttsFailed,
          failureRate: stagesReached > 0 ? (ttsFailed / stagesReached) * 100 : 0,
        },
        video: {
          total: stagesReached - ttsFailed,
          failed: videoFailed,
          failureRate:
            stagesReached - ttsFailed > 0
              ? (videoFailed / (stagesReached - ttsFailed)) * 100
              : 0,
        },
        upload: {
          total: stagesReached - ttsFailed - videoFailed,
          failed: uploadFailed,
          failureRate:
            stagesReached - ttsFailed - videoFailed > 0
              ? (uploadFailed / (stagesReached - ttsFailed - videoFailed)) * 100
              : 0,
        },
      },
      recentFailures,
      trend,
    };
  }

  /**
   * Get automation metrics for a user
   */
  async getAutomationMetrics(userId: string): Promise<AutomationMetrics> {
    // Get projects with automation status
    const projects = await this.prisma.project.findMany({
      where: { userId },
      include: {
        automation: true,
        contents: {
          select: {
            id: true,
            metadata: true,
            createdAt: true,
          },
        },
      },
    });

    let totalAutomated = 0;
    let totalManual = 0;

    const byProject = projects.map((project) => {
      const automated = project.contents.filter(
        (c) => (c.metadata as any)?.source === 'automation',
      ).length;
      const manual = project.contents.length - automated;
      totalAutomated += automated;
      totalManual += manual;

      return {
        projectId: project.id,
        projectName: project.name,
        niche: project.niche,
        automated,
        manual,
        isEnabled: project.automation?.isEnabled ?? false,
      };
    });

    // Daily trend (last 7 days)
    const allContents = projects.flatMap((p) => p.contents);
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const dailyTrend = last7Days.map((date) => {
      const dayContents = allContents.filter(
        (c) => c.createdAt.toISOString().split('T')[0] === date,
      );
      return {
        date,
        automated: dayContents.filter(
          (c) => (c.metadata as any)?.source === 'automation',
        ).length,
        manual: dayContents.filter(
          (c) => (c.metadata as any)?.source !== 'automation',
        ).length,
      };
    });

    const totalContents = totalAutomated + totalManual;

    return {
      overview: {
        totalContents,
        automated: totalAutomated,
        manual: totalManual,
        automationRate: totalContents > 0 ? (totalAutomated / totalContents) * 100 : 0,
      },
      byProject,
      dailyTrend,
    };
  }

  private getFailedStage(error: string | null): string {
    if (!error) return '알 수 없음';
    const lowerError = error.toLowerCase();
    if (lowerError.includes('script') || lowerError.includes('gemini'))
      return '스크립트';
    if (lowerError.includes('tts') || lowerError.includes('audio')) return 'TTS';
    if (lowerError.includes('video') || lowerError.includes('render'))
      return '비디오';
    if (lowerError.includes('youtube') || lowerError.includes('upload'))
      return '업로드';
    return '알 수 없음';
  }
}
