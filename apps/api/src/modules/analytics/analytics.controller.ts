/**
 * Analytics Controller - Cost tracking and success rate endpoints
 */

import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Get cost breakdown for the authenticated user
   */
  @Get('costs')
  async getCosts(@Request() req: { user: { sub: string } }) {
    const costs = await this.analyticsService.getCostBreakdown(req.user.sub);
    return { success: true, data: costs };
  }

  /**
   * Get success rate metrics for the authenticated user
   */
  @Get('success-rates')
  async getSuccessRates(@Request() req: { user: { sub: string } }) {
    const rates = await this.analyticsService.getSuccessRates(req.user.sub);
    return { success: true, data: rates };
  }

  /**
   * Get automation metrics for the authenticated user
   */
  @Get('automation')
  async getAutomationMetrics(@Request() req: { user: { sub: string } }) {
    const metrics = await this.analyticsService.getAutomationMetrics(req.user.sub);
    return { success: true, data: metrics };
  }

  /**
   * Get all analytics data in one request
   */
  @Get()
  async getAllAnalytics(@Request() req: { user: { sub: string } }) {
    const [costs, successRates, automation] = await Promise.all([
      this.analyticsService.getCostBreakdown(req.user.sub),
      this.analyticsService.getSuccessRates(req.user.sub),
      this.analyticsService.getAutomationMetrics(req.user.sub),
    ]);

    return {
      success: true,
      data: {
        costs,
        successRates,
        automation,
      },
    };
  }
}
