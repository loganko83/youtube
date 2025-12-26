import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TrendsService } from './trends.service';
import {
  GetTrendsQueryDto,
  GetNicheMatchedTrendsDto,
  SearchKeywordTrendsDto,
  TrendsResponseDto,
  NicheMatchedTrendResponseDto,
  TopicSuggestionDto,
} from './trends.dto';
import { TrendSourceType } from './trends.interface';

/**
 * Trends Controller
 *
 * API endpoints for fetching and analyzing trends
 */
@Controller('trends')
@UseGuards(JwtAuthGuard)
export class TrendsController {
  constructor(private readonly trendsService: TrendsService) {}

  /**
   * GET /trends
   * Fetch trends from specified or all sources
   */
  @Get()
  async getTrends(@Query() query: GetTrendsQueryDto): Promise<TrendsResponseDto> {
    const { source, geo, category, limit } = query;

    if (source === 'all' || !source) {
      const items = await this.trendsService.getAggregatedTrends({
        geo,
        category,
        limit,
      });

      return {
        items,
        source: 'aggregated',
        fetchedAt: new Date(),
        geo: geo || 'KR',
        totalCount: items.length,
      };
    }

    const result = await this.trendsService.fetchTrendsBySource(source as TrendSourceType, {
      geo,
      category,
      limit,
    });

    return {
      items: result.items,
      source: result.source,
      fetchedAt: result.fetchedAt,
      geo: result.geo,
      totalCount: result.items.length,
    };
  }

  /**
   * GET /trends/niche-matched
   * Get trends matched to a specific niche
   */
  @Get('niche-matched')
  async getNicheMatchedTrends(
    @Query() query: GetNicheMatchedTrendsDto,
  ): Promise<NicheMatchedTrendResponseDto[]> {
    const { niche, minRelevance, limit } = query;

    const matched = await this.trendsService.getNicheMatchedTrends(niche, minRelevance, limit);

    return matched.map(m => ({
      trend: m.trend,
      niche: m.niche,
      relevanceScore: m.relevanceScore,
      suggestedTopic: m.suggestedTopic,
    }));
  }

  /**
   * GET /trends/suggestions
   * Get topic suggestions based on trends for a niche
   */
  @Get('suggestions')
  async getTopicSuggestions(
    @Query() query: GetNicheMatchedTrendsDto,
  ): Promise<TopicSuggestionDto[]> {
    const { niche, limit } = query;

    return this.trendsService.getTopicSuggestions(niche, limit || 5);
  }

  /**
   * POST /trends/search
   * Search specific keywords across all sources
   */
  @Post('search')
  async searchKeywords(@Body() body: SearchKeywordTrendsDto) {
    const results = await this.trendsService.searchKeywords(body.keywords);

    return {
      keywords: body.keywords,
      results,
      fetchedAt: new Date(),
    };
  }

  /**
   * GET /trends/providers/status
   * Check availability of trend providers
   */
  @Get('providers/status')
  async getProviderStatus() {
    const status = await this.trendsService.getProviderStatus();

    return {
      providers: status,
      checkedAt: new Date(),
    };
  }

  /**
   * GET /trends/realtime
   * Get real-time trends from Google
   */
  @Get('realtime')
  async getRealtimeTrends(
    @Query('geo') geo?: string,
    @Query('category') category?: string,
  ) {
    const { GoogleTrendsProvider } = await import('./providers/google-trends.provider');
    const provider = new GoogleTrendsProvider();

    return provider.fetchRealTimeTrends(geo || 'KR', category || 'all');
  }
}
