import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrendsService } from '../trends/trends.service';
import { RssFeedProvider } from '../trends/providers/rss-feed.provider';
import {
  CreateDataSourceDto,
  UpdateDataSourceDto,
  DataSourceType,
  DataSourceFetchResultDto,
} from './data-sources.dto';

/**
 * Data Sources Service
 *
 * Manages project data sources for trend collection
 */
@Injectable()
export class DataSourcesService {
  private readonly logger = new Logger(DataSourcesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly trendsService: TrendsService,
    private readonly rssFeedProvider: RssFeedProvider,
  ) {}

  /**
   * Create a new data source for a project
   */
  async create(projectId: string, userId: string, dto: CreateDataSourceDto) {
    // Verify project ownership
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Validate URL for RSS type
    if (dto.type === DataSourceType.RSS && !dto.url) {
      throw new BadRequestException('URL is required for RSS data source');
    }

    const dataSource = await this.prisma.dataSource.create({
      data: {
        projectId,
        name: dto.name,
        type: dto.type,
        url: dto.url,
        config: dto.config || {},
        isActive: dto.isActive ?? true,
      },
    });

    this.logger.log(`Created data source ${dataSource.id} for project ${projectId}`);

    return dataSource;
  }

  /**
   * Get all data sources for a project
   */
  async findAllByProject(projectId: string, userId: string) {
    // Verify project ownership
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.prisma.dataSource.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single data source
   */
  async findOne(id: string, userId: string) {
    const dataSource = await this.prisma.dataSource.findFirst({
      where: {
        id,
        project: { userId },
      },
      include: {
        project: { select: { name: true, niche: true } },
      },
    });

    if (!dataSource) {
      throw new NotFoundException('Data source not found');
    }

    return dataSource;
  }

  /**
   * Update a data source
   */
  async update(id: string, userId: string, dto: UpdateDataSourceDto) {
    // Verify ownership
    const existing = await this.findOne(id, userId);

    const updated = await this.prisma.dataSource.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.url && { url: dto.url }),
        ...(dto.config && { config: dto.config }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    this.logger.log(`Updated data source ${id}`);

    return updated;
  }

  /**
   * Delete a data source
   */
  async delete(id: string, userId: string) {
    // Verify ownership
    await this.findOne(id, userId);

    await this.prisma.dataSource.delete({ where: { id } });

    this.logger.log(`Deleted data source ${id}`);

    return { success: true };
  }

  /**
   * Toggle data source active status
   */
  async toggleActive(id: string, userId: string) {
    const existing = await this.findOne(id, userId);

    const updated = await this.prisma.dataSource.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    return updated;
  }

  /**
   * Manually fetch data from a data source
   */
  async fetchData(id: string, userId: string): Promise<DataSourceFetchResultDto> {
    const dataSource = await this.findOne(id, userId);

    this.logger.log(`Fetching data from source ${id} (${dataSource.type})`);

    try {
      let items: any[] = [];

      switch (dataSource.type) {
        case 'RSS':
          if (dataSource.url) {
            items = await this.rssFeedProvider.fetchCustomFeeds([dataSource.url]);
          }
          break;

        case 'GOOGLE_TRENDS':
          const googleResult = await this.trendsService.fetchTrendsBySource('google', {
            ...(dataSource.config as Record<string, any>),
          });
          items = googleResult.items;
          break;

        case 'NAVER_DATALAB':
          const naverResult = await this.trendsService.fetchTrendsBySource('naver', {
            ...(dataSource.config as Record<string, any>),
          });
          items = naverResult.items;
          break;

        case 'API':
        case 'CUSTOM':
          // Custom API handling would go here
          this.logger.warn(`Custom API fetch not implemented for source ${id}`);
          break;
      }

      // Update last fetched timestamp
      await this.prisma.dataSource.update({
        where: { id },
        data: { lastFetchedAt: new Date() },
      });

      return {
        dataSourceId: id,
        success: true,
        itemCount: items.length,
        fetchedAt: new Date(),
        items,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch data from source ${id}:`, error);

      return {
        dataSourceId: id,
        success: false,
        itemCount: 0,
        fetchedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Fetch data from all active sources for a project
   */
  async fetchAllForProject(projectId: string, userId: string): Promise<DataSourceFetchResultDto[]> {
    const sources = await this.findAllByProject(projectId, userId);
    const activeSources = sources.filter(s => s.isActive);

    const results = await Promise.all(
      activeSources.map(source => this.fetchData(source.id, userId)),
    );

    return results;
  }

  /**
   * Get data source statistics
   */
  async getStats(projectId: string, userId: string) {
    const sources = await this.findAllByProject(projectId, userId);

    return {
      total: sources.length,
      active: sources.filter(s => s.isActive).length,
      byType: {
        rss: sources.filter(s => s.type === 'RSS').length,
        api: sources.filter(s => s.type === 'API').length,
        google_trends: sources.filter(s => s.type === 'GOOGLE_TRENDS').length,
        naver_datalab: sources.filter(s => s.type === 'NAVER_DATALAB').length,
        custom: sources.filter(s => s.type === 'CUSTOM').length,
      },
      lastFetched: sources
        .filter(s => s.lastFetchedAt)
        .sort((a, b) => (b.lastFetchedAt?.getTime() || 0) - (a.lastFetchedAt?.getTime() || 0))[0]?.lastFetchedAt,
    };
  }
}
