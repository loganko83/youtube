/**
 * Analytics DTOs - Cost tracking and success rate metrics
 */

export interface CostBreakdown {
  total: number;
  tts: {
    total: number;
    edgeTts: number;
    elevenlabs: number;
    savings: number; // Edge TTS savings vs ElevenLabs
  };
  video: {
    total: number;
    creatomate: number;
  };
  byNiche: Record<string, number>;
  byPeriod: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
}

export interface SuccessRateMetrics {
  overall: {
    total: number;
    success: number;
    failed: number;
    successRate: number;
  };
  byStage: {
    script: { total: number; failed: number; failureRate: number };
    tts: { total: number; failed: number; failureRate: number };
    video: { total: number; failed: number; failureRate: number };
    upload: { total: number; failed: number; failureRate: number };
  };
  recentFailures: Array<{
    id: string;
    title: string;
    stage: string;
    error: string;
    createdAt: Date;
  }>;
  trend: Array<{
    date: string;
    total: number;
    success: number;
    failed: number;
  }>;
}

export interface AutomationMetrics {
  overview: {
    totalContents: number;
    automated: number;
    manual: number;
    automationRate: number;
  };
  byProject: Array<{
    projectId: string;
    projectName: string;
    niche: string;
    automated: number;
    manual: number;
    isEnabled: boolean;
  }>;
  dailyTrend: Array<{
    date: string;
    automated: number;
    manual: number;
  }>;
}
