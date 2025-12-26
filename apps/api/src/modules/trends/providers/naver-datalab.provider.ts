import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  ITrendProvider,
  TrendResult,
  TrendItem,
  NaverDataLabOptions,
} from '../trends.interface';

/**
 * Naver DataLab Provider
 *
 * Fetches Korean market-specific trends from Naver DataLab
 * Requires NAVER_CLIENT_ID and NAVER_CLIENT_SECRET environment variables
 *
 * API Docs: https://developers.naver.com/docs/serviceapi/datalab/search/search.md
 */
@Injectable()
export class NaverDataLabProvider implements ITrendProvider {
  private readonly logger = new Logger(NaverDataLabProvider.name);
  private readonly apiUrl = 'https://openapi.naver.com/v1/datalab/search';
  private readonly shoppingApiUrl = 'https://openapi.naver.com/v1/datalab/shopping/categories';

  readonly name = 'naver' as const;

  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(private readonly config: ConfigService) {
    this.clientId = this.config.get<string>('NAVER_CLIENT_ID') || '';
    this.clientSecret = this.config.get<string>('NAVER_CLIENT_SECRET') || '';

    if (!this.clientId || !this.clientSecret) {
      this.logger.warn('Naver API credentials not configured. Naver DataLab will be unavailable.');
    }
  }

  /**
   * Fetch trending search terms from Naver DataLab
   */
  async fetchTrends(options: NaverDataLabOptions = {}): Promise<TrendResult> {
    if (!await this.isAvailable()) {
      this.logger.warn('Naver DataLab not available - using fallback data');
      return this.getFallbackTrends();
    }

    const category = options.category || 'all';

    this.logger.log(`Fetching Naver DataLab trends for category: ${category}`);

    try {
      // Get trending keywords based on category
      const keywords = this.getCategoryKeywords(category);
      const items = await this.searchKeywordTrends(keywords, options);

      return {
        items,
        source: 'naver',
        fetchedAt: new Date(),
        geo: 'KR',
        category,
      };
    } catch (error) {
      this.logger.error('Failed to fetch Naver DataLab trends', error);
      return this.getFallbackTrends();
    }
  }

  /**
   * Search keyword trends from Naver DataLab
   */
  async searchKeywordTrends(keywords: string[], options: NaverDataLabOptions = {}): Promise<TrendItem[]> {
    if (!await this.isAvailable()) {
      return [];
    }

    const endDate = options.endDate || this.formatDate(new Date());
    const startDate = options.startDate || this.formatDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const timeUnit = options.timeUnit || 'date';

    // Naver API allows max 5 keyword groups
    const keywordGroups = keywords.slice(0, 5).map(keyword => ({
      groupName: keyword,
      keywords: [keyword],
    }));

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          startDate,
          endDate,
          timeUnit,
          keywordGroups,
          ...(options.ages && { ages: options.ages }),
          ...(options.gender && options.gender !== 'all' && { gender: options.gender === 'male' ? 'm' : 'f' }),
        },
        {
          headers: {
            'X-Naver-Client-Id': this.clientId,
            'X-Naver-Client-Secret': this.clientSecret,
            'Content-Type': 'application/json',
          },
        },
      );

      const results = response.data.results || [];

      return results.map((result: any) => {
        const dataPoints = result.data || [];
        const avgRatio = dataPoints.length > 0
          ? dataPoints.reduce((sum: number, d: any) => sum + (d.ratio || 0), 0) / dataPoints.length
          : 0;

        return {
          keyword: result.title || result.keywords?.[0] || '',
          score: avgRatio,
          source: 'naver' as const,
          metadata: {
            dataPoints: dataPoints.length,
            trend: this.calculateTrend(dataPoints),
            lastValue: dataPoints[dataPoints.length - 1]?.ratio || 0,
          },
        };
      });
    } catch (error) {
      this.logger.error('Failed to search Naver keyword trends', error);
      throw error;
    }
  }

  /**
   * Fetch shopping category trends
   */
  async fetchShoppingTrends(categoryCode = '50000000'): Promise<TrendItem[]> {
    if (!await this.isAvailable()) {
      return [];
    }

    const endDate = this.formatDate(new Date());
    const startDate = this.formatDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

    try {
      const response = await axios.post(
        this.shoppingApiUrl,
        {
          startDate,
          endDate,
          timeUnit: 'date',
          category: categoryCode,
        },
        {
          headers: {
            'X-Naver-Client-Id': this.clientId,
            'X-Naver-Client-Secret': this.clientSecret,
            'Content-Type': 'application/json',
          },
        },
      );

      const results = response.data.results || [];

      return results.map((result: any) => {
        const dataPoints = result.data || [];
        const avgRatio = dataPoints.length > 0
          ? dataPoints.reduce((sum: number, d: any) => sum + (d.ratio || 0), 0) / dataPoints.length
          : 0;

        return {
          keyword: result.title || '',
          score: avgRatio,
          source: 'naver' as const,
          category: 'shopping',
          metadata: {
            categoryCode,
            trend: this.calculateTrend(dataPoints),
          },
        };
      });
    } catch (error) {
      this.logger.error('Failed to fetch Naver shopping trends', error);
      throw error;
    }
  }

  /**
   * Check if Naver API is available
   */
  async isAvailable(): Promise<boolean> {
    return !!(this.clientId && this.clientSecret);
  }

  /**
   * Get fallback trends when API is not available
   */
  private getFallbackTrends(): TrendResult {
    const fallbackKeywords = [
      { keyword: '건강관리', score: 85 },
      { keyword: '투자전략', score: 80 },
      { keyword: 'AI 활용법', score: 90 },
      { keyword: '역사 이야기', score: 70 },
      { keyword: '추천 제품', score: 75 },
    ];

    return {
      items: fallbackKeywords.map(item => ({
        ...item,
        source: 'naver' as const,
        metadata: { isFallback: true },
      })),
      source: 'naver',
      fetchedAt: new Date(),
      geo: 'KR',
    };
  }

  /**
   * Get category-specific keywords for trend search
   */
  private getCategoryKeywords(category: string): string[] {
    const categoryKeywords: Record<string, string[]> = {
      health: ['건강', '운동', '영양제', '다이어트', '수면'],
      finance: ['주식', '부동산', '금리', '투자', '연금'],
      tech: ['AI', '챗GPT', '스마트폰', '앱', '테크'],
      history: ['역사', '한국사', '세계사', '문화재', '유적'],
      commerce: ['쇼핑', '할인', '추천', '리뷰', '인기상품'],
      all: ['트렌드', '인기', '추천', '화제', '핫이슈'],
    };

    return categoryKeywords[category] || categoryKeywords.all;
  }

  /**
   * Calculate trend direction from data points
   */
  private calculateTrend(dataPoints: any[]): 'up' | 'down' | 'stable' {
    if (dataPoints.length < 2) return 'stable';

    const firstHalf = dataPoints.slice(0, Math.floor(dataPoints.length / 2));
    const secondHalf = dataPoints.slice(Math.floor(dataPoints.length / 2));

    const firstAvg = firstHalf.reduce((sum, d) => sum + (d.ratio || 0), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + (d.ratio || 0), 0) / secondHalf.length;

    const diff = secondAvg - firstAvg;

    if (diff > 5) return 'up';
    if (diff < -5) return 'down';
    return 'stable';
  }

  /**
   * Format date to YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
