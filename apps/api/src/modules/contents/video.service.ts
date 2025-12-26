import { Injectable, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContentFormat, NicheType } from '@tubegenius/shared';
import axios, { AxiosInstance } from 'axios';

/**
 * Video Rendering Service
 * Integrates with Creatomate API for professional video rendering
 * Supports Shorts (9:16) and Long-form (16:9) formats
 */

// ============================================================
// Types & Interfaces
// ============================================================

export interface VideoRenderRequest {
  templateId: string;
  format: ContentFormat;
  niche: NicheType;
  title: string;
  script: string;
  voiceoverText: string;
  audioUrl?: string;
  imagePrompts: string[];
  imageUrls?: string[];
  duration?: number;
  language: string;
}

export interface VideoRenderResult {
  renderId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  url?: string;
  duration?: number;
  cost?: number;
  error?: string;
}

interface CreatomateRenderRequest {
  template_id?: string;
  template?: CreatomateTemplate;
  modifications?: Record<string, any>;
  output_format?: 'mp4' | 'gif' | 'png';
  frame_rate?: number;
  resolution?: string;
}

interface CreatomateTemplate {
  width: number;
  height: number;
  frame_rate: number;
  duration: number;
  elements: CreatomateElement[];
}

interface CreatomateElement {
  type: string;
  track: number;
  time: number;
  duration: number;
  x?: string;
  y?: string;
  width?: string;
  height?: string;
  [key: string]: any;
}

interface CreatomateRenderResponse {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  url?: string;
  snapshot_url?: string;
  error_message?: string;
  estimated_cost?: number;
  actual_cost?: number;
}

// ============================================================
// Video Service Implementation
// ============================================================

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);
  private readonly client: AxiosInstance;
  private readonly apiKey: string;
  private readonly maxPollAttempts = 60; // 5 minutes with 5-second intervals
  private readonly pollIntervalMs = 5000;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('CREATOMATE_API_KEY') || '';

    if (!this.apiKey) {
      this.logger.warn('CREATOMATE_API_KEY not configured. Video rendering will be disabled.');
    }

    this.client = axios.create({
      baseURL: 'https://api.creatomate.com/v1',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Render video from content
   * Main entry point for video generation
   */
  async renderVideo(request: VideoRenderRequest): Promise<VideoRenderResult> {
    this.validateApiKey();

    try {
      this.logger.log(`Starting video render: format=${request.format}, niche=${request.niche}`);

      // Build Creatomate render request
      const renderRequest = this.buildRenderRequest(request);

      // Submit render job
      const response = await this.client.post<CreatomateRenderResponse[]>('/renders', [renderRequest]);
      const render = response.data[0];

      if (!render || !render.id) {
        throw new InternalServerErrorException('Failed to create render job');
      }

      this.logger.log(`Render job created: ${render.id}`);

      // Poll for completion
      const result = await this.pollRenderStatus(render.id);

      this.logger.log(`Render completed: ${render.id}, url=${result.url}`);

      return result;
    } catch (error) {
      this.logger.error(`Video render failed: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Video rendering failed');
    }
  }

  /**
   * Build Creatomate render request from content
   */
  private buildRenderRequest(request: VideoRenderRequest): CreatomateRenderRequest {
    const isShorts = request.format === ContentFormat.SHORTS;
    const template = this.buildTemplate(request, isShorts);

    return {
      template,
      output_format: 'mp4',
      frame_rate: 30,
      resolution: isShorts ? '1080x1920' : '1920x1080',
    };
  }

  /**
   * Build Creatomate template with all elements
   */
  private buildTemplate(request: VideoRenderRequest, isShorts: boolean): CreatomateTemplate {
    const width = isShorts ? 1080 : 1920;
    const height = isShorts ? 1920 : 1080;
    const duration = request.duration || this.estimateDuration(request.voiceoverText);

    const elements: CreatomateElement[] = [];

    // Background video/images
    elements.push(...this.createBackgroundElements(request, duration, width, height));

    // Subtitles (large, high contrast for seniors)
    if (request.niche === NicheType.SENIOR_HEALTH) {
      elements.push(...this.createSeniorFriendlySubtitles(request, duration, width, height));
    } else {
      elements.push(...this.createStandardSubtitles(request, duration, width, height));
    }

    // Audio track
    if (request.audioUrl) {
      elements.push(this.createAudioElement(request.audioUrl, duration));
    }

    // Branding elements
    elements.push(...this.createBrandingElements(request, duration, width, height, isShorts));

    return {
      width,
      height,
      frame_rate: 30,
      duration,
      elements,
    };
  }

  /**
   * Create background image/video elements
   */
  private createBackgroundElements(
    request: VideoRenderRequest,
    duration: number,
    width: number,
    height: number,
  ): CreatomateElement[] {
    const elements: CreatomateElement[] = [];
    const imageUrls = request.imageUrls || [];
    const segmentDuration = duration / Math.max(imageUrls.length, 1);

    if (imageUrls.length === 0) {
      // Solid color background
      elements.push({
        type: 'shape',
        track: 1,
        time: 0,
        duration,
        width: '100%',
        height: '100%',
        fill_color: this.getBackgroundColor(request.niche),
      });
    } else {
      // Image slideshow
      imageUrls.forEach((url, index) => {
        elements.push({
          type: 'image',
          track: 1,
          time: index * segmentDuration,
          duration: segmentDuration,
          source: url,
          width: '100%',
          height: '100%',
          fit: 'cover',
          animations: [
            { time: 'start', duration: 0.5, easing: 'ease-in-out', opacity: [0, 1] },
            { time: 'end', duration: 0.5, easing: 'ease-in-out', opacity: [1, 0] },
          ],
        });
      });
    }

    return elements;
  }

  /**
   * Create senior-friendly subtitles (large, high contrast)
   */
  private createSeniorFriendlySubtitles(
    request: VideoRenderRequest,
    duration: number,
    width: number,
    height: number,
  ): CreatomateElement[] {
    const words = request.voiceoverText.split(' ');
    const wordsPerSegment = 3; // 3 words at a time for readability
    const segmentDuration = duration / Math.ceil(words.length / wordsPerSegment);

    const subtitles: CreatomateElement[] = [];

    for (let i = 0; i < words.length; i += wordsPerSegment) {
      const text = words.slice(i, i + wordsPerSegment).join(' ');
      const segmentIndex = i / wordsPerSegment;

      subtitles.push({
        type: 'text',
        track: 3,
        time: segmentIndex * segmentDuration,
        duration: segmentDuration,
        text: text,
        font_family: 'Noto Sans KR',
        font_weight: '700',
        font_size: '80px', // Large for seniors
        color: '#FFFFFF',
        stroke_color: '#000000',
        stroke_width: '8px',
        x: '50%',
        y: '50%',
        width: '90%',
        align: 'center',
        y_alignment: '50%',
        x_alignment: '50%',
        animations: [
          { time: 'start', duration: 0.3, easing: 'ease-out', scale: [0.8, 1] },
        ],
      });
    }

    return subtitles;
  }

  /**
   * Create standard subtitles for other niches
   */
  private createStandardSubtitles(
    request: VideoRenderRequest,
    duration: number,
    width: number,
    height: number,
  ): CreatomateElement[] {
    const sentences = request.voiceoverText.split(/[.!?]+/).filter(s => s.trim());
    const segmentDuration = duration / sentences.length;

    const subtitles: CreatomateElement[] = [];

    sentences.forEach((sentence, index) => {
      subtitles.push({
        type: 'text',
        track: 3,
        time: index * segmentDuration,
        duration: segmentDuration,
        text: sentence.trim(),
        font_family: 'Noto Sans KR',
        font_weight: '600',
        font_size: '48px',
        color: '#FFFFFF',
        stroke_color: '#000000',
        stroke_width: '4px',
        x: '50%',
        y: '85%',
        width: '90%',
        align: 'center',
        y_alignment: '50%',
        x_alignment: '50%',
      });
    });

    return subtitles;
  }

  /**
   * Create audio element
   */
  private createAudioElement(audioUrl: string, duration: number): CreatomateElement {
    return {
      type: 'audio',
      track: 4,
      time: 0,
      duration,
      source: audioUrl,
      volume: 1.0,
    };
  }

  /**
   * Create branding elements (logo, channel name)
   */
  private createBrandingElements(
    request: VideoRenderRequest,
    duration: number,
    width: number,
    height: number,
    isShorts: boolean,
  ): CreatomateElement[] {
    const elements: CreatomateElement[] = [];

    // Channel name watermark
    elements.push({
      type: 'text',
      track: 5,
      time: 0,
      duration,
      text: 'TubeGenius AI',
      font_family: 'Noto Sans KR',
      font_weight: '500',
      font_size: isShorts ? '24px' : '28px',
      color: '#FFFFFF',
      opacity: 0.7,
      x: '95%',
      y: '5%',
      x_alignment: '100%',
      y_alignment: '0%',
    });

    return elements;
  }

  /**
   * Poll render status until completion
   */
  private async pollRenderStatus(renderId: string): Promise<VideoRenderResult> {
    for (let attempt = 0; attempt < this.maxPollAttempts; attempt++) {
      await this.sleep(this.pollIntervalMs);

      try {
        const response = await this.client.get<CreatomateRenderResponse>(`/renders/${renderId}`);
        const render = response.data;

        this.logger.debug(`Poll attempt ${attempt + 1}/${this.maxPollAttempts}: status=${render.status}`);

        if (render.status === 'completed') {
          return {
            renderId,
            status: 'completed',
            url: render.url,
            cost: render.actual_cost || render.estimated_cost,
          };
        }

        if (render.status === 'failed') {
          return {
            renderId,
            status: 'failed',
            error: render.error_message || 'Render failed',
          };
        }
      } catch (error) {
        this.logger.warn(`Poll attempt ${attempt + 1} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    throw new InternalServerErrorException('Render timeout - exceeded maximum poll attempts');
  }

  /**
   * Get render status
   */
  async getRenderStatus(renderId: string): Promise<VideoRenderResult> {
    this.validateApiKey();

    try {
      const response = await this.client.get<CreatomateRenderResponse>(`/renders/${renderId}`);
      const render = response.data;

      return {
        renderId,
        status: render.status,
        url: render.url,
        cost: render.actual_cost || render.estimated_cost,
        error: render.error_message,
      };
    } catch (error) {
      this.logger.error(`Failed to get render status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new InternalServerErrorException('Failed to get render status');
    }
  }

  /**
   * Cancel render job
   */
  async cancelRender(renderId: string): Promise<void> {
    this.validateApiKey();

    try {
      await this.client.delete(`/renders/${renderId}`);
      this.logger.log(`Render cancelled: ${renderId}`);
    } catch (error) {
      this.logger.error(`Failed to cancel render: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new InternalServerErrorException('Failed to cancel render');
    }
  }

  // ============================================================
  // Helper Methods
  // ============================================================

  private estimateDuration(text: string): number {
    // Estimate ~150 words per minute for Korean
    const words = text.split(/\s+/).length;
    const minutes = words / 150;
    return Math.max(minutes * 60, 10); // Minimum 10 seconds
  }

  private getBackgroundColor(niche: NicheType): string {
    const colors = {
      [NicheType.SENIOR_HEALTH]: '#4A90A4',
      [NicheType.FINANCE]: '#1E3A5F',
      [NicheType.TECH_AI]: '#0D1117',
      [NicheType.HISTORY]: '#2F2F2F',
      [NicheType.COMMERCE]: '#2C3E50',
    };
    return colors[niche] || '#1E1E1E';
  }

  private validateApiKey(): void {
    if (!this.apiKey) {
      throw new BadRequestException('Creatomate API key not configured');
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get template ID for format and niche
   * In production, these would be pre-created templates in Creatomate
   */
  getTemplateId(format: ContentFormat, niche: NicheType): string | null {
    // Template naming convention: {format}_{niche}
    const templates: Record<string, string> = {
      'shorts_senior_health': 'tmpl_shorts_senior_health',
      'shorts_finance': 'tmpl_shorts_finance',
      'shorts_tech_ai': 'tmpl_shorts_tech',
      'shorts_history': 'tmpl_shorts_history',
      'shorts_commerce': 'tmpl_shorts_commerce',
      'long_form_senior_health': 'tmpl_long_senior_health',
      'long_form_finance': 'tmpl_long_finance',
      'long_form_tech_ai': 'tmpl_long_tech',
      'long_form_history': 'tmpl_long_history',
      'long_form_commerce': 'tmpl_long_commerce',
    };

    const key = `${format.toLowerCase().replace(' ', '_')}_${niche.toLowerCase().replace(/[^a-z]/g, '_')}`;
    return templates[key] || null;
  }
}
