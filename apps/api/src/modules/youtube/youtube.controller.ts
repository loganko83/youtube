import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { YouTubeService } from './youtube.service';
import {
  YouTubeAuthUrlDto,
  YouTubeCallbackDto,
  YouTubeDisconnectDto,
  UploadVideoDto,
  YouTubeAuthResponseDto,
  YouTubeChannelInfoDto,
  UploadProgressDto,
} from './youtube.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('YouTube Integration')
@Controller('youtube')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class YouTubeController {
  constructor(private readonly youtubeService: YouTubeService) {}

  // ============================================================
  // OAuth Endpoints
  // ============================================================

  @Post('auth/url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get YouTube OAuth authorization URL',
    description:
      'Generate OAuth URL to connect a YouTube channel to a project. User will be redirected to YouTube to authorize access.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authorization URL generated successfully',
    type: YouTubeAuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'YouTube OAuth not configured' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async getAuthUrl(@Body() dto: YouTubeAuthUrlDto): Promise<YouTubeAuthResponseDto> {
    return this.youtubeService.getAuthUrl(dto);
  }

  @Post('auth/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Handle YouTube OAuth callback',
    description:
      'Exchange authorization code for access/refresh tokens and store channel information.',
  })
  @ApiResponse({
    status: 200,
    description: 'YouTube channel connected successfully',
    type: YouTubeChannelInfoDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid authorization code or callback parameters' })
  @ApiResponse({ status: 500, description: 'Failed to complete authentication' })
  async handleCallback(@Body() dto: YouTubeCallbackDto): Promise<YouTubeChannelInfoDto> {
    return this.youtubeService.handleCallback(dto);
  }

  @Delete('auth/disconnect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Disconnect YouTube channel',
    description: 'Remove YouTube channel connection and delete stored credentials.',
  })
  @ApiResponse({
    status: 200,
    description: 'YouTube channel disconnected successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'No YouTube channel connected' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async disconnect(@Body() dto: YouTubeDisconnectDto): Promise<{ success: boolean }> {
    return this.youtubeService.disconnect(dto);
  }

  @Get('channel/:projectId')
  @ApiOperation({
    summary: 'Get YouTube channel connection status',
    description: 'Retrieve information about the connected YouTube channel for a project.',
  })
  @ApiParam({
    name: 'projectId',
    description: 'Project ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Channel information retrieved (or null if not connected)',
    type: YouTubeChannelInfoDto,
  })
  async getChannelInfo(@Param('projectId') projectId: string): Promise<YouTubeChannelInfoDto | null> {
    return this.youtubeService.getChannelInfo(projectId);
  }

  // ============================================================
  // Video Upload Endpoints
  // ============================================================

  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Upload video to YouTube',
    description:
      'Upload a generated video to YouTube with metadata. Supports scheduling and privacy settings.',
  })
  @ApiResponse({
    status: 200,
    description: 'Video uploaded successfully',
    type: UploadProgressDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid upload parameters or video not available' })
  @ApiResponse({ status: 401, description: 'YouTube channel not connected or token expired' })
  @ApiResponse({ status: 404, description: 'Content or project not found' })
  @ApiResponse({ status: 500, description: 'Upload failed' })
  async uploadVideo(@Body() dto: UploadVideoDto): Promise<UploadProgressDto> {
    return this.youtubeService.uploadVideo(dto);
  }

  @Get('upload/status/:contentId')
  @ApiOperation({
    summary: 'Get video upload status',
    description: 'Check the current status of a video upload or scheduled publication.',
  })
  @ApiParam({
    name: 'contentId',
    description: 'Content ID',
    example: '456e7890-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Upload status retrieved successfully',
    type: UploadProgressDto,
  })
  @ApiResponse({ status: 404, description: 'Content not found' })
  async getUploadStatus(@Param('contentId') contentId: string): Promise<UploadProgressDto> {
    return this.youtubeService.getUploadStatus(contentId);
  }

  // ============================================================
  // Video Management Endpoints
  // ============================================================

  @Delete('video/:projectId/:videoId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete video from YouTube',
    description: 'Permanently delete a video from YouTube (cannot be undone).',
  })
  @ApiParam({
    name: 'projectId',
    description: 'Project ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'videoId',
    description: 'YouTube video ID',
    example: 'dQw4w9WgXcQ',
  })
  @ApiResponse({
    status: 200,
    description: 'Video deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'YouTube channel not connected' })
  @ApiResponse({ status: 500, description: 'Failed to delete video' })
  async deleteVideo(
    @Param('projectId') projectId: string,
    @Param('videoId') videoId: string,
  ): Promise<{ success: boolean }> {
    return this.youtubeService.deleteVideo(projectId, videoId);
  }
}
