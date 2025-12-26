/**
 * API Client - TubeGenius Frontend API Integration
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// ============================================================
// Types
// ============================================================

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  niche: string;
  defaultConfig: Record<string, unknown>;
  youtubeChannelId?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    contents: number;
    dataSources: number;
  };
}

export interface Content {
  id: string;
  projectId: string;
  status: string;
  title?: string;
  script?: string;
  audioUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  youtubeVideoId?: string;
  createdAt: string;
  updatedAt: string;
  project?: {
    name: string;
    niche: string;
  };
  config?: {
    niche?: string;
    topic?: string;
    tone?: string;
    format?: string;
    language?: string;
  };
  generatedScript?: {
    script?: Array<{ type: string; content: string }>;
    voiceoverText?: string;
    criticalClaims?: Array<{ claim: string; confidence: number; source?: string }>;
    metadata?: {
      duration?: string;
      description?: string;
      tags?: string[];
    };
    safetyReport?: {
      passed: boolean;
      flags?: string[];
    };
  };
}

export interface ContentConfig {
  niche: string;
  topic: string;
  tone: string;
  format: string;
  language: string;
}

// ============================================================
// Trends Types
// ============================================================

export interface TrendItem {
  keyword: string;
  score: number;
  source: string;
  category?: string;
  relatedKeywords?: string[];
  url?: string;
  fetchedAt: string;
}

export interface TopicSuggestion {
  topic: string;
  keywords: string[];
  trendScore: number;
  niche: string;
  sources: string[];
  reasoning: string;
}

export interface TrendResult {
  source: string;
  items: TrendItem[];
  fetchedAt: string;
  error?: string;
}

// ============================================================
// Automation Types
// ============================================================

export interface ProjectAutomation {
  id: string;
  projectId: string;
  isEnabled: boolean;
  generateTime: string;
  publishTime: string;
  timezone: string;
  dailyLimit: number;
  autoPublish: boolean;
  useTrends: boolean;
  trendSources: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AutomationStats {
  totalProjects: number;
  enabledAutomations: number;
  disabledAutomations: number;
  contentsGeneratedToday: number;
  projects: Array<{
    id: string;
    name: string;
    niche: string;
    isEnabled: boolean;
    dailyLimit: number;
    contentsToday: number;
  }>;
}

export interface ScheduledJob {
  id: string;
  name: string;
  cronExpression: string;
  lastRun?: string;
  nextRun?: string;
  isActive: boolean;
}

// ============================================================
// API Client Class
// ============================================================

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'An error occurred',
      }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ============================================================
  // Auth API
  // ============================================================

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const result = await this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(result.token);
    return result;
  }

  async register(email: string, password: string, name: string): Promise<{ user: User; token: string }> {
    const result = await this.request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    this.setToken(result.token);
    return result;
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // ============================================================
  // Projects API
  // ============================================================

  async getProjects(page = 1, limit = 20): Promise<PaginatedResponse<Project>> {
    return this.request<PaginatedResponse<Project>>(`/projects?page=${page}&limit=${limit}`);
  }

  async getProject(id: string): Promise<Project> {
    return this.request<Project>(`/projects/${id}`);
  }

  async createProject(data: {
    name: string;
    description?: string;
    niche: string;
    defaultConfig?: Record<string, unknown>;
  }): Promise<Project> {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    return this.request<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string): Promise<void> {
    await this.request(`/projects/${id}`, { method: 'DELETE' });
  }

  // ============================================================
  // Contents API
  // ============================================================

  async getContents(projectId?: string, page = 1, limit = 20): Promise<PaginatedResponse<Content>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (projectId) params.append('projectId', projectId);
    return this.request<PaginatedResponse<Content>>(`/contents?${params}`);
  }

  async getContent(id: string): Promise<Content> {
    return this.request<Content>(`/contents/${id}`);
  }

  async createContent(projectId: string, config: ContentConfig): Promise<Content> {
    return this.request<Content>('/contents', {
      method: 'POST',
      body: JSON.stringify({ projectId, config }),
    });
  }

  async deleteContent(id: string): Promise<void> {
    await this.request(`/contents/${id}`, { method: 'DELETE' });
  }

  // ============================================================
  // Trends API
  // ============================================================

  async getTrends(): Promise<ApiResponse<TrendResult[]>> {
    return this.request<ApiResponse<TrendResult[]>>('/trends');
  }

  async getTrendsBySource(source: string): Promise<ApiResponse<TrendResult>> {
    return this.request<ApiResponse<TrendResult>>(`/trends/${source}`);
  }

  async getTrendsByNiche(niche: string): Promise<ApiResponse<TrendItem[]>> {
    return this.request<ApiResponse<TrendItem[]>>(`/trends/niche/${niche}`);
  }

  async getTopicSuggestions(niche: string, count = 5): Promise<ApiResponse<TopicSuggestion[]>> {
    return this.request<ApiResponse<TopicSuggestion[]>>(`/trends/suggestions/${niche}?count=${count}`);
  }

  async getTrendProviderStatus(): Promise<ApiResponse<Record<string, boolean>>> {
    return this.request<ApiResponse<Record<string, boolean>>>('/trends/status');
  }

  // ============================================================
  // Automation API
  // ============================================================

  async getAutomation(projectId: string): Promise<ApiResponse<ProjectAutomation>> {
    return this.request<ApiResponse<ProjectAutomation>>(`/projects/${projectId}/automation`);
  }

  async updateAutomation(
    projectId: string,
    data: Partial<ProjectAutomation>,
  ): Promise<ApiResponse<ProjectAutomation>> {
    return this.request<ApiResponse<ProjectAutomation>>(`/projects/${projectId}/automation`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async enableAutomation(projectId: string): Promise<ApiResponse<ProjectAutomation>> {
    return this.request<ApiResponse<ProjectAutomation>>(`/projects/${projectId}/automation/enable`, {
      method: 'POST',
    });
  }

  async disableAutomation(projectId: string): Promise<ApiResponse<ProjectAutomation>> {
    return this.request<ApiResponse<ProjectAutomation>>(`/projects/${projectId}/automation/disable`, {
      method: 'POST',
    });
  }

  async getAutomationStats(): Promise<ApiResponse<AutomationStats>> {
    return this.request<ApiResponse<AutomationStats>>('/automation/stats');
  }

  // ============================================================
  // Scheduler API
  // ============================================================

  async getScheduledJobs(): Promise<ApiResponse<ScheduledJob[]>> {
    return this.request<ApiResponse<ScheduledJob[]>>('/scheduler/jobs');
  }

  async triggerTrendCollection(projectId: string): Promise<ApiResponse<unknown>> {
    return this.request<ApiResponse<unknown>>(`/scheduler/trigger/trends/${projectId}`, {
      method: 'POST',
    });
  }

  async triggerContentGeneration(projectId: string): Promise<ApiResponse<unknown>> {
    return this.request<ApiResponse<unknown>>(`/scheduler/trigger/content/${projectId}`, {
      method: 'POST',
    });
  }

  // ============================================================
  // Analytics API
  // ============================================================

  async getAnalytics(): Promise<ApiResponse<{
    costs: CostBreakdown;
    successRates: SuccessRateMetrics;
    automation: AutomationMetricsData;
  }>> {
    return this.request<ApiResponse<{
      costs: CostBreakdown;
      successRates: SuccessRateMetrics;
      automation: AutomationMetricsData;
    }>>('/analytics');
  }

  async getCostBreakdown(): Promise<ApiResponse<CostBreakdown>> {
    return this.request<ApiResponse<CostBreakdown>>('/analytics/costs');
  }

  async getSuccessRates(): Promise<ApiResponse<SuccessRateMetrics>> {
    return this.request<ApiResponse<SuccessRateMetrics>>('/analytics/success-rates');
  }

  async getAutomationMetricsData(): Promise<ApiResponse<AutomationMetricsData>> {
    return this.request<ApiResponse<AutomationMetricsData>>('/analytics/automation');
  }

  // ============================================================
  // Health Check
  // ============================================================

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }
}

// ============================================================
// Analytics Types
// ============================================================

export interface CostBreakdown {
  total: number;
  tts: {
    total: number;
    edgeTts: number;
    elevenlabs: number;
    savings: number;
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
    createdAt: string;
  }>;
  trend: Array<{
    date: string;
    total: number;
    success: number;
    failed: number;
  }>;
}

export interface AutomationMetricsData {
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

export const api = new ApiClient();
