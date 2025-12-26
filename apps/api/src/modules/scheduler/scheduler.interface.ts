/**
 * Scheduler types and interfaces
 */

export interface ScheduledTask {
  id: string;
  name: string;
  cronExpression: string;
  lastRun?: Date;
  nextRun?: Date;
  isActive: boolean;
}

export interface TrendCollectionResult {
  projectId: string;
  trendCount: number;
  topicsGenerated: number;
  collectedAt: Date;
}

export interface ContentGenerationResult {
  projectId: string;
  contentId: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  topic: string;
  generatedAt: Date;
}

export interface AutomationConfig {
  isEnabled: boolean;
  generateTime: string; // HH:mm format
  publishTime: string; // HH:mm format
  timezone: string;
  dailyLimit: number;
  autoPublish: boolean;
  useTrends: boolean;
  trendSources: string[];
}

export const DEFAULT_AUTOMATION_CONFIG: AutomationConfig = {
  isEnabled: false,
  generateTime: '09:00',
  publishTime: '12:00',
  timezone: 'Asia/Seoul',
  dailyLimit: 1,
  autoPublish: false,
  useTrends: true,
  trendSources: ['google', 'naver', 'rss'],
};
