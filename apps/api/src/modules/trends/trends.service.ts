import { Injectable, Logger } from '@nestjs/common';
import { NicheType } from '@tubegenius/shared';
import { GoogleTrendsProvider } from './providers/google-trends.provider';
import { NaverDataLabProvider } from './providers/naver-datalab.provider';
import { RssFeedProvider } from './providers/rss-feed.provider';
import {
  TrendItem,
  TrendResult,
  TrendSourceType,
  NicheMatchedTrend,
  TrendFetchOptions,
  NICHE_KEYWORDS,
  NICHE_CATEGORY_MAPPING,
} from './trends.interface';
import { TopicSuggestionDto } from './trends.dto';

/**
 * Trends Service
 *
 * Aggregates trends from multiple sources and provides
 * niche-matched topic suggestions for content generation
 */
@Injectable()
export class TrendsService {
  private readonly logger = new Logger(TrendsService.name);

  constructor(
    private readonly googleTrends: GoogleTrendsProvider,
    private readonly naverDataLab: NaverDataLabProvider,
    private readonly rssFeed: RssFeedProvider,
  ) {}

  /**
   * Fetch trends from all available sources
   */
  async fetchAllTrends(options: TrendFetchOptions = {}): Promise<TrendResult[]> {
    const results: TrendResult[] = [];

    // Fetch from all sources in parallel
    const [googleResult, naverResult, rssResult] = await Promise.allSettled([
      this.googleTrends.fetchTrends(options),
      this.naverDataLab.fetchTrends(options),
      this.rssFeed.fetchTrends(options),
    ]);

    if (googleResult.status === 'fulfilled') {
      results.push(googleResult.value);
    } else {
      this.logger.warn('Google Trends fetch failed:', googleResult.reason);
    }

    if (naverResult.status === 'fulfilled') {
      results.push(naverResult.value);
    } else {
      this.logger.warn('Naver DataLab fetch failed:', naverResult.reason);
    }

    if (rssResult.status === 'fulfilled') {
      results.push(rssResult.value);
    } else {
      this.logger.warn('RSS Feed fetch failed:', rssResult.reason);
    }

    return results;
  }

  /**
   * Fetch trends from a specific source
   */
  async fetchTrendsBySource(source: TrendSourceType, options: TrendFetchOptions = {}): Promise<TrendResult> {
    switch (source) {
      case 'google':
        return this.googleTrends.fetchTrends(options);
      case 'naver':
        return this.naverDataLab.fetchTrends(options);
      case 'rss':
        return this.rssFeed.fetchTrends(options);
      default:
        throw new Error(`Unknown trend source: ${source}`);
    }
  }

  /**
   * Get aggregated trends from all sources
   */
  async getAggregatedTrends(options: TrendFetchOptions = {}): Promise<TrendItem[]> {
    const results = await this.fetchAllTrends(options);

    // Combine all items
    const allItems: TrendItem[] = [];
    for (const result of results) {
      allItems.push(...result.items);
    }

    // Deduplicate by similar keywords
    const uniqueItems = this.deduplicateTrends(allItems);

    // Sort by score
    uniqueItems.sort((a, b) => b.score - a.score);

    // Apply limit
    return uniqueItems.slice(0, options.limit || 50);
  }

  /**
   * Get trends matched to a specific niche
   */
  async getNicheMatchedTrends(niche: NicheType, minRelevance = 30, limit = 10): Promise<NicheMatchedTrend[]> {
    const allTrends = await this.getAggregatedTrends({ limit: 100 });
    const nicheKeywords = NICHE_KEYWORDS[niche] || [];
    const nicheCategories = NICHE_CATEGORY_MAPPING[niche] || [];

    const matchedTrends: NicheMatchedTrend[] = [];

    for (const trend of allTrends) {
      const relevanceScore = this.calculateRelevanceScore(trend, nicheKeywords, nicheCategories);

      if (relevanceScore >= minRelevance) {
        matchedTrends.push({
          trend,
          niche,
          relevanceScore,
          suggestedTopic: this.generateTopicSuggestion(trend, niche),
        });
      }
    }

    // Sort by relevance and limit
    matchedTrends.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return matchedTrends.slice(0, limit);
  }

  /**
   * Generate topic suggestions based on trends
   */
  async getTopicSuggestions(niche: NicheType, count = 5): Promise<TopicSuggestionDto[]> {
    const matchedTrends = await this.getNicheMatchedTrends(niche, 20, count * 2);
    const suggestions: TopicSuggestionDto[] = [];

    for (const matched of matchedTrends.slice(0, count)) {
      suggestions.push({
        topic: matched.suggestedTopic || matched.trend.keyword,
        keywords: [matched.trend.keyword, ...(matched.trend.relatedKeywords || []).slice(0, 3)],
        trendScore: matched.trend.score,
        niche,
        sources: [matched.trend.source],
        reasoning: `트렌드 점수 ${matched.trend.score.toFixed(1)}, 관련성 ${matched.relevanceScore.toFixed(1)}%`,
      });
    }

    return suggestions;
  }

  /**
   * Search specific keywords across all sources
   */
  async searchKeywords(keywords: string[]): Promise<TrendItem[]> {
    const results: TrendItem[] = [];

    try {
      const googleResults = await this.googleTrends.searchKeywordInterest(keywords);
      results.push(...googleResults);
    } catch (error) {
      this.logger.warn('Google keyword search failed:', error);
    }

    try {
      const naverResults = await this.naverDataLab.searchKeywordTrends(keywords);
      results.push(...naverResults);
    } catch (error) {
      this.logger.warn('Naver keyword search failed:', error);
    }

    return results;
  }

  /**
   * Get provider availability status
   */
  async getProviderStatus(): Promise<Record<TrendSourceType, boolean>> {
    const [google, naver, rss] = await Promise.all([
      this.googleTrends.isAvailable(),
      this.naverDataLab.isAvailable(),
      this.rssFeed.isAvailable(),
    ]);

    return { google, naver, rss };
  }

  /**
   * Calculate relevance score between a trend and a niche
   */
  private calculateRelevanceScore(trend: TrendItem, nicheKeywords: string[], nicheCategories: string[]): number {
    let score = 0;
    const keyword = trend.keyword.toLowerCase();
    const relatedKeywords = (trend.relatedKeywords || []).map(k => k.toLowerCase());
    const category = (trend.category || '').toLowerCase();

    // Check keyword match
    for (const nicheKeyword of nicheKeywords) {
      const lowerNicheKeyword = nicheKeyword.toLowerCase();

      if (keyword.includes(lowerNicheKeyword) || lowerNicheKeyword.includes(keyword)) {
        score += 40;
        break;
      }

      for (const related of relatedKeywords) {
        if (related.includes(lowerNicheKeyword) || lowerNicheKeyword.includes(related)) {
          score += 20;
          break;
        }
      }
    }

    // Check category match
    for (const nicheCategory of nicheCategories) {
      if (category.includes(nicheCategory.toLowerCase())) {
        score += 30;
        break;
      }
    }

    // Boost by trend score
    score += trend.score * 0.3;

    return Math.min(score, 100);
  }

  /**
   * Generate a topic suggestion from a trend
   */
  private generateTopicSuggestion(trend: TrendItem, niche: NicheType): string {
    const nichePrefix: Record<NicheType, string> = {
      [NicheType.SENIOR_HEALTH]: '건강 정보',
      [NicheType.FINANCE]: '재테크',
      [NicheType.TECH_AI]: 'AI/기술',
      [NicheType.HISTORY]: '역사 이야기',
      [NicheType.COMMERCE]: '제품 추천',
    };

    const prefix = nichePrefix[niche] || '';
    const keyword = trend.keyword;

    return `${prefix}: ${keyword}`;
  }

  /**
   * Deduplicate trends by similar keywords
   */
  private deduplicateTrends(items: TrendItem[]): TrendItem[] {
    const seen = new Set<string>();
    const unique: TrendItem[] = [];

    for (const item of items) {
      const normalized = item.keyword.toLowerCase().trim();

      // Check for exact or similar matches
      let isDuplicate = false;
      for (const seenKeyword of seen) {
        if (this.areSimilar(normalized, seenKeyword)) {
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        seen.add(normalized);
        unique.push(item);
      }
    }

    return unique;
  }

  /**
   * Check if two keywords are similar
   */
  private areSimilar(a: string, b: string): boolean {
    // Exact match
    if (a === b) return true;

    // One contains the other
    if (a.includes(b) || b.includes(a)) return true;

    // Simple Levenshtein distance threshold
    if (a.length > 3 && b.length > 3) {
      const distance = this.levenshteinDistance(a, b);
      const maxLen = Math.max(a.length, b.length);
      if (distance / maxLen < 0.3) return true;
    }

    return false;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }
}
