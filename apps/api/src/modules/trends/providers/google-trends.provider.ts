import { Injectable, Logger } from '@nestjs/common';
import {
  ITrendProvider,
  TrendResult,
  TrendItem,
  GoogleTrendsOptions,
} from '../trends.interface';

/**
 * Google Trends Provider
 *
 * Fetches real-time and daily trending topics from Google Trends
 * Uses google-trends-api package
 */
@Injectable()
export class GoogleTrendsProvider implements ITrendProvider {
  private readonly logger = new Logger(GoogleTrendsProvider.name);

  readonly name = 'google' as const;

  /**
   * Fetch trending topics from Google Trends
   */
  async fetchTrends(options: GoogleTrendsOptions = {}): Promise<TrendResult> {
    const geo = options.geo || 'KR';
    const limit = options.limit || 20;

    this.logger.log(`Fetching Google Trends for geo: ${geo}`);

    try {
      // Dynamic import for google-trends-api
      const googleTrends = await import('google-trends-api');

      // Fetch daily trends (most stable API)
      const dailyTrendsResult = await googleTrends.dailyTrends({
        geo,
        trendDate: new Date(),
      });

      const data = JSON.parse(dailyTrendsResult);
      const trendingSearchesDays = data.default?.trendingSearchesDays || [];

      const items: TrendItem[] = [];

      for (const day of trendingSearchesDays) {
        for (const search of day.trendingSearches || []) {
          if (items.length >= limit) break;

          const title = search.title?.query || '';
          const traffic = search.formattedTraffic || '0';

          // Parse traffic (e.g., "100K+" -> 100000)
          const score = this.parseTraffic(traffic);

          items.push({
            keyword: title,
            score: Math.min(score / 1000, 100), // Normalize to 0-100
            source: 'google',
            relatedKeywords: search.relatedQueries?.map((q: any) => q.query) || [],
            url: search.articles?.[0]?.url,
            publishedAt: new Date(),
            metadata: {
              formattedTraffic: traffic,
              articles: search.articles?.slice(0, 3),
            },
          });
        }
      }

      this.logger.log(`Fetched ${items.length} trends from Google`);

      return {
        items,
        source: 'google',
        fetchedAt: new Date(),
        geo,
      };
    } catch (error) {
      this.logger.error('Failed to fetch Google Trends', error);
      throw error;
    }
  }

  /**
   * Fetch real-time trends (hourly updates)
   */
  async fetchRealTimeTrends(geo = 'KR', category = 'all'): Promise<TrendResult> {
    this.logger.log(`Fetching real-time trends for geo: ${geo}, category: ${category}`);

    try {
      const googleTrends = await import('google-trends-api');

      // Map category to Google's category ID
      const categoryId = this.getCategoryId(category);

      const result = await googleTrends.realTimeTrends({
        geo,
        category: categoryId,
      });

      const data = JSON.parse(result);
      const stories = data.storySummaries?.trendingStories || [];

      const items: TrendItem[] = stories.map((story: any, index: number) => ({
        keyword: story.title || story.entityNames?.[0] || '',
        score: 100 - index * 5, // Rank-based score
        source: 'google' as const,
        category,
        relatedKeywords: story.entityNames || [],
        url: story.articles?.[0]?.url,
        publishedAt: new Date(),
        metadata: {
          articles: story.articles?.slice(0, 3),
          image: story.image?.imageUrl,
        },
      }));

      return {
        items,
        source: 'google',
        fetchedAt: new Date(),
        geo,
        category,
      };
    } catch (error) {
      this.logger.error('Failed to fetch real-time trends', error);
      throw error;
    }
  }

  /**
   * Search interest over time for specific keywords
   */
  async searchKeywordInterest(keywords: string[], geo = 'KR', timeRange = 'today 3-m'): Promise<TrendItem[]> {
    this.logger.log(`Searching keyword interest for: ${keywords.join(', ')}`);

    try {
      const googleTrends = await import('google-trends-api');

      const result = await googleTrends.interestOverTime({
        keyword: keywords,
        geo,
        startTime: this.getStartTime(timeRange),
      });

      const data = JSON.parse(result);
      const timelineData = data.default?.timelineData || [];

      // Get average interest for each keyword
      const keywordScores: Record<string, number[]> = {};
      keywords.forEach(k => (keywordScores[k] = []));

      for (const point of timelineData) {
        keywords.forEach((keyword, idx) => {
          const value = point.value?.[idx] || 0;
          keywordScores[keyword].push(value);
        });
      }

      return keywords.map(keyword => {
        const scores = keywordScores[keyword];
        const avgScore = scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0;

        return {
          keyword,
          score: avgScore,
          source: 'google' as const,
          metadata: {
            dataPoints: scores.length,
            maxScore: Math.max(...scores),
            minScore: Math.min(...scores),
          },
        };
      });
    } catch (error) {
      this.logger.error('Failed to search keyword interest', error);
      throw error;
    }
  }

  /**
   * Check if Google Trends API is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await import('google-trends-api');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Parse traffic string to number
   */
  private parseTraffic(traffic: string): number {
    const cleaned = traffic.replace(/[^0-9KMB+]/gi, '');
    let num = parseInt(cleaned.replace(/[KMB+]/gi, ''), 10) || 0;

    if (cleaned.includes('K')) num *= 1000;
    if (cleaned.includes('M')) num *= 1000000;
    if (cleaned.includes('B')) num *= 1000000000;

    return num;
  }

  /**
   * Get category ID for Google Trends
   */
  private getCategoryId(category: string): string {
    const categoryMap: Record<string, string> = {
      all: 'all',
      business: 'b',
      entertainment: 'e',
      health: 'm',
      science: 't',
      sports: 's',
      top: 'h',
    };

    return categoryMap[category.toLowerCase()] || 'all';
  }

  /**
   * Get start time from time range string
   */
  private getStartTime(timeRange: string): Date {
    const now = new Date();

    if (timeRange.includes('1-H')) {
      return new Date(now.getTime() - 60 * 60 * 1000);
    } else if (timeRange.includes('4-H')) {
      return new Date(now.getTime() - 4 * 60 * 60 * 1000);
    } else if (timeRange.includes('1-d')) {
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (timeRange.includes('7-d')) {
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeRange.includes('1-m')) {
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (timeRange.includes('3-m')) {
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }

    return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // Default 3 months
  }
}
