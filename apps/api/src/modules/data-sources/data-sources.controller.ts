import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { DataSourcesService } from './data-sources.service';
import { CreateDataSourceDto, UpdateDataSourceDto } from './data-sources.dto';

/**
 * Data Sources Controller
 *
 * CRUD endpoints for project data sources
 */
@Controller('projects/:projectId/data-sources')
@UseGuards(JwtAuthGuard)
export class DataSourcesController {
  constructor(private readonly dataSourcesService: DataSourcesService) {}

  /**
   * POST /projects/:projectId/data-sources
   * Create a new data source
   */
  @Post()
  async create(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateDataSourceDto,
  ) {
    return this.dataSourcesService.create(projectId, userId, dto);
  }

  /**
   * GET /projects/:projectId/data-sources
   * List all data sources for a project
   */
  @Get()
  async findAll(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.dataSourcesService.findAllByProject(projectId, userId);
  }

  /**
   * GET /projects/:projectId/data-sources/stats
   * Get data source statistics
   */
  @Get('stats')
  async getStats(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.dataSourcesService.getStats(projectId, userId);
  }

  /**
   * POST /projects/:projectId/data-sources/fetch-all
   * Fetch data from all active sources
   */
  @Post('fetch-all')
  async fetchAll(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.dataSourcesService.fetchAllForProject(projectId, userId);
  }

  /**
   * GET /projects/:projectId/data-sources/:id
   * Get a single data source
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.dataSourcesService.findOne(id, userId);
  }

  /**
   * PUT /projects/:projectId/data-sources/:id
   * Update a data source
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateDataSourceDto,
  ) {
    return this.dataSourcesService.update(id, userId, dto);
  }

  /**
   * DELETE /projects/:projectId/data-sources/:id
   * Delete a data source
   */
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.dataSourcesService.delete(id, userId);
  }

  /**
   * POST /projects/:projectId/data-sources/:id/toggle
   * Toggle data source active status
   */
  @Post(':id/toggle')
  async toggle(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.dataSourcesService.toggleActive(id, userId);
  }

  /**
   * POST /projects/:projectId/data-sources/:id/fetch
   * Manually fetch data from a source
   */
  @Post(':id/fetch')
  async fetch(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.dataSourcesService.fetchData(id, userId);
  }
}
