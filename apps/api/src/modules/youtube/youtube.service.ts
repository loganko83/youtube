import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, Auth } from 'googleapis';
import { PrismaService } from '../prisma/prisma.service';
import {
  YouTubeAuthUrlDto,
  YouTubeCallbackDto,
  YouTubeDisconnectDto,
  UploadVideoDto,
  YouTubeAuthResponseDto,
  YouTubeChannelInfoDto,
  UploadProgressDto,
  VideoPrivacyStatus,
} from './youtube.dto';
import * as fs from 'fs';
import * as crypto from 'crypto';

@Injectable()
export class YouTubeService {
  private readonly logger = new Logger(YouTubeService.name);
  private oauth2Client: Auth.OAuth2Client;
  private readonly SCOPES = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtube.force-ssl',
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.initializeOAuth();
  }

  /**
   * Initialize OAuth2 client with credentials from environment
   */
  private initializeOAuth() {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.config.get<string>('GOOGLE_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      this.logger.warn(
        'YouTube OAuth credentials not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
      );
      return;
    }

    this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  }

  // ============================================================
  // OAuth Flow Methods
  // ============================================================

  /**
   * Generate OAuth authorization URL for YouTube channel connection
   */
  async getAuthUrl(dto: YouTubeAuthUrlDto): Promise<YouTubeAuthResponseDto> {
    if (!this.oauth2Client) {
      throw new BadRequestException('YouTube OAuth not configured');
    }

    // Verify project exists and belongs to user
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project ${dto.projectId} not found`);
    }

    // Generate state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');

    // Store state temporarily (in production, use Redis with TTL)
    // For now, we'll validate it in the callback

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline', // Get refresh token
      scope: this.SCOPES,
      redirect_uri: dto.redirectUri,
      state: `${state}:${dto.projectId}`, // Encode projectId in state
      prompt: 'consent', // Force consent to get refresh token
    });

    return {
      authUrl,
      state,
    };
  }

  /**
   * Handle OAuth callback and store tokens
   */
  async handleCallback(dto: YouTubeCallbackDto): Promise<YouTubeChannelInfoDto> {
    if (!this.oauth2Client) {
      throw new BadRequestException('YouTube OAuth not configured');
    }

    try {
      // Exchange authorization code for tokens
      const { tokens } = await this.oauth2Client.getToken({
        code: dto.code,
        redirect_uri: dto.redirectUri,
      });

      if (!tokens.access_token || !tokens.refresh_token) {
        throw new BadRequestException('Failed to obtain access and refresh tokens');
      }

      // Set credentials to fetch channel info
      this.oauth2Client.setCredentials(tokens);
      const youtube = google.youtube({ version: 'v3', auth: this.oauth2Client });

      // Get channel information
      const channelResponse = await youtube.channels.list({
        part: ['snippet'],
        mine: true,
      });

      if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
        throw new BadRequestException('No YouTube channel found for this account');
      }

      const channel = channelResponse.data.items[0]!;
      const channelId = channel.id ?? '';
      const channelName = channel.snippet?.title || 'Unknown Channel';

      // Calculate token expiry
      const tokenExpiry = new Date();
      tokenExpiry.setSeconds(tokenExpiry.getSeconds() + (tokens.expiry_date || 3600));

      // Update project with YouTube credentials (encrypted in production)
      await this.prisma.project.update({
        where: { id: dto.projectId },
        data: {
          youtubeChannelId: channelId,
          youtubeChannelName: channelName,
          youtubeAccessToken: tokens.access_token,
          youtubeRefreshToken: tokens.refresh_token,
          youtubeTokenExpiry: tokenExpiry,
        },
      });

      this.logger.log(`YouTube channel ${channelId} connected to project ${dto.projectId}`);

      return {
        channelId,
        channelName,
        tokenExpiry,
        isConnected: true,
      };
    } catch (error) {
      this.logger.error('OAuth callback error:', error);
      throw new InternalServerErrorException('Failed to complete YouTube authentication');
    }
  }

  /**
   * Disconnect YouTube channel from project
   */
  async disconnect(dto: YouTubeDisconnectDto): Promise<{ success: boolean }> {
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project ${dto.projectId} not found`);
    }

    if (!project.youtubeChannelId) {
      throw new BadRequestException('No YouTube channel connected to this project');
    }

    // Clear YouTube credentials
    await this.prisma.project.update({
      where: { id: dto.projectId },
      data: {
        youtubeChannelId: null,
        youtubeChannelName: null,
        youtubeAccessToken: null,
        youtubeRefreshToken: null,
        youtubeTokenExpiry: null,
      },
    });

    this.logger.log(`YouTube channel disconnected from project ${dto.projectId}`);

    return { success: true };
  }

  /**
   * Get YouTube channel connection status
   */
  async getChannelInfo(projectId: string): Promise<YouTubeChannelInfoDto | null> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        youtubeChannelId: true,
        youtubeChannelName: true,
        youtubeTokenExpiry: true,
      },
    });

    if (!project || !project.youtubeChannelId) {
      return null;
    }

    return {
      channelId: project.youtubeChannelId,
      channelName: project.youtubeChannelName || 'Unknown Channel',
      tokenExpiry: project.youtubeTokenExpiry || new Date(),
      isConnected: true,
    };
  }

  // ============================================================
  // Token Management
  // ============================================================

  /**
   * Refresh access token if expired
   */
  private async refreshAccessToken(projectId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || !project.youtubeRefreshToken) {
      throw new UnauthorizedException('YouTube channel not connected');
    }

    // Check if token is expired or expiring soon (within 5 minutes)
    const now = new Date();
    const expiryDate = project.youtubeTokenExpiry || now;
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    if (expiryDate > fiveMinutesFromNow) {
      // Token still valid
      return;
    }

    try {
      this.oauth2Client.setCredentials({
        refresh_token: project.youtubeRefreshToken,
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();

      if (!credentials.access_token) {
        throw new Error('Failed to refresh access token');
      }

      // Update project with new token
      const newExpiry = new Date();
      newExpiry.setSeconds(newExpiry.getSeconds() + (credentials.expiry_date || 3600));

      await this.prisma.project.update({
        where: { id: projectId },
        data: {
          youtubeAccessToken: credentials.access_token,
          youtubeTokenExpiry: newExpiry,
        },
      });

      this.logger.log(`Access token refreshed for project ${projectId}`);
    } catch (error) {
      this.logger.error('Token refresh error:', error);
      throw new UnauthorizedException('Failed to refresh YouTube access token. Please reconnect.');
    }
  }

  /**
   * Get authenticated YouTube API client
   */
  private async getAuthenticatedClient(projectId: string) {
    await this.refreshAccessToken(projectId);

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || !project.youtubeAccessToken) {
      throw new UnauthorizedException('YouTube channel not connected');
    }

    this.oauth2Client.setCredentials({
      access_token: project.youtubeAccessToken,
      refresh_token: project.youtubeRefreshToken || undefined,
    });

    return google.youtube({ version: 'v3', auth: this.oauth2Client });
  }

  // ============================================================
  // Video Upload Methods
  // ============================================================

  /**
   * Upload video to YouTube
   */
  async uploadVideo(dto: UploadVideoDto): Promise<UploadProgressDto> {
    // Verify project and content
    const content = await this.prisma.content.findFirst({
      where: {
        id: dto.contentId,
        projectId: dto.projectId,
      },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    if (!content.videoUrl) {
      throw new BadRequestException('Video file not available for upload');
    }

    // Get authenticated YouTube client
    const youtube = await this.getAuthenticatedClient(dto.projectId);

    try {
      // Update content status
      await this.prisma.content.update({
        where: { id: dto.contentId },
        data: { status: 'UPLOADING' },
      });

      // Prepare video metadata
      const videoMetadata: any = {
        snippet: {
          title: dto.title,
          description: dto.description,
          tags: dto.tags || [],
          categoryId: dto.categoryId || '22', // Default: People & Blogs
        },
        status: {
          privacyStatus: dto.privacyStatus,
          selfDeclaredMadeForKids: false,
          notifySubscribers: dto.notifySubscribers !== false,
        },
      };

      // Add scheduled publish time if provided
      if (dto.scheduledAt) {
        const scheduledDate = new Date(dto.scheduledAt);
        if (scheduledDate <= new Date()) {
          throw new BadRequestException('Scheduled time must be in the future');
        }
        videoMetadata.status.publishAt = scheduledDate.toISOString();
        videoMetadata.status.privacyStatus = VideoPrivacyStatus.PRIVATE; // Must be private for scheduling
      }

      // Download video file (in production, stream from S3/GCS)
      // For now, assume videoUrl is a local file path or downloadable URL
      const videoPath = await this.getVideoFilePath(content.videoUrl);

      // Upload video
      const response = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: videoMetadata,
        media: {
          body: fs.createReadStream(videoPath),
        },
      });

      const videoId = response.data.id;
      if (!videoId) {
        throw new InternalServerErrorException('YouTube did not return a video ID');
      }

      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

      // Update content with YouTube video ID
      await this.prisma.content.update({
        where: { id: dto.contentId },
        data: {
          youtubeVideoId: videoId,
          status: 'COMPLETED',
          publishedAt: dto.scheduledAt ? null : new Date(),
          scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        },
      });

      this.logger.log(`Video uploaded: ${videoId} for content ${dto.contentId}`);

      return {
        status: dto.scheduledAt ? 'scheduled' : 'completed',
        videoId,
        videoUrl,
        progress: 100,
      };
    } catch (error: any) {
      this.logger.error('Video upload error:', error);

      // Update content with error
      await this.prisma.content.update({
        where: { id: dto.contentId },
        data: {
          status: 'FAILED',
          error: error.message || 'Upload failed',
        },
      });

      throw new InternalServerErrorException(
        error.message || 'Failed to upload video to YouTube',
      );
    }
  }

  /**
   * Get upload status for a content item
   */
  async getUploadStatus(contentId: string): Promise<UploadProgressDto> {
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    const statusMap: Record<string, string> = {
      UPLOADING: 'uploading',
      VIDEO_RENDERING: 'processing',
      COMPLETED: 'completed',
      SCHEDULED: 'scheduled',
      FAILED: 'failed',
    };

    const status = statusMap[content.status] || 'unknown';

    const response: UploadProgressDto = {
      status,
      error: content.error || undefined,
    };

    if (content.youtubeVideoId) {
      response.videoId = content.youtubeVideoId;
      response.videoUrl = `https://www.youtube.com/watch?v=${content.youtubeVideoId}`;
      response.progress = 100;
    } else if (status === 'uploading') {
      response.progress = 50; // Approximate progress
    }

    return response;
  }

  // ============================================================
  // Helper Methods
  // ============================================================

  /**
   * Get video file path for upload (placeholder implementation)
   * In production, this would download from S3/GCS or stream directly
   */
  private async getVideoFilePath(videoUrl: string): Promise<string> {
    // TODO: Implement actual video file retrieval
    // For now, assume videoUrl is a local file path
    if (fs.existsSync(videoUrl)) {
      return videoUrl;
    }

    // Or download from URL to temp location
    throw new BadRequestException('Video file not accessible');
  }

  /**
   * Delete video from YouTube (optional utility)
   */
  async deleteVideo(projectId: string, videoId: string): Promise<{ success: boolean }> {
    const youtube = await this.getAuthenticatedClient(projectId);

    try {
      await youtube.videos.delete({ id: videoId });
      this.logger.log(`Video deleted: ${videoId}`);
      return { success: true };
    } catch (error: any) {
      this.logger.error('Video deletion error:', error);
      throw new InternalServerErrorException('Failed to delete video from YouTube');
    }
  }
}
