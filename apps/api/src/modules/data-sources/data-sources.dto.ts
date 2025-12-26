import { IsString, IsOptional, IsEnum, IsUrl, IsObject, IsBoolean } from 'class-validator';

/**
 * Data source types (matches Prisma enum)
 */
export enum DataSourceType {
  RSS = 'RSS',
  API = 'API',
  GOOGLE_TRENDS = 'GOOGLE_TRENDS',
  NAVER_DATALAB = 'NAVER_DATALAB',
  CUSTOM = 'CUSTOM',
}

/**
 * Create data source DTO
 */
export class CreateDataSourceDto {
  @IsString()
  name: string;

  @IsEnum(DataSourceType)
  type: DataSourceType;

  @IsOptional()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

/**
 * Update data source DTO
 */
export class UpdateDataSourceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * Data source response
 */
export class DataSourceResponseDto {
  id: string;
  projectId: string;
  name: string;
  type: DataSourceType;
  url?: string;
  config?: Record<string, any>;
  isActive: boolean;
  lastFetchedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Fetch result from data source
 */
export class DataSourceFetchResultDto {
  dataSourceId: string;
  success: boolean;
  itemCount: number;
  fetchedAt: Date;
  error?: string;
  items?: any[];
}
