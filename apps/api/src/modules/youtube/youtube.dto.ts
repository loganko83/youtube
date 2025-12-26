import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsISO8601,
  IsArray,
  IsUrl,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';

// ============================================================
// OAuth DTOs
// ============================================================

export class YouTubeAuthUrlDto {
  @ApiProperty({
    description: 'Project ID to connect YouTube channel to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({
    description: 'Redirect URI after OAuth flow',
    example: 'http://localhost:3000/dashboard/youtube/callback',
  })
  @IsUrl()
  @IsNotEmpty()
  redirectUri: string;
}

export class YouTubeCallbackDto {
  @ApiProperty({
    description: 'Authorization code from YouTube OAuth',
    example: '4/0AfJohXl...',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'Project ID to associate the channel with',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({
    description: 'Redirect URI used in initial auth request',
    example: 'http://localhost:3000/dashboard/youtube/callback',
  })
  @IsUrl()
  @IsNotEmpty()
  redirectUri: string;
}

export class YouTubeDisconnectDto {
  @ApiProperty({
    description: 'Project ID to disconnect YouTube channel from',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  projectId: string;
}

// ============================================================
// Upload DTOs
// ============================================================

export enum VideoPrivacyStatus {
  PUBLIC = 'public',
  UNLISTED = 'unlisted',
  PRIVATE = 'private',
}

export class UploadVideoDto {
  @ApiProperty({
    description: 'Project ID containing the content',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({
    description: 'Content ID to upload',
    example: '456e7890-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  contentId: string;

  @ApiProperty({
    description: 'Video title (max 100 chars)',
    example: '5 Stocks to Watch in 2024 | Investment Tips',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiProperty({
    description: 'Video description (max 5000 chars)',
    example: 'Discover the top 5 stocks...',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;

  @ApiPropertyOptional({
    description: 'Video tags (max 500 chars total)',
    example: ['investing', 'stocks', 'finance', '2024'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Video category ID (10 = Music, 22 = People & Blogs, etc.)',
    example: '22',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({
    description: 'Privacy status',
    enum: VideoPrivacyStatus,
    example: VideoPrivacyStatus.PRIVATE,
  })
  @IsEnum(VideoPrivacyStatus)
  privacyStatus: VideoPrivacyStatus;

  @ApiPropertyOptional({
    description: 'Schedule publication time (ISO 8601 format, must be future)',
    example: '2024-12-31T15:00:00Z',
  })
  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;

  @ApiPropertyOptional({
    description: 'Whether to notify subscribers (default: true)',
    example: true,
  })
  @IsOptional()
  notifySubscribers?: boolean;
}

export class UploadStatusDto {
  @ApiProperty({
    description: 'Content ID to check upload status for',
    example: '456e7890-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  contentId: string;
}

// ============================================================
// Response DTOs
// ============================================================

export class YouTubeAuthResponseDto {
  @ApiProperty({
    description: 'OAuth authorization URL',
    example: 'https://accounts.google.com/o/oauth2/v2/auth?...',
  })
  authUrl: string;

  @ApiProperty({
    description: 'State parameter for CSRF protection',
    example: 'random-state-string',
  })
  state: string;
}

export class YouTubeChannelInfoDto {
  @ApiProperty({
    description: 'YouTube channel ID',
    example: 'UCxxxxxxxxxxxxxxxxxxxxxxx',
  })
  channelId: string;

  @ApiProperty({
    description: 'Channel name/title',
    example: 'TubeGenius AI',
  })
  channelName: string;

  @ApiProperty({
    description: 'Token expiry timestamp',
    example: '2024-12-31T23:59:59Z',
  })
  tokenExpiry: Date;

  @ApiProperty({
    description: 'Connection status',
    example: true,
  })
  isConnected: boolean;
}

export class UploadProgressDto {
  @ApiProperty({
    description: 'Upload status',
    enum: ['uploading', 'processing', 'completed', 'failed'],
    example: 'processing',
  })
  status: string;

  @ApiProperty({
    description: 'YouTube video ID (once available)',
    example: 'dQw4w9WgXcQ',
  })
  videoId?: string;

  @ApiProperty({
    description: 'Full YouTube video URL',
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  })
  videoUrl?: string;

  @ApiProperty({
    description: 'Upload progress percentage (0-100)',
    example: 75,
  })
  progress?: number;

  @ApiProperty({
    description: 'Error message if upload failed',
    example: null,
  })
  error?: string;
}
