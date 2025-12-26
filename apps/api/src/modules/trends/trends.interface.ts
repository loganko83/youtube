import { NicheType } from '@tubegenius/shared';

/**
 * Trend data source types
 */
export type TrendSourceType = 'google' | 'naver' | 'rss';

/**
 * Trend item from any source
 */
export interface TrendItem {
  keyword: string;
  score: number; // Normalized 0-100
  source: TrendSourceType;
  category?: string;
  relatedKeywords?: string[];
  url?: string;
  publishedAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * Aggregated trend result
 */
export interface TrendResult {
  items: TrendItem[];
  source: TrendSourceType;
  fetchedAt: Date;
  geo: string;
  category?: string;
}

/**
 * Niche-matched trend with relevance score
 */
export interface NicheMatchedTrend {
  trend: TrendItem;
  niche: NicheType;
  relevanceScore: number; // 0-100
  suggestedTopic?: string;
}

/**
 * Trend provider interface
 */
export interface ITrendProvider {
  readonly name: TrendSourceType;

  /**
   * Fetch trending topics
   * @param options - Provider-specific options
   */
  fetchTrends(options?: TrendFetchOptions): Promise<TrendResult>;

  /**
   * Check if provider is available
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Options for fetching trends
 */
export interface TrendFetchOptions {
  geo?: string; // Country code (e.g., 'KR', 'US')
  category?: string;
  limit?: number;
  language?: string;
}

/**
 * Google Trends specific options
 */
export interface GoogleTrendsOptions extends TrendFetchOptions {
  timeRange?: 'now 1-H' | 'now 4-H' | 'now 1-d' | 'now 7-d' | 'today 1-m' | 'today 3-m';
}

/**
 * Naver DataLab specific options
 */
export interface NaverDataLabOptions extends TrendFetchOptions {
  startDate?: string; // YYYY-MM-DD
  endDate?: string;
  timeUnit?: 'date' | 'week' | 'month';
  ages?: string[]; // e.g., ['20', '30']
  gender?: 'male' | 'female' | 'all';
}

/**
 * RSS Feed specific options
 */
export interface RssFeedOptions extends TrendFetchOptions {
  feedUrls?: string[];
  maxItemsPerFeed?: number;
}

/**
 * Niche to category mapping for trend matching
 */
export const NICHE_CATEGORY_MAPPING: Partial<Record<NicheType, string[]>> = {
  'Senior Health': ['health', 'wellness', 'medical', 'fitness', 'senior', '건강', '의료', '웰빙'],
  'Finance & Investing': ['finance', 'money', 'investing', 'economy', 'stock', '금융', '투자', '경제', '주식'],
  'Tech & AI Reviews': ['technology', 'ai', 'artificial intelligence', 'gadgets', 'software', '기술', 'IT', '인공지능'],
  'History & Storytelling': ['history', 'culture', 'heritage', 'historical', '역사', '문화', '유산'],
  'Product Reviews': ['shopping', 'ecommerce', 'deals', 'products', 'review', '쇼핑', '커머스', '리뷰'],
};

/**
 * Niche keywords for trend matching
 */
export const NICHE_KEYWORDS: Partial<Record<NicheType, string[]>> = {
  'Senior Health': [
    '혈압', '당뇨', '관절', '치매', '운동', '식이요법', '영양제', '건강검진',
    'health', 'wellness', 'exercise', 'nutrition', 'supplements', 'fitness',
  ],
  'Finance & Investing': [
    '주식', '부동산', '펀드', '연금', '저축', '투자', '금리', 'ETF', '배당',
    'stock', 'investment', 'real estate', 'savings', 'dividend', 'retirement',
  ],
  'Tech & AI Reviews': [
    'AI', '인공지능', '챗GPT', '로봇', '자동화', '딥러닝', '스마트폰', '앱',
    'ChatGPT', 'artificial intelligence', 'automation', 'machine learning', 'apps',
  ],
  'History & Storytelling': [
    '역사', '조선', '삼국시대', '한국전쟁', '독립운동', '문화재', '유적',
    'history', 'ancient', 'heritage', 'culture', 'tradition', 'historical',
  ],
  'Product Reviews': [
    '추천', '리뷰', '할인', '쿠폰', '비교', '최저가', '핫딜', '베스트셀러',
    'review', 'discount', 'deal', 'compare', 'best', 'recommendation',
  ],
};
