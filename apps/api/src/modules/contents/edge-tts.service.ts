import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NicheType, ContentFormat } from '@tubegenius/shared';
import {
  ITTSProvider,
  TTSGenerationResult,
  TTSGenerationOptions,
  Voice,
  VoiceSettings,
  EDGE_TTS_VOICES,
  EDGE_TTS_VOICE_SETTINGS,
} from './tts-provider.interface';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Edge TTS Service - FREE Microsoft Edge Text-to-Speech
 *
 * Uses Microsoft Edge's Read Aloud API for high-quality TTS
 * - Cost: $0.00 (completely free)
 * - Quality: 80-90% of ElevenLabs
 * - Korean voices: ko-KR-SunHiNeural, ko-KR-InJoonNeural, etc.
 * - Supports SSML for advanced control
 */
@Injectable()
export class EdgeTtsService implements ITTSProvider {
  private readonly logger = new Logger(EdgeTtsService.name);
  private readonly storageBasePath: string;
  private readonly maxRetries = 3;
  private readonly retryDelayMs = 1000;

  readonly name = 'edge' as const;

  constructor(private readonly config: ConfigService) {
    this.storageBasePath = this.config.get<string>('STORAGE_PATH') || './storage/audio';
    this.initializeStorage();
  }

  /**
   * Initialize storage directory
   */
  private async initializeStorage(): Promise<void> {
    try {
      await fs.mkdir(this.storageBasePath, { recursive: true });
      this.logger.log(`Storage initialized at: ${this.storageBasePath}`);
    } catch (error) {
      this.logger.error('Failed to initialize storage', error);
    }
  }

  /**
   * Generate audio from text using Edge TTS
   */
  async generateAudio(
    text: string,
    niche: NicheType,
    format: ContentFormat,
    contentId: string,
    options?: TTSGenerationOptions,
  ): Promise<TTSGenerationResult> {
    this.validateInput(text);

    const voice = options?.voiceId || this.getVoiceForNiche(niche).voiceId;
    const voiceSettings = options?.voiceSettings || this.getVoiceSettings(niche);

    this.logger.log(`[Edge TTS] Generating audio for content ${contentId}`);
    this.logger.debug(`Voice: ${voice}, Text length: ${text.length} chars`);

    let lastError: Error | null = null;

    // Retry logic
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.callEdgeTTS(text, voice, voiceSettings, contentId);

        this.logger.log(
          `[Edge TTS] Generation successful: ${result.durationSeconds}s, $${result.costUsd.toFixed(4)} USD (FREE!)`,
        );

        return result;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `[Edge TTS] Attempt ${attempt}/${this.maxRetries} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );

        if (attempt < this.maxRetries) {
          const delay = this.retryDelayMs * Math.pow(2, attempt - 1);
          this.logger.debug(`Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    throw new InternalServerErrorException(
      `Edge TTS generation failed after ${this.maxRetries} attempts: ${lastError?.message}`,
    );
  }

  /**
   * Call Edge TTS API
   */
  private async callEdgeTTS(
    text: string,
    voiceId: string,
    voiceSettings: VoiceSettings,
    contentId: string,
  ): Promise<TTSGenerationResult> {
    const startTime = Date.now();

    // Apply SSML for voice settings
    const ssmlText = this.buildSSML(text, voiceSettings);

    // Generate audio file
    const timestamp = Date.now();
    const filename = `${contentId}_${timestamp}.mp3`;
    const audioPath = path.join(this.storageBasePath, filename);

    // Dynamic import of msedge-tts
    const { MsEdgeTTS, OUTPUT_FORMAT } = await import('msedge-tts');
    const tts = new MsEdgeTTS();

    await tts.setMetadata(voiceId, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

    // toFile returns { audioFilePath, metadataFilePath }
    await tts.toFile(audioPath, ssmlText);

    const durationMs = Date.now() - startTime;

    // Estimate duration from text (~750 chars/min = 12.5 chars/sec)
    const estimatedDurationSeconds = Math.ceil((text.length / 750) * 60);

    this.logger.debug(`Audio generated in ${durationMs}ms, saved to ${audioPath}`);

    return {
      audioUrl: `/storage/audio/${filename}`,
      audioPath,
      durationSeconds: estimatedDurationSeconds,
      characterCount: text.length,
      costUsd: 0, // FREE!
      voiceId,
      voiceSettings,
      provider: 'edge',
    };
  }

  /**
   * Build SSML with voice settings
   */
  private buildSSML(text: string, settings: VoiceSettings): string {
    const rate = settings.rate || '+0%';
    const pitch = settings.pitch || '+0Hz';
    const volume = settings.volume || '+0%';

    // Escape special XML characters
    const escapedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

    return `<prosody rate="${rate}" pitch="${pitch}" volume="${volume}">${escapedText}</prosody>`;
  }

  /**
   * Get available Korean voices
   */
  async getAvailableVoices(language?: string): Promise<Voice[]> {
    const koreanVoices: Voice[] = [
      { voiceId: 'ko-KR-SunHiNeural', name: 'SunHi (여성, 따뜻함)', language: 'ko-KR', gender: 'female', provider: 'edge' },
      { voiceId: 'ko-KR-InJoonNeural', name: 'InJoon (남성, 전문적)', language: 'ko-KR', gender: 'male', provider: 'edge' },
      { voiceId: 'ko-KR-BongJinNeural', name: 'BongJin (남성, 캐주얼)', language: 'ko-KR', gender: 'male', provider: 'edge' },
      { voiceId: 'ko-KR-GookMinNeural', name: 'GookMin (남성, 뉴스)', language: 'ko-KR', gender: 'male', provider: 'edge' },
      { voiceId: 'ko-KR-JiMinNeural', name: 'JiMin (여성, 밝음)', language: 'ko-KR', gender: 'female', provider: 'edge' },
      { voiceId: 'ko-KR-SeoHyeonNeural', name: 'SeoHyeon (여성, 차분)', language: 'ko-KR', gender: 'female', provider: 'edge' },
      { voiceId: 'ko-KR-SoonBokNeural', name: 'SoonBok (여성, 성숙)', language: 'ko-KR', gender: 'female', provider: 'edge' },
      { voiceId: 'ko-KR-YuJinNeural', name: 'YuJin (여성, 젊음)', language: 'ko-KR', gender: 'female', provider: 'edge' },
    ];

    // Filter by language if specified
    if (language && language !== 'ko' && language !== 'ko-KR') {
      // Return empty if requesting non-Korean
      return [];
    }

    return koreanVoices;
  }

  /**
   * Get recommended voice for niche
   */
  getVoiceForNiche(niche: NicheType): Voice {
    return EDGE_TTS_VOICES[niche] || EDGE_TTS_VOICES['Senior Health'];
  }

  /**
   * Get voice settings for niche
   */
  getVoiceSettings(niche: NicheType): VoiceSettings {
    return EDGE_TTS_VOICE_SETTINGS[niche] || EDGE_TTS_VOICE_SETTINGS['Senior Health'];
  }

  /**
   * Cost is always $0 for Edge TTS
   */
  estimateCost(text: string): number {
    return 0;
  }

  /**
   * Validate input text
   */
  validateInput(text: string): void {
    if (!text || text.trim().length === 0) {
      throw new BadRequestException('Text cannot be empty');
    }

    // Edge TTS has no hard character limit, but we limit to reasonable size
    const maxChars = 10000;
    if (text.length > maxChars) {
      throw new BadRequestException(
        `Text exceeds maximum length of ${maxChars} characters`,
      );
    }
  }

  /**
   * Get maximum character limit
   */
  getMaxCharacterLimit(): number {
    return 10000; // Edge TTS is more flexible
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; quota?: any }> {
    try {
      // Try to load the module
      await import('msedge-tts');
      return {
        status: 'healthy',
        quota: {
          type: 'unlimited',
          cost: 0,
          message: 'Edge TTS is free with no usage limits',
        },
      };
    } catch (error) {
      return { status: 'unhealthy' };
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
