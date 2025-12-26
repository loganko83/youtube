
export enum NicheType {
  FINANCE = 'Finance & Investing',
  SENIOR_HEALTH = 'Senior Health',
  TECH_AI = 'Tech & AI Reviews',
  HISTORY = 'History & Storytelling',
  COMMERCE = 'Product Reviews'
}

export interface CriticalClaim {
  text: string;
  confidence: number;
}

export interface ContentConfig {
  niche: NicheType;
  topic: string;
  tone: 'Professional' | 'Friendly' | 'Mysterious' | 'Urgent';
  format: 'Shorts' | 'Long-form';
  language: string;
}

export interface GeneratedContent {
  title: string;
  script: string;
  voiceoverText: string;
  imagePrompts: string[];
  scenePreviews?: string[]; // Storyboard thumbnails from gemini-2.5-flash-image
  criticalClaims: CriticalClaim[];
  metadata: {
    description: string;
    tags: string[];
  };
  safetyReport: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  description: string;
}
