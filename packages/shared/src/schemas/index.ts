/**
 * TubeGenius AI - Zod Schemas
 * Validation schemas for API requests and responses
 */

import { z } from 'zod';
import { NicheType, ToneType, ContentFormat, ContentJobStatus } from '../types';

// ============================================================
// Base Schemas
// ============================================================

export const nicheTypeSchema = z.nativeEnum(NicheType);
export const toneTypeSchema = z.nativeEnum(ToneType);
export const contentFormatSchema = z.nativeEnum(ContentFormat);
export const contentJobStatusSchema = z.nativeEnum(ContentJobStatus);

// ============================================================
// Content Configuration Schemas
// ============================================================

export const contentConfigSchema = z.object({
  niche: nicheTypeSchema,
  topic: z.string().min(1).max(200),
  tone: toneTypeSchema,
  format: contentFormatSchema,
  language: z.string().length(2).default('ko'),
});

export type ContentConfigInput = z.infer<typeof contentConfigSchema>;

export const createContentSchema = z.object({
  projectId: z.string().uuid(),
  config: contentConfigSchema,
  dataSourceIds: z.array(z.string().uuid()).optional(),
  scheduledAt: z.string().datetime().optional(),
});

export type CreateContentInput = z.infer<typeof createContentSchema>;

// ============================================================
// User & Auth Schemas
// ============================================================

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(2).max(50),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const updateUserSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  password: z.string().min(8).max(100).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// ============================================================
// Project Schemas
// ============================================================

export const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  niche: nicheTypeSchema,
  defaultConfig: contentConfigSchema.partial().optional(),
  youtubeChannelId: z.string().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = createProjectSchema.partial();
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// ============================================================
// Data Source Schemas
// ============================================================

export const dataSourceTypeSchema = z.enum(['rss', 'api', 'custom']);

export const createDataSourceSchema = z.object({
  projectId: z.string().uuid(),
  type: dataSourceTypeSchema,
  name: z.string().min(1).max(100),
  url: z.string().url(),
  isActive: z.boolean().default(true),
});

export type CreateDataSourceInput = z.infer<typeof createDataSourceSchema>;

// ============================================================
// Safety & Claims Schemas
// ============================================================

export const criticalClaimSchema = z.object({
  text: z.string(),
  confidence: z.number().min(0).max(100),
  source: z.string().optional(),
});

export const safetyIssueSchema = z.object({
  type: z.enum(['forbidden_topic', 'sensitive_claim', 'ymyl_content', 'low_confidence']),
  severity: z.enum(['critical', 'warning', 'info']),
  description: z.string(),
  claimText: z.string().optional(),
});

export const safetyReportSchema = z.object({
  passed: z.boolean(),
  issues: z.array(safetyIssueSchema),
  disclaimerRequired: z.boolean(),
  disclaimerText: z.string().optional(),
});

// ============================================================
// Generated Content Schema
// ============================================================

export const generatedContentSchema = z.object({
  title: z.string(),
  script: z.string(),
  voiceoverText: z.string(),
  imagePrompts: z.array(z.string()),
  scenePreviews: z.array(z.string()).optional(),
  criticalClaims: z.array(criticalClaimSchema),
  metadata: z.object({
    description: z.string(),
    tags: z.array(z.string()),
    estimatedDuration: z.number().optional(),
    targetAudience: z.string().optional(),
  }),
  safetyReport: safetyReportSchema,
});

export type GeneratedContentOutput = z.infer<typeof generatedContentSchema>;

// ============================================================
// Pagination Schemas
// ============================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// ============================================================
// Webhook Schemas
// ============================================================

export const n8nWebhookPayloadSchema = z.object({
  event: z.enum([
    'content.script_generated',
    'content.tts_completed',
    'content.video_rendered',
    'content.upload_completed',
    'content.failed',
  ]),
  contentJobId: z.string().uuid(),
  data: z.record(z.unknown()).optional(),
  timestamp: z.string().datetime(),
});

export type N8nWebhookPayload = z.infer<typeof n8nWebhookPayloadSchema>;
