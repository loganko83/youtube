import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { NicheType, ContentFormat } from '@tubegenius/shared';
import {
  ITTSProvider,
  TTSGenerationResult,
  TTSGenerationOptions,
  Voice,
  VoiceSettings,
  TTSProviderType,
} from './tts-provider.interface';
import { EdgeTtsService } from './edge-tts.service';
import { ElevenLabsTtsService } from './elevenlabs-tts.service';
import * as fs from 'fs/promises';

/**
 * TTS Service - Unified TTS service with provider pattern
 *
 * Supports multiple TTS providers:
 * - edge: Microsoft Edge TTS (FREE, recommended)
 * - elevenlabs: ElevenLabs API (premium, $0.30/1000 chars)
 *
 * Set TTS_PROVIDER environment variable to select provider:
 * - TTS_PROVIDER=edge (default, FREE)
 * - TTS_PROVIDER=elevenlabs (premium)
 *
 * Fallback behavior:
 * - If primary provider fails, automatically falls back to secondary
 */
@Injectable()
export class TtsService implements OnModuleInit {
  private readonly logger = new Logger(TtsService.name);
  private primaryProvider: ITTSProvider;
  private fallbackProvider: ITTSProvider | null = null;
  private readonly providerType: TTSProviderType;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly edgeTts: EdgeTtsService,
    private readonly elevenLabsTts: ElevenLabsTtsService,
  ) {
    // Default to Edge TTS (FREE!)
    this.providerType = (this.config.get<string>('TTS_PROVIDER') as TTSProviderType) || 'edge';
  }

  onModuleInit() {
    this.initializeProviders();
  }

  /**
   * Initialize TTS providers based on configuration
   */
  private initializeProviders(): void {
    if (this.providerType === 'elevenlabs') {
      this.primaryProvider = this.elevenLabsTts;
      this.fallbackProvider = this.edgeTts;
      this.logger.log('TTS Provider: ElevenLabs (primary), Edge TTS (fallback)');
    } else {
      this.primaryProvider = this.edgeTts;
      this.fallbackProvider = this.elevenLabsTts;
      this.logger.log('TTS Provider: Edge TTS (primary, FREE!), ElevenLabs (fallback)');
    }

    // Log cost savings info
    this.logger.log(
      `💰 Cost Savings: Edge TTS is FREE! Save ~$0.60 per content vs ElevenLabs`,
    );
  }

  /**
   * Get current provider type
   */
  getProviderType(): TTSProviderType {
    return this.providerType;
  }

  /**
   * Get primary provider
   */
  getPrimaryProvider(): ITTSProvider {
    return this.primaryProvider;
  }

  /**
   * Generate TTS audio from text
   * Uses primary provider with automatic fallback
   */
  async generateAudio(
    text: string,
    niche: NicheType,
    format: ContentFormat,
    contentId: string,
    customVoiceId?: string,
    customVoiceSettings?: VoiceSettings,
  ): Promise<TTSGenerationResult> {
    const options: TTSGenerationOptions = {};
    if (customVoiceId) options.voiceId = customVoiceId;
    if (customVoiceSettings) options.voiceSettings = customVoiceSettings;

    this.logger.log(`Generating TTS for content ${contentId} using ${this.primaryProvider.name}`);

    try {
      // Try primary provider
      const result = await this.primaryProvider.generateAudio(
        text,
        niche,
        format,
        contentId,
        options,
      );

      // Track cost in database
      await this.trackCost(contentId, result);

      return result;
    } catch (primaryError) {
      this.logger.warn(
        `Primary TTS provider (${this.primaryProvider.name}) failed: ${primaryError instanceof Error ? primaryError.message : 'Unknown error'}`,
      );

      // Try fallback provider if available
      if (this.fallbackProvider) {
        this.logger.log(`Trying fallback TTS provider: ${this.fallbackProvider.name}`);

        try {
          const result = await this.fallbackProvider.generateAudio(
            text,
            niche,
            format,
            contentId,
            options,
          );

          // Track cost in database
          await this.trackCost(contentId, result);

          return result;
        } catch (fallbackError) {
          this.logger.error(
            `Fallback TTS provider (${this.fallbackProvider.name}) also failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`,
          );
          throw fallbackError;
        }
      }

      throw primaryError;
    }
  }

  /**
   * Track TTS generation cost in database
   */
  private async trackCost(contentId: string, result: TTSGenerationResult): Promise<void> {
    try {
      // Get current metadata
      const content = await this.prisma.content.findUnique({
        where: { id: contentId },
        select: { metadata: true },
      });

      const currentMetadata = (content?.metadata as Record<string, any>) || {};

      await this.prisma.content.update({
        where: { id: contentId },
        data: {
          metadata: {
            ...currentMetadata,
            tts: {
              provider: result.provider,
              costUsd: result.costUsd,
              characterCount: result.characterCount,
              durationSeconds: result.durationSeconds,
              voiceId: result.voiceId,
              audioUrl: result.audioUrl,
              generatedAt: new Date().toISOString(),
            },
          },
        },
      });

      this.logger.debug(
        `TTS cost tracked: ${result.provider}, $${result.costUsd.toFixed(4)}, ${result.characterCount} chars`,
      );
    } catch (error) {
      // Non-critical error, log and continue
      this.logger.warn('Failed to track TTS cost in database', error);
    }
  }

  /**
   * Get available voices
   */
  async getAvailableVoices(niche?: NicheType): Promise<Voice[]> {
    return this.primaryProvider.getAvailableVoices();
  }

  /**
   * Get voice settings for a niche
   */
  getVoiceSettings(niche: NicheType): VoiceSettings {
    return this.primaryProvider.getVoiceSettings(niche);
  }

  /**
   * Estimate cost for text
   */
  estimateCost(text: string): { provider: TTSProviderType; cost: number } {
    return {
      provider: this.primaryProvider.name,
      cost: this.primaryProvider.estimateCost(text),
    };
  }

  /**
   * Compare costs between providers
   */
  compareCosts(text: string): {
    edge: number;
    elevenlabs: number;
    savings: number;
    savingsPercent: number;
  } {
    const edgeCost = this.edgeTts.estimateCost(text);
    const elevenLabsCost = this.elevenLabsTts.estimateCost(text);
    const savings = elevenLabsCost - edgeCost;
    const savingsPercent = elevenLabsCost > 0 ? (savings / elevenLabsCost) * 100 : 100;

    return {
      edge: edgeCost,
      elevenlabs: elevenLabsCost,
      savings,
      savingsPercent,
    };
  }

  /**
   * Delete audio file
   */
  async deleteAudioFile(audioPath: string): Promise<void> {
    try {
      await fs.unlink(audioPath);
      this.logger.debug(`Audio file deleted: ${audioPath}`);
    } catch (error) {
      this.logger.warn(`Failed to delete audio file: ${audioPath}`, error);
    }
  }

  /**
   * Get audio file stats
   */
  async getAudioStats(audioPath: string): Promise<{
    size: number;
    created: Date;
  }> {
    const stats = await fs.stat(audioPath);
    return {
      size: stats.size,
      created: stats.birthtime,
    };
  }

  /**
   * Health check for TTS service
   */
  async healthCheck(): Promise<{
    status: string;
    provider: TTSProviderType;
    primaryHealth: { status: string; quota?: any };
    fallbackHealth?: { status: string; quota?: any };
  }> {
    const primaryHealth = await this.primaryProvider.healthCheck();
    const fallbackHealth = this.fallbackProvider
      ? await this.fallbackProvider.healthCheck()
      : undefined;

    const status = primaryHealth.status === 'healthy' ? 'healthy' : 'degraded';

    return {
      status,
      provider: this.primaryProvider.name,
      primaryHealth,
      fallbackHealth,
    };
  }
}
