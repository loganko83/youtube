import { IsString, IsOptional, IsNumber, IsEnum, IsArray, Min, Max } from 'class-validator';
import { NicheType } from '@tubegenius/shared';
import { TrendSourceType } from './trends.interface';

/**
 * Query params for fetching trends
 */
export class GetTrendsQueryDto {
  @IsOptional()
  @IsEnum(['google', 'naver', 'rss', 'all'])
  source?: TrendSourceType | 'all' = 'all';

  @IsOptional()
  @IsString()
  geo?: string = 'KR';

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

/**
 * Query params for niche-matched trends
 */
export class GetNicheMatchedTrendsDto {
  @IsEnum(NicheType)
  niche: NicheType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minRelevance?: number = 30;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}

/**
 * Request body for keyword search
 */
export class SearchKeywordTrendsDto {
  @IsArray()
  @IsString({ each: true })
  keywords: string[];

  @IsOptional()
  @IsString()
  geo?: string = 'KR';

  @IsOptional()
  @IsString()
  timeRange?: string = 'today 3-m';
}

/**
 * Trend item response
 */
export class TrendItemResponseDto {
  keyword: string;
  score: number;
  source: TrendSourceType;
  category?: string;
  relatedKeywords?: string[];
  url?: string;
  publishedAt?: Date;
}

/**
 * Niche-matched trend response
 */
export class NicheMatchedTrendResponseDto {
  trend: TrendItemResponseDto;
  niche: NicheType;
  relevanceScore: number;
  suggestedTopic?: string;
}

/**
 * Trends response
 */
export class TrendsResponseDto {
  items: TrendItemResponseDto[];
  source: TrendSourceType | 'aggregated';
  fetchedAt: Date;
  geo: string;
  totalCount: number;
}

/**
 * Topic suggestion from trends
 */
export class TopicSuggestionDto {
  topic: string;
  keywords: string[];
  trendScore: number;
  niche: NicheType;
  sources: TrendSourceType[];
  reasoning?: string;
}
