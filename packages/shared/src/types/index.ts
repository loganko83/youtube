/**
 * TubeGenius AI - Shared Type Definitions
 * Core types for content generation and workflow management
 */

// ============================================================
// Enums
// ============================================================

export enum NicheType {
  FINANCE = 'Finance & Investing',
  SENIOR_HEALTH = 'Senior Health',
  TECH_AI = 'Tech & AI Reviews',
  HISTORY = 'History & Storytelling',
  COMMERCE = 'Product Reviews'
}

export enum ContentFormat {
  SHORTS = 'Shorts',
  LONG_FORM = 'Long-form'
}

export enum ToneType {
  PROFESSIONAL = 'Professional',
  FRIENDLY = 'Friendly',
  MYSTERIOUS = 'Mysterious',
  URGENT = 'Urgent'
}

export enum WorkflowStatus {
  IDLE = 'idle',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error'
}

export enum ContentJobStatus {
  PENDING = 'pending',
  SCRIPT_GENERATING = 'script_generating',
  TTS_PROCESSING = 'tts_processing',
  VIDEO_RENDERING = 'video_rendering',
  UPLOADING = 'uploading',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// ============================================================
// Core Interfaces
// ============================================================

export interface CriticalClaim {
  text: string;
  confidence: number;
  source?: string;
}

export interface ContentConfig {
  niche: NicheType;
  topic: string;
  tone: ToneType;
  format: ContentFormat;
  language: string;
}

export interface GeneratedContent {
  title: string;
  script: string;
  voiceoverText: string;
  imagePrompts: string[];
  scenePreviews?: string[];
  criticalClaims: CriticalClaim[];
  metadata: ContentMetadata;
  safetyReport: SafetyReport;
}

export interface ContentMetadata {
  description: string;
  tags: string[];
  estimatedDuration?: number;
  targetAudience?: string;
}

export interface SafetyReport {
  passed: boolean;
  issues: SafetyIssue[];
  disclaimerRequired: boolean;
  disclaimerText?: string;
}

export interface SafetyIssue {
  type: 'forbidden_topic' | 'sensitive_claim' | 'ymyl_content' | 'low_confidence';
  severity: 'critical' | 'warning' | 'info';
  description: string;
  claimText?: string;
}

// ============================================================
// Workflow Interfaces
// ============================================================

export interface WorkflowStep {
  id: string;
  name: string;
  status: WorkflowStatus;
  description: string;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface ContentJob {
  id: string;
  projectId: string;
  status: ContentJobStatus;
  config: ContentConfig;
  content?: GeneratedContent;
  audioUrl?: string;
  videoUrl?: string;
  youtubeVideoId?: string;
  createdAt: Date;
  updatedAt: Date;
  error?: string;
}

// ============================================================
// User & Project Interfaces
// ============================================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  niche: NicheType;
  defaultConfig: Partial<ContentConfig>;
  youtubeChannelId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DataSource {
  id: string;
  projectId: string;
  type: 'rss' | 'api' | 'custom';
  name: string;
  url: string;
  isActive: boolean;
  lastFetchedAt?: Date;
  createdAt: Date;
}

// ============================================================
// API Response Types
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: Required<Pick<ApiMeta, 'page' | 'limit' | 'total' | 'hasMore'>>;
}
