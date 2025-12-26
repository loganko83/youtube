import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from './gemini.service';
import { SafetyFilterService } from './safety-filter.service';
import { TtsService } from './tts.service';
import { VideoService } from './video.service';
import { YouTubeService } from '../youtube/youtube.service';
import { CreateContentDto } from './contents.dto';
import { ContentFormat, NicheType } from '@tubegenius/shared';
import { VideoPrivacyStatus } from '../youtube/youtube.dto';

@Injectable()
export class ContentsService {
  private readonly logger = new Logger(ContentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
    private readonly safetyFilter: SafetyFilterService,
    private readonly tts: TtsService,
    private readonly video: VideoService,
    private readonly youtube: YouTubeService,
  ) {}

  async create(userId: string, dto: CreateContentDto) {
    // Verify project ownership
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, userId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Create content job
    const content = await this.prisma.content.create({
      data: {
        projectId: dto.projectId,
        status: 'PENDING',
        config: dto.config as any,
      },
    });

    // Start async generation (in production, this would trigger n8n workflow)
    this.generateContentAsync(content.id, dto.config);

    return content;
  }

  private async generateContentAsync(contentId: string, config: any) {
    try {
      // Get content with project info for later use
      const content = await this.prisma.content.findUnique({
        where: { id: contentId },
        include: { project: true },
      });

      if (!content) {
        this.logger.error(`Content ${contentId} not found`);
        return;
      }

      // ============================================================
      // Stage 1: Script Generation
      // ============================================================
      await this.prisma.content.update({
        where: { id: contentId },
        data: { status: 'SCRIPT_GENERATING' },
      });

      const generated = await this.gemini.generateScript(config);

      // Safety check
      const safetyReport = await this.safetyFilter.check(generated, config.niche);

      if (!safetyReport.passed) {
        await this.prisma.content.update({
          where: { id: contentId },
          data: {
            status: 'FAILED',
            error: 'Safety check failed: ' + safetyReport.issues.map(i => i.description).join(', '),
          },
        });
        return;
      }

      // ============================================================
      // Stage 2: TTS Generation
      // ============================================================
      await this.prisma.content.update({
        where: { id: contentId },
        data: { status: 'TTS_PROCESSING' },
      });

      let ttsResult;
      try {
        ttsResult = await this.tts.generateAudio(
          generated.voiceoverText,
          config.niche,
          config.format,
          contentId,
        );

        this.logger.log(
          `TTS generation completed for content ${contentId}: ${ttsResult.durationSeconds}s, ${ttsResult.costUsd.toFixed(4)} USD`,
        );
      } catch (ttsError) {
        this.logger.error('TTS generation failed', ttsError);
        await this.prisma.content.update({
          where: { id: contentId },
          data: {
            status: 'FAILED',
            title: generated.title,
            script: generated.script,
            voiceoverText: generated.voiceoverText,
            error: ttsError instanceof Error ? ttsError.message : 'TTS generation failed',
          },
        });
        return;
      }

      // Update content with script and TTS info
      await this.prisma.content.update({
        where: { id: contentId },
        data: {
          title: generated.title,
          script: generated.script,
          voiceoverText: generated.voiceoverText,
          imagePrompts: generated.imagePrompts,
          criticalClaims: generated.criticalClaims,
          metadata: {
            ...generated.metadata,
            tts: {
              provider: ttsResult.provider,
              audioUrl: ttsResult.audioUrl,
              audioPath: ttsResult.audioPath,
              durationSeconds: ttsResult.durationSeconds,
              characterCount: ttsResult.characterCount,
              costUsd: ttsResult.costUsd,
              voiceId: ttsResult.voiceId,
              voiceSettings: ttsResult.voiceSettings,
              generatedAt: new Date().toISOString(),
            },
          } as any,
          safetyReport: safetyReport as any,
        },
      });

      // ============================================================
      // Stage 3: Video Rendering
      // ============================================================
      await this.prisma.content.update({
        where: { id: contentId },
        data: { status: 'VIDEO_RENDERING' },
      });

      let videoResult;
      try {
        videoResult = await this.video.renderVideo({
          templateId: this.video.getTemplateId(
            config.format as ContentFormat,
            config.niche as NicheType,
          ) ?? '',
          format: config.format as ContentFormat,
          niche: config.niche as NicheType,
          title: generated.title,
          script: generated.script,
          voiceoverText: generated.voiceoverText,
          audioUrl: ttsResult.audioUrl,
          imagePrompts: generated.imagePrompts,
          duration: ttsResult.durationSeconds,
          language: config.language || 'ko',
        });

        this.logger.log(
          `Video rendering completed for content ${contentId}: ${videoResult.url}`,
        );

        // Update content with video URL
        await this.prisma.content.update({
          where: { id: contentId },
          data: {
            videoUrl: videoResult.url,
            metadata: {
              ...(await this.getContentMetadata(contentId)),
              video: {
                renderId: videoResult.renderId,
                status: videoResult.status,
                url: videoResult.url,
                cost: videoResult.cost,
                generatedAt: new Date().toISOString(),
              },
            } as any,
          },
        });
      } catch (videoError) {
        this.logger.error('Video rendering failed', videoError);
        await this.prisma.content.update({
          where: { id: contentId },
          data: {
            status: 'FAILED',
            error: videoError instanceof Error ? videoError.message : 'Video rendering failed',
          },
        });
        return;
      }

      // ============================================================
      // Stage 4: YouTube Upload (if autoPublish enabled)
      // ============================================================
      const automation = await this.prisma.projectAutomation.findUnique({
        where: { projectId: content.projectId },
      });

      const project = content.project;
      const shouldUpload = automation?.autoPublish && project.youtubeChannelId;

      if (shouldUpload && videoResult.url) {
        await this.prisma.content.update({
          where: { id: contentId },
          data: { status: 'UPLOADING' },
        });

        try {
          const uploadResult = await this.youtube.uploadVideo({
            projectId: content.projectId,
            contentId: contentId,
            title: generated.title,
            description: this.generateVideoDescription(generated, config),
            tags: this.extractTags(generated),
            privacyStatus: VideoPrivacyStatus.PUBLIC,
          });

          this.logger.log(
            `YouTube upload completed for content ${contentId}: ${uploadResult.videoUrl}`,
          );

          // Update content with YouTube info - status already updated by YouTubeService
          await this.prisma.content.update({
            where: { id: contentId },
            data: {
              youtubeVideoId: uploadResult.videoId,
              publishedAt: new Date(),
              metadata: {
                ...(await this.getContentMetadata(contentId)),
                youtube: {
                  videoId: uploadResult.videoId,
                  videoUrl: uploadResult.videoUrl,
                  uploadedAt: new Date().toISOString(),
                },
              } as any,
            },
          });
        } catch (uploadError) {
          this.logger.error('YouTube upload failed', uploadError);
          // Don't fail the whole pipeline - video is ready, just upload failed
          await this.prisma.content.update({
            where: { id: contentId },
            data: {
              status: 'COMPLETED',
              error: 'YouTube upload failed: ' + (uploadError instanceof Error ? uploadError.message : 'Unknown error'),
            },
          });
          return;
        }
      }

      // ============================================================
      // Final Status Update
      // ============================================================
      await this.prisma.content.update({
        where: { id: contentId },
        data: { status: 'COMPLETED' },
      });

      this.logger.log(`Content pipeline completed for ${contentId}`);

    } catch (error) {
      this.logger.error('Content generation failed', error);
      await this.prisma.content.update({
        where: { id: contentId },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  /**
   * Get current content metadata
   */
  private async getContentMetadata(contentId: string): Promise<Record<string, any>> {
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
      select: { metadata: true },
    });
    return (content?.metadata as Record<string, any>) || {};
  }

  /**
   * Generate video description for YouTube
   */
  private generateVideoDescription(generated: any, config: any): string {
    const lines = [
      generated.script?.substring(0, 200) + '...',
      '',
      '#shorts #' + (config.niche || 'content').toLowerCase().replace(/[^a-z0-9]/g, ''),
      '',
      'Generated with TubeGenius AI',
    ];
    return lines.join('\n');
  }

  /**
   * Extract tags from generated content
   */
  private extractTags(generated: any): string[] {
    const tags: string[] = [];

    // Add keywords from image prompts
    if (generated.imagePrompts && Array.isArray(generated.imagePrompts)) {
      generated.imagePrompts.forEach((prompt: string) => {
        const words = prompt.split(' ').slice(0, 3);
        tags.push(...words);
      });
    }

    // Add common tags
    tags.push('shorts', 'ai', 'tubegenius');

    // Dedupe and limit
    return [...new Set(tags)].slice(0, 15);
  }

  async findAll(userId: string, projectId?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (projectId) {
      const project = await this.prisma.project.findFirst({
        where: { id: projectId, userId },
      });
      if (!project) {
        throw new NotFoundException('Project not found');
      }
      where.projectId = projectId;
    } else {
      where.project = { userId };
    }

    const [items, total] = await Promise.all([
      this.prisma.content.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { project: { select: { name: true, niche: true } } },
      }),
      this.prisma.content.count({ where }),
    ]);

    return {
      items,
      meta: { page, limit, total, hasMore: skip + items.length < total },
    };
  }

  async findOne(id: string, userId: string) {
    const content = await this.prisma.content.findFirst({
      where: { id, project: { userId } },
      include: { project: { select: { name: true, niche: true } } },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    return content;
  }
}
