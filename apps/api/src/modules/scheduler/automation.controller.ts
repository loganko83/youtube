import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AutomationService } from './automation.service';
import { CreateAutomationDto, UpdateAutomationDto } from './automation.dto';

@ApiTags('automation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/automation')
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Get()
  @ApiOperation({ summary: 'Get automation settings for a project' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Automation settings retrieved',
  })
  async getAutomation(
    @CurrentUser('id') userId: string,
    @Param('projectId') projectId: string,
  ) {
    const automation = await this.automationService.getAutomation(
      userId,
      projectId,
    );
    return {
      success: true,
      data: automation,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create automation settings for a project' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Automation settings created',
  })
  async createAutomation(
    @CurrentUser('id') userId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreateAutomationDto,
  ) {
    const automation = await this.automationService.upsertAutomation(
      userId,
      projectId,
      dto,
    );
    return {
      success: true,
      data: automation,
    };
  }

  @Put()
  @ApiOperation({ summary: 'Update automation settings for a project' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Automation settings updated',
  })
  async updateAutomation(
    @CurrentUser('id') userId: string,
    @Param('projectId') projectId: string,
    @Body() dto: UpdateAutomationDto,
  ) {
    const automation = await this.automationService.upsertAutomation(
      userId,
      projectId,
      dto,
    );
    return {
      success: true,
      data: automation,
    };
  }

  @Post('enable')
  @ApiOperation({ summary: 'Enable automation for a project' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Automation enabled',
  })
  async enableAutomation(
    @CurrentUser('id') userId: string,
    @Param('projectId') projectId: string,
  ) {
    const automation = await this.automationService.enableAutomation(
      userId,
      projectId,
    );
    return {
      success: true,
      data: automation,
      message: 'Automation enabled',
    };
  }

  @Post('disable')
  @ApiOperation({ summary: 'Disable automation for a project' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Automation disabled',
  })
  async disableAutomation(
    @CurrentUser('id') userId: string,
    @Param('projectId') projectId: string,
  ) {
    const automation = await this.automationService.disableAutomation(
      userId,
      projectId,
    );
    return {
      success: true,
      data: automation,
      message: 'Automation disabled',
    };
  }

  @Delete()
  @ApiOperation({ summary: 'Delete automation settings for a project' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Automation settings deleted',
  })
  async deleteAutomation(
    @CurrentUser('id') userId: string,
    @Param('projectId') projectId: string,
  ) {
    await this.automationService.deleteAutomation(userId, projectId);
    return {
      success: true,
      message: 'Automation settings deleted',
    };
  }
}

@ApiTags('automation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('automation')
export class AutomationStatsController {
  constructor(private readonly automationService: AutomationService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get automation statistics for current user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Automation statistics',
  })
  async getStats(@CurrentUser('id') userId: string) {
    const stats = await this.automationService.getAutomationStats(userId);
    return {
      success: true,
      data: stats,
    };
  }
}
