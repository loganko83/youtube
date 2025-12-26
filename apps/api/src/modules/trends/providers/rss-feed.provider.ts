import { Injectable, Logger } from '@nestjs/common';
import Parser from 'rss-parser';
import {
  ITrendProvider,
  TrendResult,
  TrendItem,
  RssFeedOptions,
} from '../trends.interface';

/**
 * RSS Feed Provider
 *
 * Fetches and parses news/blog RSS feeds to extract trending topics
 * Supports multiple feed sources with keyword extraction
 */
@Injectable()
export class RssFeedProvider implements ITrendProvider {
  private readonly logger = new Logger(RssFeedProvider.name);
  private readonly parser: Parser;

  readonly name = 'rss' as const;

  /**
   * Default RSS feed URLs for Korean news
   */
  private readonly defaultFeeds: Record<string, string[]> = {
    news: [
      'https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko', // Google News Korea
    ],
    tech: [
      'https://news.google.com/rss/search?q=IT+기술&hl=ko&gl=KR&ceid=KR:ko',
    ],
    health: [
      'https://news.google.com/rss/search?q=건강+의료&hl=ko&gl=KR&ceid=KR:ko',
    ],
    finance: [
      'https://news.google.com/rss/search?q=경제+금융+투자&hl=ko&gl=KR&ceid=KR:ko',
    ],
    entertainment: [
      'https://news.google.com/rss/search?q=엔터테인먼트&hl=ko&gl=KR&ceid=KR:ko',
    ],
  };

  constructor() {
    this.parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'TubeGenius/1.0 (RSS Feed Reader)',
      },
    });
  }

  /**
   * Fetch trends from RSS feeds
   */
  async fetchTrends(options: RssFeedOptions = {}): Promise<TrendResult> {
    const category = options.category || 'news';
    const limit = options.limit || 20;
    const maxItemsPerFeed = options.maxItemsPerFeed || 10;

    // Use provided URLs or default ones
    const feedUrls = options.feedUrls || this.defaultFeeds[category] || this.defaultFeeds.news;

    this.logger.log(`Fetching RSS feeds for category: ${category}`);

    const allItems: TrendItem[] = [];

    for (const url of feedUrls) {
      try {
        const items = await this.parseFeed(url, maxItemsPerFeed);
        allItems.push(...items);
      } catch (error) {
        this.logger.warn(`Failed to parse feed ${url}:`, error);
        // Continue with other feeds
      }
    }

    // Sort by publishedAt (most recent first)
    allItems.sort((a, b) => {
      const dateA = a.publishedAt?.getTime() || 0;
      const dateB = b.publishedAt?.getTime() || 0;
      return dateB - dateA;
    });

    // Limit results
    const limitedItems = allItems.slice(0, limit);

    // Assign scores based on recency
    limitedItems.forEach((item, index) => {
      item.score = Math.max(100 - index * 5, 10);
    });

    return {
      items: limitedItems,
      source: 'rss',
      fetchedAt: new Date(),
      geo: options.geo || 'KR',
      category,
    };
  }

  /**
   * Parse a single RSS feed
   */
  private async parseFeed(url: string, maxItems: number): Promise<TrendItem[]> {
    try {
      const feed = await this.parser.parseURL(url);
      const items: TrendItem[] = [];

      for (const item of feed.items?.slice(0, maxItems) || []) {
        const keywords = this.extractKeywords(item.title || '', item.contentSnippet || '');

        items.push({
          keyword: item.title || '',
          score: 0, // Will be assigned later based on position
          source: 'rss',
          category: feed.title || 'news',
          relatedKeywords: keywords,
          url: item.link || undefined,
          publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
          metadata: {
            feedTitle: feed.title,
            feedUrl: url,
            contentSnippet: item.contentSnippet?.slice(0, 200),
          },
        });
      }

      return items;
    } catch (error) {
      this.logger.error(`Error parsing RSS feed ${url}:`, error);
      throw error;
    }
  }

  /**
   * Fetch feeds from custom URLs
   */
  async fetchCustomFeeds(urls: string[], limit = 20): Promise<TrendItem[]> {
    const allItems: TrendItem[] = [];

    for (const url of urls) {
      try {
        const items = await this.parseFeed(url, limit);
        allItems.push(...items);
      } catch (error) {
        this.logger.warn(`Failed to parse custom feed ${url}`);
      }
    }

    return allItems.slice(0, limit);
  }

  /**
   * Check if RSS provider is available
   */
  async isAvailable(): Promise<boolean> {
    return true; // RSS parsing is always available
  }

  /**
   * Extract keywords from title and content
   */
  private extractKeywords(title: string, content: string): string[] {
    const text = `${title} ${content}`;

    // Remove special characters and split into words
    const words = text
      .replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length >= 2);

    // Count word frequency
    const wordCount = new Map<string, number>();
    for (const word of words) {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    }

    // Filter common words and sort by frequency
    const commonWords = new Set([
      '있다', '없다', '하다', '되다', '것', '수', '등', '및', '또',
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'to', 'of',
      '기자', '뉴스', '속보', '관련', '대한',
    ]);

    const sortedWords = Array.from(wordCount.entries())
      .filter(([word]) => !commonWords.has(word.toLowerCase()))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);

    return sortedWords;
  }

  /**
   * Add custom feed URL
   */
  addDefaultFeed(category: string, url: string): void {
    if (!this.defaultFeeds[category]) {
      this.defaultFeeds[category] = [];
    }
    this.defaultFeeds[category].push(url);
  }

  /**
   * Get available feed categories
   */
  getAvailableCategories(): string[] {
    return Object.keys(this.defaultFeeds);
  }
}
