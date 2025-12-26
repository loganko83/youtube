import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  async handleN8nWebhook(payload: any) {
    const { event, contentJobId, data, timestamp } = payload;

    this.logger.log(`Received webhook: ${event} for content ${contentJobId}`);

    const content = await this.prisma.content.findUnique({
      where: { id: contentJobId },
    });

    if (!content) {
      throw new NotFoundException(`Content ${contentJobId} not found`);
    }

    switch (event) {
      case 'content.script_generated':
        return this.handleScriptGenerated(contentJobId, data);
      case 'content.tts_completed':
        return this.handleTtsCompleted(contentJobId, data);
      case 'content.video_rendered':
        return this.handleVideoRendered(contentJobId, data);
      case 'content.upload_completed':
        return this.handleUploadCompleted(contentJobId, data);
      case 'content.failed':
        return this.handleFailed(contentJobId, data);
      default:
        this.logger.warn(`Unknown webhook event: ${event}`);
        return { success: true, message: 'Event acknowledged' };
    }
  }

  private async handleScriptGenerated(contentId: string, data: any) {
    await this.prisma.content.update({
      where: { id: contentId },
      data: {
        status: 'TTS_PROCESSING',
        script: data.script,
        voiceoverText: data.voiceoverText,
        title: data.title,
      },
    });
    return { success: true, status: 'TTS_PROCESSING' };
  }

  private async handleTtsCompleted(contentId: string, data: any) {
    await this.prisma.content.update({
      where: { id: contentId },
      data: {
        status: 'VIDEO_RENDERING',
        audioUrl: data.audioUrl,
      },
    });
    return { success: true, status: 'VIDEO_RENDERING' };
  }

  private async handleVideoRendered(contentId: string, data: any) {
    await this.prisma.content.update({
      where: { id: contentId },
      data: {
        status: 'UPLOADING',
        videoUrl: data.videoUrl,
      },
    });
    return { success: true, status: 'UPLOADING' };
  }

  private async handleUploadCompleted(contentId: string, data: any) {
    await this.prisma.content.update({
      where: { id: contentId },
      data: {
        status: 'COMPLETED',
        youtubeVideoId: data.youtubeVideoId,
      },
    });
    return { success: true, status: 'COMPLETED' };
  }

  private async handleFailed(contentId: string, data: any) {
    await this.prisma.content.update({
      where: { id: contentId },
      data: {
        status: 'FAILED',
        error: data.error || 'Unknown error',
      },
    });
    return { success: true, status: 'FAILED' };
  }
}
