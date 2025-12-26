import { Controller, Post, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { WebhooksService } from './webhooks.service';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly config: ConfigService,
  ) {}

  @Post('n8n')
  @ApiOperation({ summary: 'Handle n8n workflow webhooks' })
  @ApiHeader({ name: 'x-webhook-secret', description: 'Webhook secret for authentication' })
  async handleN8nWebhook(
    @Headers('x-webhook-secret') secret: string,
    @Body() payload: any,
  ) {
    const expectedSecret = this.config.get<string>('N8N_WEBHOOK_SECRET');

    if (expectedSecret && secret !== expectedSecret) {
      throw new UnauthorizedException('Invalid webhook secret');
    }

    return this.webhooksService.handleN8nWebhook(payload);
  }
}
