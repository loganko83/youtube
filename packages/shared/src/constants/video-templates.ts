/**
 * TubeGenius AI - Video Template Configurations
 * Creatomate template settings for different formats and niches
 */

import { NicheType, ContentFormat } from '../types';

// ============================================================
// Video Format Specifications
// ============================================================

export const VIDEO_FORMATS = {
  SHORTS: {
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    frameRate: 30,
    maxDuration: 60,
    resolution: '1080x1920',
  },
  LONG_FORM: {
    width: 1920,
    height: 1080,
    aspectRatio: '16:9',
    frameRate: 30,
    maxDuration: 900,
    resolution: '1920x1080',
  },
} as const;

// ============================================================
// Typography Settings by Niche
// ============================================================

export const TYPOGRAPHY_SETTINGS = {
  [NicheType.SENIOR_HEALTH]: {
    titleFont: {
      family: 'Noto Sans KR',
      weight: '700',
      size: { shorts: 80, longForm: 96 },
      color: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidth: 8,
    },
    subtitleFont: {
      family: 'Noto Sans KR',
      weight: '600',
      size: { shorts: 72, longForm: 84 },
      color: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidth: 6,
    },
    wordsPerSegment: 3, // For readability
    lineHeight: 1.5,
  },
  [NicheType.FINANCE]: {
    titleFont: {
      family: 'Noto Sans KR',
      weight: '700',
      size: { shorts: 64, longForm: 80 },
      color: '#FFFFFF',
      strokeColor: '#1E3A5F',
      strokeWidth: 4,
    },
    subtitleFont: {
      family: 'Noto Sans KR',
      weight: '600',
      size: { shorts: 48, longForm: 56 },
      color: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidth: 4,
    },
    wordsPerSegment: 5,
    lineHeight: 1.4,
  },
  [NicheType.TECH_AI]: {
    titleFont: {
      family: 'Roboto',
      weight: '700',
      size: { shorts: 60, longForm: 72 },
      color: '#58A6FF',
      strokeColor: '#0D1117',
      strokeWidth: 3,
    },
    subtitleFont: {
      family: 'Roboto',
      weight: '500',
      size: { shorts: 44, longForm: 52 },
      color: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidth: 3,
    },
    wordsPerSegment: 6,
    lineHeight: 1.3,
  },
  [NicheType.HISTORY]: {
    titleFont: {
      family: 'Playfair Display',
      weight: '700',
      size: { shorts: 56, longForm: 68 },
      color: '#DEB887',
      strokeColor: '#2F2F2F',
      strokeWidth: 4,
    },
    subtitleFont: {
      family: 'Noto Serif KR',
      weight: '600',
      size: { shorts: 42, longForm: 50 },
      color: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidth: 3,
    },
    wordsPerSegment: 7,
    lineHeight: 1.4,
  },
  [NicheType.COMMERCE]: {
    titleFont: {
      family: 'Noto Sans KR',
      weight: '700',
      size: { shorts: 62, longForm: 76 },
      color: '#FF6B6B',
      strokeColor: '#2C3E50',
      strokeWidth: 4,
    },
    subtitleFont: {
      family: 'Noto Sans KR',
      weight: '600',
      size: { shorts: 46, longForm: 54 },
      color: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidth: 3,
    },
    wordsPerSegment: 5,
    lineHeight: 1.3,
  },
} as const;

// ============================================================
// Background & Color Schemes
// ============================================================

export const COLOR_SCHEMES = {
  [NicheType.SENIOR_HEALTH]: {
    primary: '#4A90A4',
    secondary: '#F5F5DC',
    accent: '#228B22',
    highlight: '#FFD700',
    background: 'linear-gradient(135deg, #4A90A4 0%, #3A7A8A 100%)',
    overlay: 'rgba(0, 0, 0, 0.3)',
  },
  [NicheType.FINANCE]: {
    primary: '#1E3A5F',
    secondary: '#4CAF50',
    accent: '#FFC107',
    highlight: '#FFFFFF',
    background: 'linear-gradient(135deg, #1E3A5F 0%, #0F1F3F 100%)',
    overlay: 'rgba(0, 0, 0, 0.4)',
  },
  [NicheType.TECH_AI]: {
    primary: '#0D1117',
    secondary: '#58A6FF',
    accent: '#7EE787',
    highlight: '#FFFFFF',
    background: 'linear-gradient(135deg, #0D1117 0%, #161B22 100%)',
    overlay: 'rgba(13, 17, 23, 0.5)',
  },
  [NicheType.HISTORY]: {
    primary: '#8B4513',
    secondary: '#DEB887',
    accent: '#2F2F2F',
    highlight: '#C0A080',
    background: 'linear-gradient(135deg, #8B4513 0%, #654321 100%)',
    overlay: 'rgba(47, 47, 47, 0.4)',
  },
  [NicheType.COMMERCE]: {
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    accent: '#FFFFFF',
    highlight: '#2C3E50',
    background: 'linear-gradient(135deg, #FF6B6B 0%, #EE5A5A 100%)',
    overlay: 'rgba(44, 62, 80, 0.3)',
  },
} as const;

// ============================================================
// Animation Presets
// ============================================================

export const ANIMATION_PRESETS = {
  fadeIn: {
    time: 'start',
    duration: 0.5,
    easing: 'ease-in-out',
    opacity: [0, 1],
  },
  fadeOut: {
    time: 'end',
    duration: 0.5,
    easing: 'ease-in-out',
    opacity: [1, 0],
  },
  slideUp: {
    time: 'start',
    duration: 0.6,
    easing: 'ease-out',
    y: ['110%', '0%'],
  },
  scaleIn: {
    time: 'start',
    duration: 0.4,
    easing: 'ease-out',
    scale: [0.8, 1],
  },
  zoomIn: {
    time: 'start',
    duration: 0.8,
    easing: 'ease-in-out',
    scale: [1, 1.1],
  },
  bounceIn: {
    time: 'start',
    duration: 0.6,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    scale: [0, 1],
  },
} as const;

// ============================================================
// Template Element Configurations
// ============================================================

export const TEMPLATE_ELEMENTS = {
  background: {
    type: 'image' as const,
    track: 1,
    fit: 'cover' as const,
    blur: 0,
    brightness: 1,
    saturation: 1,
  },
  overlay: {
    type: 'shape' as const,
    track: 2,
    fill_type: 'solid' as const,
  },
  subtitle: {
    type: 'text' as const,
    track: 3,
    align: 'center' as const,
    vertical_align: 'middle' as const,
  },
  audio: {
    type: 'audio' as const,
    track: 4,
    volume: 1.0,
    fade_in: 0.3,
    fade_out: 0.5,
  },
  watermark: {
    type: 'text' as const,
    track: 5,
    opacity: 0.7,
  },
} as const;

// ============================================================
// Rendering Quality Presets
// ============================================================

export const QUALITY_PRESETS = {
  ULTRA: {
    bitrate: '8M',
    codec: 'h264',
    preset: 'slow',
    profile: 'high',
  },
  HIGH: {
    bitrate: '5M',
    codec: 'h264',
    preset: 'medium',
    profile: 'high',
  },
  STANDARD: {
    bitrate: '3M',
    codec: 'h264',
    preset: 'fast',
    profile: 'main',
  },
} as const;

// ============================================================
// Cost Estimation (USD per second)
// ============================================================

export const RENDERING_COSTS = {
  ULTRA: 0.002, // $0.002 per second
  HIGH: 0.001, // $0.001 per second
  STANDARD: 0.0005, // $0.0005 per second
} as const;

// ============================================================
// Helper Functions
// ============================================================

export function getVideoFormat(format: ContentFormat) {
  return format === ContentFormat.SHORTS ? VIDEO_FORMATS.SHORTS : VIDEO_FORMATS.LONG_FORM;
}

export function getTypographySettings(niche: NicheType) {
  return TYPOGRAPHY_SETTINGS[niche];
}

export function getColorScheme(niche: NicheType) {
  return COLOR_SCHEMES[niche];
}

export function estimateRenderingCost(duration: number, quality: keyof typeof QUALITY_PRESETS = 'STANDARD'): number {
  return duration * RENDERING_COSTS[quality];
}

export function getFontSize(niche: NicheType, format: ContentFormat, type: 'title' | 'subtitle'): number {
  const settings = TYPOGRAPHY_SETTINGS[niche];
  const isShorts = format === ContentFormat.SHORTS;

  if (type === 'title') {
    return isShorts ? settings.titleFont.size.shorts : settings.titleFont.size.longForm;
  }

  return isShorts ? settings.subtitleFont.size.shorts : settings.subtitleFont.size.longForm;
}

// ============================================================
// Template ID Mapping (for pre-created Creatomate templates)
// ============================================================

export const TEMPLATE_IDS = {
  SHORTS: {
    [NicheType.SENIOR_HEALTH]: 'tmpl_shorts_senior_health_v1',
    [NicheType.FINANCE]: 'tmpl_shorts_finance_v1',
    [NicheType.TECH_AI]: 'tmpl_shorts_tech_v1',
    [NicheType.HISTORY]: 'tmpl_shorts_history_v1',
    [NicheType.COMMERCE]: 'tmpl_shorts_commerce_v1',
  },
  LONG_FORM: {
    [NicheType.SENIOR_HEALTH]: 'tmpl_long_senior_health_v1',
    [NicheType.FINANCE]: 'tmpl_long_finance_v1',
    [NicheType.TECH_AI]: 'tmpl_long_tech_v1',
    [NicheType.HISTORY]: 'tmpl_long_history_v1',
    [NicheType.COMMERCE]: 'tmpl_long_commerce_v1',
  },
} as const;

export function getTemplateId(format: ContentFormat, niche: NicheType): string {
  const formatKey = format === ContentFormat.SHORTS ? 'SHORTS' : 'LONG_FORM';
  return TEMPLATE_IDS[formatKey][niche];
}
