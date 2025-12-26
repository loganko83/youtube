/**
 * TubeGenius AI - Shared Constants
 * Configuration constants for content generation and API limits
 */

import { NicheType, ToneType, ContentFormat } from '../types';

// ============================================================
// Content Generation Limits
// ============================================================

export const CONTENT_LIMITS = {
  SHORTS: {
    maxDuration: 60,
    maxScriptLength: 500,
    targetDuration: 45,
  },
  LONG_FORM: {
    minDuration: 300,
    maxDuration: 900,
    targetDuration: 480,
  },
} as const;

// ============================================================
// Safety & Compliance
// ============================================================

export const FORBIDDEN_TOPICS = [
  'gambling',
  'adult content',
  'illegal activities',
  'drugs',
  'violence',
  'hate speech',
  'medical prescriptions',
  'financial fraud',
] as const;

export const YMYL_VERTICALS: NicheType[] = [
  NicheType.FINANCE,
  NicheType.SENIOR_HEALTH,
];

export const CONFIDENCE_THRESHOLDS = {
  HIGH: 80,
  MEDIUM: 60,
  LOW: 40,
} as const;

export const REQUIRED_DISCLAIMERS = {
  [NicheType.SENIOR_HEALTH]: '이 영상은 정보 제공 목적으로만 제작되었으며, 전문 의료 상담을 대체하지 않습니다. 건강 문제는 반드시 의료 전문가와 상담하세요.',
  [NicheType.FINANCE]: '이 영상은 교육 및 정보 목적으로만 제작되었습니다. 투자 결정 전 반드시 전문가와 상담하세요. 과거 수익이 미래 수익을 보장하지 않습니다.',
} as const;

// ============================================================
// API Configuration
// ============================================================

export const API_CONFIG = {
  TIMEOUT_MS: 30000,
  MAX_RETRIES: 3,
  RATE_LIMIT: {
    GEMINI: {
      requestsPerMinute: 60,
      tokensPerMinute: 100000,
    },
  },
} as const;

// ============================================================
// Content Generation Defaults
// ============================================================

export const DEFAULT_CONFIG = {
  niche: NicheType.SENIOR_HEALTH,
  tone: ToneType.FRIENDLY,
  format: ContentFormat.SHORTS,
  language: 'ko',
} as const;

// ============================================================
// Vertical-Specific Settings
// ============================================================

export const VERTICAL_SETTINGS = {
  [NicheType.SENIOR_HEALTH]: {
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // ElevenLabs Sarah
    voiceSettings: {
      stability: 0.7,
      similarity_boost: 0.8,
      style: 0.3,
    },
    imageStyle: 'warm, friendly, high contrast, large text, simple composition',
    colorPalette: ['#4A90A4', '#F5F5DC', '#228B22', '#FFD700'],
    targetAudience: '60+ Korean seniors',
    scriptGuidelines: [
      'Use simple, clear language',
      'Avoid medical jargon',
      'Include practical tips',
      'Speak slowly and clearly',
    ],
  },
  [NicheType.FINANCE]: {
    voiceId: 'pNInz6obpgDQGcFmaJgB', // ElevenLabs Adam
    voiceSettings: {
      stability: 0.8,
      similarity_boost: 0.7,
      style: 0.2,
    },
    imageStyle: 'professional, clean, data visualization, charts',
    colorPalette: ['#1E3A5F', '#4CAF50', '#FFC107', '#FFFFFF'],
    targetAudience: '30-50 Korean investors',
    scriptGuidelines: [
      'Use credible data sources',
      'Explain complex terms',
      'Include risk disclaimers',
      'Be objective and balanced',
    ],
  },
  [NicheType.TECH_AI]: {
    voiceId: 'onwK4e9ZLuTAKqWW03F9', // ElevenLabs Daniel
    voiceSettings: {
      stability: 0.6,
      similarity_boost: 0.75,
      style: 0.4,
    },
    imageStyle: 'modern, sleek, futuristic, tech-focused',
    colorPalette: ['#0D1117', '#58A6FF', '#7EE787', '#FFFFFF'],
    targetAudience: '20-40 tech enthusiasts',
    scriptGuidelines: [
      'Stay current with trends',
      'Explain technical concepts clearly',
      'Include hands-on examples',
      'Be enthusiastic but accurate',
    ],
  },
  [NicheType.HISTORY]: {
    voiceId: 'N2lVS1w4EtoT3dr4eOWO', // ElevenLabs Callum
    voiceSettings: {
      stability: 0.75,
      similarity_boost: 0.8,
      style: 0.5,
    },
    imageStyle: 'cinematic, dramatic, historical artwork, vintage tones',
    colorPalette: ['#8B4513', '#DEB887', '#2F2F2F', '#C0A080'],
    targetAudience: 'History enthusiasts, all ages',
    scriptGuidelines: [
      'Create narrative tension',
      'Use vivid descriptions',
      'Include lesser-known facts',
      'Connect to present day',
    ],
  },
  [NicheType.COMMERCE]: {
    voiceId: 'ThT5KcBeYPX3keUQqHPh', // ElevenLabs Dorothy
    voiceSettings: {
      stability: 0.65,
      similarity_boost: 0.75,
      style: 0.35,
    },
    imageStyle: 'product photography, clean backgrounds, lifestyle context',
    colorPalette: ['#FF6B6B', '#4ECDC4', '#FFFFFF', '#2C3E50'],
    targetAudience: '25-45 online shoppers',
    scriptGuidelines: [
      'Be honest about pros and cons',
      'Include real usage scenarios',
      'Compare alternatives',
      'Disclose affiliate relationships',
    ],
  },
} as const;

// ============================================================
// Performance Targets (from NFRs)
// ============================================================

export const PERFORMANCE_TARGETS = {
  SCRIPT_GENERATION_MS: 30000,
  TTS_GENERATION_MS: 60000,
  VIDEO_RENDERING_MS: 120000,
  API_RESPONSE_MS: 200,
  DASHBOARD_LOAD_MS: 1000,
} as const;

// ============================================================
// Cost Targets (per content)
// ============================================================

export const COST_TARGETS_USD = {
  LLM_GEMINI: 0.01,
  TTS_ELEVENLABS: 0.015,
  IMAGES: 0.01,
  RENDERING: 0.05,
  TOTAL_MAX: 0.10,
} as const;

// ============================================================
// Video Template Configurations
// ============================================================

export * from './video-templates';
