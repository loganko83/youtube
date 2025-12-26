import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NicheType, ContentFormat, VERTICAL_SETTINGS, COST_TARGETS_USD } from '@tubegenius/shared';
import {
  ITTSProvider,
  TTSGenerationResult,
  TTSGenerationOptions,
  Voice,
  VoiceSettings,
} from './tts-provider.interface';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * ElevenLabs TTS Service - High-quality premium TTS
 *
 * Uses ElevenLabs API for professional-grade TTS
 * - Cost: $0.30 per 1,000 characters (Creator plan)
 * - Quality: Industry-leading
 * - Korean support: eleven_multilingual_v2 model
 */
@Injectable()
export class ElevenLabsTtsService implements ITTSProvider {
  private readonly logger = new Logger(ElevenLabsTtsService.name);
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.elevenlabs.io/v1';
  private readonly maxRetries = 3;
  private readonly retryDelayMs = 1000;
  private readonly storageBasePath: string;

  // ElevenLabs Pricing: $0.30 per 1,000 characters
  private readonly costPerCharacter = 0.30 / 1000;

  readonly name = 'elevenlabs' as const;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('ELEVENLABS_API_KEY') || '';
    this.storageBasePath = this.config.get<string>('STORAGE_PATH') || './storage/audio';

    if (!this.apiKey) {
      this.logger.warn('ELEVENLABS_API_KEY not configured. ElevenLabs TTS will fail.');
    }

    this.initializeStorage();
  }

  /**
   * Initialize storage directory
   */
  private async initializeStorage(): Promise<void> {
    try {
      await fs.mkdir(this.storageBasePath, { recursive: true });
    } catch (error) {
      this.logger.error('Failed to initialize storage', error);
    }
  }

  /**
   * Generate audio from text using ElevenLabs API
   */
  async generateAudio(
    text: string,
    niche: NicheType,
    format: ContentFormat,
    contentId: string,
    options?: TTSGenerationOptions,
  ): Promise<TTSGenerationResult> {
    this.validateInput(text);

    const verticalConfig = VERTICAL_SETTINGS[niche];
    const voiceId = options?.voiceId || verticalConfig.voiceId;
    const voiceSettings = options?.voiceSettings || verticalConfig.voiceSettings;

    this.logger.log(`[ElevenLabs] Generating TTS for content ${contentId}`);
    this.logger.debug(`Voice: ${voiceId}, Text length: ${text.length} chars`);

    let lastError: Error | null = null;

    // Retry logic
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.callElevenLabsAPI(text, voiceId, voiceSettings, contentId);

        this.logger.log(
          `[ElevenLabs] Generation successful: ${result.durationSeconds}s, $${result.costUsd.toFixed(4)} USD`,
        );

        return result;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `[ElevenLabs] Attempt ${attempt}/${this.maxRetries} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );

        if (attempt < this.maxRetries) {
          const delay = this.retryDelayMs * Math.pow(2, attempt - 1);
          this.logger.debug(`Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    throw new InternalServerErrorException(
      `ElevenLabs TTS generation failed after ${this.maxRetries} attempts: ${lastError?.message}`,
    );
  }

  /**
   * Call ElevenLabs API to generate audio
   */
  private async callElevenLabsAPI(
    text: string,
    voiceId: string,
    voiceSettings: VoiceSettings,
    contentId: string,
  ): Promise<TTSGenerationResult> {
    const url = `${this.apiUrl}/text-to-speech/${voiceId}`;

    const requestBody = {
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: voiceSettings.stability ?? 0.7,
        similarity_boost: voiceSettings.similarity_boost ?? 0.8,
        style: voiceSettings.style ?? 0.3,
        use_speaker_boost: voiceSettings.use_speaker_boost ?? true,
      },
    };

    const startTime = Date.now();

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    const durationMs = Date.now() - startTime;

    // Save audio file
    const audioPath = await this.saveAudioFile(audioBuffer, contentId);

    // Estimate duration: ~750 chars/min
    const estimatedDurationSeconds = Math.ceil((text.length / 750) * 60);

    // Calculate cost
    const costUsd = this.estimateCost(text);

    this.logger.debug(`Audio generated in ${durationMs}ms, saved to ${audioPath}`);

    return {
      audioUrl: `/storage/audio/${path.basename(audioPath)}`,
      audioPath,
      durationSeconds: estimatedDurationSeconds,
      characterCount: text.length,
      costUsd,
      voiceId,
      voiceSettings,
      provider: 'elevenlabs',
    };
  }

  /**
   * Save audio buffer to file system
   */
  private async saveAudioFile(audioBuffer: Buffer, contentId: string): Promise<string> {
    const timestamp = Date.now();
    const filename = `${contentId}_${timestamp}.mp3`;
    const filePath = path.join(this.storageBasePath, filename);

    try {
      await fs.writeFile(filePath, audioBuffer);
      return filePath;
    } catch (error) {
      this.logger.error('Failed to save audio file', error);
      throw new InternalServerErrorException('Failed to save audio file');
    }
  }

  /**
   * Get available voices from ElevenLabs API
   */
  async getAvailableVoices(language?: string): Promise<Voice[]> {
    try {
      const response = await fetch(`${this.apiUrl}/voices`, {
        method: 'GET',
        headers: { 'xi-api-key': this.apiKey },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.statusText}`);
      }

      const data = await response.json() as { voices: any[] };

      return data.voices.map((v: any) => ({
        voiceId: v.voice_id,
        name: v.name,
        language: v.labels?.language || 'en',
        gender: v.labels?.gender || 'neutral',
        provider: 'elevenlabs' as const,
      }));
    } catch (error) {
      this.logger.error('Failed to fetch ElevenLabs voices', error);
      return [];
    }
  }

  /**
   * Get recommended voice for niche
   */
  getVoiceForNiche(niche: NicheType): Voice {
    const config = VERTICAL_SETTINGS[niche];
    return {
      voiceId: config.voiceId,
      name: config.voiceId,
      language: 'ko-KR',
      gender: 'neutral',
      provider: 'elevenlabs',
    };
  }

  /**
   * Get voice settings for niche
   */
  getVoiceSettings(niche: NicheType): VoiceSettings {
    return VERTICAL_SETTINGS[niche]?.voiceSettings || {
      stability: 0.7,
      similarity_boost: 0.8,
      style: 0.3,
      use_speaker_boost: true,
    };
  }

  /**
   * Estimate cost based on character count
   */
  estimateCost(text: string): number {
    const cost = text.length * this.costPerCharacter;

    if (cost > COST_TARGETS_USD.TTS_ELEVENLABS) {
      this.logger.warn(
        `TTS cost $${cost.toFixed(4)} exceeds target $${COST_TARGETS_USD.TTS_ELEVENLABS}`,
      );
    }

    return cost;
  }

  /**
   * Validate input text
   */
  validateInput(text: string): void {
    if (!text || text.trim().length === 0) {
      throw new BadRequestException('Text cannot be empty');
    }

    const maxChars = this.getMaxCharacterLimit();
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
    return 5000; // ElevenLabs standard limit
  }

  /**
   * Health check for ElevenLabs API
   */
  async healthCheck(): Promise<{ status: string; quota?: any }> {
    try {
      const response = await fetch(`${this.apiUrl}/user`, {
        method: 'GET',
        headers: { 'xi-api-key': this.apiKey },
      });

      if (!response.ok) {
        return { status: 'unhealthy' };
      }

      const userData = await response.json() as {
        subscription?: { character_count?: number; character_limit?: number };
      };

      return {
        status: 'healthy',
        quota: {
          characterCount: userData.subscription?.character_count || 0,
          characterLimit: userData.subscription?.character_limit || 0,
        },
      };
    } catch (error) {
      this.logger.error('ElevenLabs health check failed', error);
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
