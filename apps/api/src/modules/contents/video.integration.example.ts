/**
 * VideoService Integration Example
 *
 * This file demonstrates how to integrate VideoService into the content generation workflow.
 * Copy the relevant parts into contents.service.ts for production use.
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VideoService, VideoRenderRequest } from './video.service';
import { ContentFormat, NicheType } from '@tubegenius/shared';

@Injectable()
export class ContentsServiceWithVideoExample {
  constructor(
    private readonly prisma: PrismaService,
    private readonly videoService: VideoService,
  ) {}

  /**
   * Example: Complete content generation workflow with video rendering
   */
  async generateContentWithVideo(contentId: string, config: any) {
    try {
      // Step 1: Update status to script_generating
      await this.prisma.content.update({
        where: { id: contentId },
        data: { status: 'SCRIPT_GENERATING' },
      });

      // Step 2: Generate script (already implemented in ContentsService)
      // const generated = await this.gemini.generateScript(config);

      // Mock data for example
      const generated = {
        title: 'Example Video Title',
        script: 'Full script content here...',
        voiceoverText: 'Voiceover text for TTS...',
        imagePrompts: ['Scene 1 description', 'Scene 2 description'],
        criticalClaims: [],
        metadata: { description: 'Video description', tags: ['tag1', 'tag2'] },
        safetyReport: { passed: true, issues: [], disclaimerRequired: false },
      };

      // Step 3: Update status to tts_processing
      await this.prisma.content.update({
        where: { id: contentId },
        data: { status: 'TTS_PROCESSING' },
      });

      // Step 4: Generate TTS audio (integrate TtsService here)
      // const audioUrl = await this.ttsService.generateAudio(generated.voiceoverText);
      const audioUrl = 'https://example.com/audio.mp3'; // Mock URL

      // Step 5: Generate scene images (could integrate with Gemini image generation)
      // const imageUrls = await this.generateSceneImages(generated.imagePrompts);
      const imageUrls = [
        'https://example.com/scene1.jpg',
        'https://example.com/scene2.jpg',
      ];

      // Step 6: Update status to video_rendering
      await this.prisma.content.update({
        where: { id: contentId },
        data: { status: 'VIDEO_RENDERING' },
      });

      // Step 7: Render video
      const videoRequest: VideoRenderRequest = {
        templateId: this.videoService.getTemplateId(config.format, config.niche) || '',
        format: config.format,
        niche: config.niche,
        title: generated.title,
        script: generated.script,
        voiceoverText: generated.voiceoverText,
        audioUrl: audioUrl,
        imagePrompts: generated.imagePrompts,
        imageUrls: imageUrls,
        language: config.language,
      };

      const renderResult = await this.videoService.renderVideo(videoRequest);

      if (renderResult.status === 'failed') {
        throw new Error(renderResult.error || 'Video rendering failed');
      }

      // Step 8: Update content with video URL and mark as completed
      await this.prisma.content.update({
        where: { id: contentId },
        data: {
          status: 'COMPLETED',
          title: generated.title,
          script: generated.script,
          voiceoverText: generated.voiceoverText,
          imagePrompts: generated.imagePrompts,
          criticalClaims: generated.criticalClaims,
          metadata: {
            ...generated.metadata,
            renderingCost: renderResult.cost,
          } as any,
          safetyReport: generated.safetyReport as any,
          audioUrl: audioUrl,
          videoUrl: renderResult.url,
        },
      });

      return {
        contentId,
        status: 'completed',
        videoUrl: renderResult.url,
        cost: renderResult.cost,
      };
    } catch (error) {
      // Handle errors and update status
      await this.prisma.content.update({
        where: { id: contentId },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Example: Monitor video rendering progress
   */
  async checkRenderStatus(contentId: string, renderId: string) {
    const status = await this.videoService.getRenderStatus(renderId);

    // Update content status based on render status
    if (status.status === 'completed') {
      // Get existing content to merge metadata
      const existingContent = await this.prisma.content.findUnique({
        where: { id: contentId },
        select: { metadata: true },
      });

      await this.prisma.content.update({
        where: { id: contentId },
        data: {
          status: 'COMPLETED',
          videoUrl: status.url,
          metadata: {
            ...(existingContent?.metadata as object || {}),
            renderingCost: status.cost,
          } as any,
        },
      });
    } else if (status.status === 'failed') {
      await this.prisma.content.update({
        where: { id: contentId },
        data: {
          status: 'FAILED',
          error: status.error || 'Video rendering failed',
        },
      });
    }

    return status;
  }

  /**
   * Example: Cancel video rendering
   */
  async cancelContentRendering(contentId: string, renderId: string) {
    await this.videoService.cancelRender(renderId);

    await this.prisma.content.update({
      where: { id: contentId },
      data: {
        status: 'FAILED',
        error: 'Rendering cancelled by user',
      },
    });
  }

  /**
   * Example: Estimate video rendering cost before starting
   */
  async estimateRenderingCost(config: any): Promise<number> {
    const { estimateRenderingCost } = await import('@tubegenius/shared');

    // Estimate duration based on script length
    const estimatedDuration = this.estimateDuration(config.topic, config.format);

    // Default to STANDARD quality
    const quality = 'STANDARD';

    return estimateRenderingCost(estimatedDuration, quality);
  }

  /**
   * Helper: Estimate video duration
   */
  private estimateDuration(topic: string, format: ContentFormat): number {
    if (format === ContentFormat.SHORTS) {
      return 45; // 45 seconds average for Shorts
    }
    return 480; // 8 minutes average for long-form
  }
}

/**
 * Usage in API Controller:
 *
 * @Post()
 * async createContent(@Req() req, @Body() dto: CreateContentDto) {
 *   const userId = req.user.id;
 *   const content = await this.contentsService.create(userId, dto);
 *
 *   // Return immediately with content job ID
 *   return {
 *     success: true,
 *     data: {
 *       id: content.id,
 *       status: content.status,
 *       message: 'Content generation started'
 *     }
 *   };
 * }
 *
 * @Get(':id/status')
 * async getStatus(@Req() req, @Param('id') id: string) {
 *   const userId = req.user.id;
 *   const content = await this.contentsService.findOne(id, userId);
 *
 *   return {
 *     success: true,
 *     data: {
 *       id: content.id,
 *       status: content.status,
 *       videoUrl: content.videoUrl,
 *       cost: content.renderingCost,
 *       error: content.error
 *     }
 *   };
 * }
 */

/**
 * Environment Variables Required:
 *
 * CREATOMATE_API_KEY=your_api_key_here
 *
 * Get your API key from: https://creatomate.com/docs/api/rest-api/authentication
 */

/**
 * Database Schema Updates Required:
 *
 * model Content {
 *   ...existing fields...
 *   audioUrl       String?
 *   videoUrl       String?
 *   renderId       String?
 *   renderingCost  Float?
 * }
 */
