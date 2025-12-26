import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { SchedulerService } from './scheduler.service';

@ApiTags('scheduler')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('scheduler')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Get('jobs')
  @ApiOperation({ summary: 'Get all scheduled jobs' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all scheduled jobs',
  })
  getScheduledJobs() {
    const jobs = this.schedulerService.getCronJobs();
    return {
      success: true,
      data: jobs,
    };
  }

  @Get('jobs/:name')
  @ApiOperation({ summary: 'Get status of a specific job' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Job status',
  })
  getJobStatus(@Param('name') name: string) {
    const job = this.schedulerService.getCronJobStatus(name);
    if (!job) {
      return {
        success: false,
        error: 'Job not found',
      };
    }
    return {
      success: true,
      data: job,
    };
  }

  @Post('jobs/:name/start')
  @ApiOperation({ summary: 'Start a cron job' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Job started successfully',
  })
  startJob(@Param('name') name: string) {
    const success = this.schedulerService.startCronJob(name);
    return {
      success,
      message: success ? 'Job started' : 'Failed to start job',
    };
  }

  @Post('jobs/:name/stop')
  @ApiOperation({ summary: 'Stop a cron job' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Job stopped successfully',
  })
  stopJob(@Param('name') name: string) {
    const success = this.schedulerService.stopCronJob(name);
    return {
      success,
      message: success ? 'Job stopped' : 'Failed to stop job',
    };
  }

  @Post('trigger/trends/:projectId')
  @ApiOperation({ summary: 'Manually trigger trend collection for a project' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Trend collection triggered',
  })
  async triggerTrendCollection(@Param('projectId') projectId: string) {
    const result = await this.schedulerService.triggerTrendCollection(projectId);
    return {
      success: result !== null,
      data: result,
    };
  }

  @Post('trigger/content/:projectId')
  @ApiOperation({ summary: 'Manually trigger content generation for a project' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Content generation triggered',
  })
  async triggerContentGeneration(
    @CurrentUser('id') userId: string,
    @Param('projectId') projectId: string,
  ) {
    const result = await this.schedulerService.triggerContentGeneration(
      userId,
      projectId,
    );
    return {
      success: result !== null,
      data: result,
    };
  }
}
