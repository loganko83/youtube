import { NicheType, ContentFormat } from '@tubegenius/shared';

/**
 * Voice settings interface for TTS generation
 */
export interface VoiceSettings {
  stability?: number;
  similarity_boost?: number;
  style?: number;
  use_speaker_boost?: boolean;
  // Edge TTS specific
  rate?: string;    // e.g., '+0%', '-10%', '+20%'
  pitch?: string;   // e.g., '+0Hz', '-10Hz', '+5Hz'
  volume?: string;  // e.g., '+0%', '-10%', '+10%'
}

/**
 * Voice information
 */
export interface Voice {
  voiceId: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  provider: TTSProviderType;
}

/**
 * TTS generation result
 */
export interface TTSGenerationResult {
  audioUrl: string;
  audioPath: string;
  durationSeconds: number;
  characterCount: number;
  costUsd: number;
  voiceId: string;
  voiceSettings: VoiceSettings;
  provider: TTSProviderType;
}

/**
 * TTS generation options
 */
export interface TTSGenerationOptions {
  voiceId?: string;
  voiceSettings?: VoiceSettings;
  format?: 'mp3' | 'wav' | 'ogg';
  outputPath?: string;
}

/**
 * Available TTS providers
 */
export type TTSProviderType = 'edge' | 'elevenlabs';

/**
 * TTS Provider interface - strategy pattern for different TTS services
 */
export interface ITTSProvider {
  /**
   * Provider name
   */
  readonly name: TTSProviderType;

  /**
   * Generate audio from text
   * @param text - Text to convert to speech
   * @param niche - Content niche for voice selection
   * @param format - Content format (Shorts/Long-form)
   * @param contentId - Unique content identifier for file naming
   * @param options - Additional generation options
   */
  generateAudio(
    text: string,
    niche: NicheType,
    format: ContentFormat,
    contentId: string,
    options?: TTSGenerationOptions,
  ): Promise<TTSGenerationResult>;

  /**
   * Get available voices for this provider
   * @param language - Filter by language code (optional)
   */
  getAvailableVoices(language?: string): Promise<Voice[]>;

  /**
   * Get recommended voice for a niche
   * @param niche - Content niche
   */
  getVoiceForNiche(niche: NicheType): Voice;

  /**
   * Get voice settings for a niche
   * @param niche - Content niche
   */
  getVoiceSettings(niche: NicheType): VoiceSettings;

  /**
   * Estimate cost for text
   * @param text - Text to estimate cost for
   */
  estimateCost(text: string): number;

  /**
   * Validate input text
   * @param text - Text to validate
   */
  validateInput(text: string): void;

  /**
   * Health check for the provider
   */
  healthCheck(): Promise<{ status: string; quota?: any }>;

  /**
   * Get maximum character limit
   */
  getMaxCharacterLimit(): number;
}

/**
 * Edge TTS voice mapping by niche
 * Korean voices available:
 * - ko-KR-SunHiNeural (Female): Warm, friendly
 * - ko-KR-InJoonNeural (Male): Professional, trustworthy
 * - ko-KR-BongJinNeural (Male): Casual
 * - ko-KR-GookMinNeural (Male): News-like
 * - ko-KR-JiMinNeural (Female): Cheerful
 * - ko-KR-SeoHyeonNeural (Female): Calm
 * - ko-KR-SoonBokNeural (Female): Mature
 * - ko-KR-YuJinNeural (Female): Young
 */
export const EDGE_TTS_VOICES: Record<NicheType, Voice> = {
  [NicheType.SENIOR_HEALTH]: {
    voiceId: 'ko-KR-SunHiNeural',
    name: 'SunHi',
    language: 'ko-KR',
    gender: 'female',
    provider: 'edge',
  },
  [NicheType.FINANCE]: {
    voiceId: 'ko-KR-InJoonNeural',
    name: 'InJoon',
    language: 'ko-KR',
    gender: 'male',
    provider: 'edge',
  },
  [NicheType.TECH_AI]: {
    voiceId: 'ko-KR-InJoonNeural',
    name: 'InJoon',
    language: 'ko-KR',
    gender: 'male',
    provider: 'edge',
  },
  [NicheType.HISTORY]: {
    voiceId: 'ko-KR-SunHiNeural',
    name: 'SunHi',
    language: 'ko-KR',
    gender: 'female',
    provider: 'edge',
  },
  [NicheType.COMMERCE]: {
    voiceId: 'ko-KR-SunHiNeural',
    name: 'SunHi',
    language: 'ko-KR',
    gender: 'female',
    provider: 'edge',
  },
};

/**
 * Edge TTS voice settings by niche
 */
export const EDGE_TTS_VOICE_SETTINGS: Record<NicheType, VoiceSettings> = {
  [NicheType.SENIOR_HEALTH]: {
    rate: '-5%',    // Slightly slower for clarity
    pitch: '+0Hz',
    volume: '+5%',  // Slightly louder
  },
  [NicheType.FINANCE]: {
    rate: '+0%',
    pitch: '+0Hz',
    volume: '+0%',
  },
  [NicheType.TECH_AI]: {
    rate: '+5%',    // Slightly faster, modern feel
    pitch: '+0Hz',
    volume: '+0%',
  },
  [NicheType.HISTORY]: {
    rate: '-5%',    // Slower for storytelling
    pitch: '+0Hz',
    volume: '+0%',
  },
  [NicheType.COMMERCE]: {
    rate: '+5%',    // Energetic
    pitch: '+0Hz',
    volume: '+5%',
  },
};
