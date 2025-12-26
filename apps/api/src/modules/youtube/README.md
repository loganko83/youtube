# YouTube Integration Module

Production-ready YouTube OAuth and video upload functionality for TubeGenius AI.

## Overview

This module provides:
- **OAuth 2.0 Flow**: Connect YouTube channels to projects with secure token storage
- **Video Upload**: Upload generated videos with metadata, tags, and scheduling
- **Token Management**: Automatic refresh token handling and expiry management
- **Privacy Controls**: Support for public, unlisted, and private videos
- **Scheduling**: Schedule videos for future publication
- **Status Tracking**: Monitor upload progress and video publication status

## Setup

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **YouTube Data API v3**
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: Add your callback URL (e.g., `http://localhost:3000/dashboard/youtube/callback`)
5. Copy the Client ID and Client Secret

### 2. Environment Variables

Add to `.env` or `.env.local`:

```env
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Database (if not already configured)
DATABASE_URL=postgresql://user:password@localhost:5432/tubegenius
```

### 3. Database Migration

Run Prisma migration to add YouTube fields to Project model:

```bash
npm run db:generate
npm run db:push
```

### 4. Install Dependencies

```bash
npm install googleapis
```

## API Endpoints

### OAuth Flow

#### 1. Get Authorization URL

**POST** `/youtube/auth/url`

Request:
```json
{
  "projectId": "123e4567-e89b-12d3-a456-426614174000",
  "redirectUri": "http://localhost:3000/dashboard/youtube/callback"
}
```

Response:
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "state": "random-state-string"
}
```

**Flow:**
1. Frontend calls this endpoint
2. Redirect user to `authUrl`
3. User authorizes on YouTube
4. YouTube redirects to `redirectUri` with `code` and `state`

#### 2. Handle OAuth Callback

**POST** `/youtube/auth/callback`

Request:
```json
{
  "code": "4/0AfJohXl...",
  "projectId": "123e4567-e89b-12d3-a456-426614174000",
  "redirectUri": "http://localhost:3000/dashboard/youtube/callback"
}
```

Response:
```json
{
  "channelId": "UCxxxxxxxxxxxxxxxxxxxxxxx",
  "channelName": "TubeGenius AI",
  "tokenExpiry": "2024-12-31T23:59:59Z",
  "isConnected": true
}
```

#### 3. Get Channel Info

**GET** `/youtube/channel/:projectId`

Response:
```json
{
  "channelId": "UCxxxxxxxxxxxxxxxxxxxxxxx",
  "channelName": "TubeGenius AI",
  "tokenExpiry": "2024-12-31T23:59:59Z",
  "isConnected": true
}
```

Or `null` if no channel connected.

#### 4. Disconnect Channel

**DELETE** `/youtube/auth/disconnect`

Request:
```json
{
  "projectId": "123e4567-e89b-12d3-a456-426614174000"
}
```

Response:
```json
{
  "success": true
}
```

### Video Upload

#### 1. Upload Video

**POST** `/youtube/upload`

Request:
```json
{
  "projectId": "123e4567-e89b-12d3-a456-426614174000",
  "contentId": "456e7890-e89b-12d3-a456-426614174000",
  "title": "5 Stocks to Watch in 2024 | Investment Tips",
  "description": "Discover the top 5 stocks...",
  "tags": ["investing", "stocks", "finance", "2024"],
  "categoryId": "22",
  "privacyStatus": "private",
  "scheduledAt": "2024-12-31T15:00:00Z",
  "notifySubscribers": true
}
```

Response:
```json
{
  "status": "completed",
  "videoId": "dQw4w9WgXcQ",
  "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "progress": 100
}
```

**Field Details:**
- `title`: Max 100 characters
- `description`: Max 5000 characters
- `tags`: Array of strings, max 50 tags
- `categoryId`: YouTube category (22 = People & Blogs, 28 = Science & Tech, etc.)
- `privacyStatus`: `public`, `unlisted`, or `private`
- `scheduledAt`: ISO 8601 datetime (must be future, forces privacy to `private`)
- `notifySubscribers`: Default `true`

#### 2. Get Upload Status

**GET** `/youtube/upload/status/:contentId`

Response:
```json
{
  "status": "completed",
  "videoId": "dQw4w9WgXcQ",
  "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "progress": 100
}
```

Status values:
- `uploading`: Upload in progress
- `processing`: YouTube processing video
- `completed`: Video published
- `scheduled`: Video scheduled for future
- `failed`: Upload failed (see `error` field)

#### 3. Delete Video

**DELETE** `/youtube/video/:projectId/:videoId`

Response:
```json
{
  "success": true
}
```

## Frontend Integration Example

```typescript
import axios from 'axios';

// Step 1: Get OAuth URL
async function connectYouTubeChannel(projectId: string) {
  const response = await axios.post('/youtube/auth/url', {
    projectId,
    redirectUri: `${window.location.origin}/dashboard/youtube/callback`,
  });

  // Redirect user to YouTube authorization
  window.location.href = response.data.authUrl;
}

// Step 2: Handle callback on redirect page
async function handleYouTubeCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const projectId = state?.split(':')[1]; // Extract projectId from state

  if (!code || !projectId) {
    throw new Error('Invalid callback parameters');
  }

  const response = await axios.post('/youtube/auth/callback', {
    code,
    projectId,
    redirectUri: `${window.location.origin}/dashboard/youtube/callback`,
  });

  console.log('Channel connected:', response.data);
  // Redirect back to dashboard
  window.location.href = `/dashboard/projects/${projectId}`;
}

// Step 3: Upload video
async function uploadVideo(contentId: string, projectId: string) {
  const response = await axios.post('/youtube/upload', {
    projectId,
    contentId,
    title: 'My Awesome Video',
    description: 'Check out this amazing content!',
    tags: ['tutorial', 'education'],
    privacyStatus: 'private',
    notifySubscribers: false,
  });

  console.log('Video uploaded:', response.data.videoUrl);
}

// Step 4: Check upload status
async function checkUploadStatus(contentId: string) {
  const response = await axios.get(`/youtube/upload/status/${contentId}`);
  console.log('Upload status:', response.data.status);

  if (response.data.status === 'completed') {
    console.log('Video URL:', response.data.videoUrl);
  }
}
```

## Security Considerations

### Current Implementation
- Tokens stored in plain text in PostgreSQL
- Suitable for development and MVP

### Production Recommendations
1. **Encrypt Tokens**: Use encryption at rest for access/refresh tokens
2. **Use Secrets Manager**: Store in AWS Secrets Manager or Google Secret Manager
3. **Token Rotation**: Implement automatic token rotation
4. **Rate Limiting**: Add rate limiting for OAuth endpoints
5. **CSRF Protection**: Validate state parameter properly (use Redis with TTL)
6. **Audit Logging**: Log all OAuth and upload events

### Example: Token Encryption

```typescript
import * as crypto from 'crypto';

// Encryption (using AES-256-GCM)
function encryptToken(token: string, key: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

// Decryption
function decryptToken(encryptedData: string, key: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(key, 'hex'),
    Buffer.from(ivHex, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

Set `ENCRYPTION_KEY` in environment variables (32-byte hex string).

## Video Category IDs

Common YouTube categories:
- `1` - Film & Animation
- `2` - Autos & Vehicles
- `10` - Music
- `15` - Pets & Animals
- `17` - Sports
- `19` - Travel & Events
- `20` - Gaming
- `22` - People & Blogs (default)
- `23` - Comedy
- `24` - Entertainment
- `25` - News & Politics
- `26` - Howto & Style
- `27` - Education
- `28` - Science & Technology

## Error Handling

### Common Errors

**400 Bad Request**
- Invalid upload parameters
- Video file not available
- Scheduled time in the past

**401 Unauthorized**
- YouTube channel not connected
- Token expired (should auto-refresh, but may fail)
- Invalid refresh token (user needs to reconnect)

**404 Not Found**
- Project not found
- Content not found

**500 Internal Server Error**
- Upload failed
- YouTube API error
- Token refresh failed

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Video file not available for upload",
  "error": "Bad Request"
}
```

## Testing

### Manual Testing with Swagger

1. Start the API server
2. Go to `http://localhost:4000/api` (Swagger UI)
3. Authenticate with JWT token
4. Test endpoints:
   - POST `/youtube/auth/url`
   - POST `/youtube/auth/callback`
   - POST `/youtube/upload`
   - GET `/youtube/upload/status/:contentId`

### Automated Testing (TODO)

```typescript
import { Test } from '@nestjs/testing';
import { YouTubeService } from './youtube.service';

describe('YouTubeService', () => {
  let service: YouTubeService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [YouTubeService, PrismaService, ConfigService],
    }).compile();

    service = module.get<YouTubeService>(YouTubeService);
  });

  it('should generate auth URL', async () => {
    const result = await service.getAuthUrl({
      projectId: 'test-project',
      redirectUri: 'http://localhost:3000/callback',
    });

    expect(result.authUrl).toContain('accounts.google.com');
    expect(result.state).toBeDefined();
  });
});
```

## Limitations & Future Enhancements

### Current Limitations
1. Video file must be accessible locally or via URL
2. No progress tracking during upload (binary upload)
3. No thumbnail upload support
4. No playlist management
5. No analytics integration

### Planned Enhancements
1. **Streaming Upload**: Stream video directly from S3/GCS
2. **Thumbnail Upload**: Custom thumbnail support
3. **Playlist Management**: Auto-add videos to playlists
4. **Analytics Integration**: Fetch view counts, watch time, engagement
5. **Batch Upload**: Upload multiple videos in queue
6. **Webhook Notifications**: Notify when upload completes
7. **Caption Upload**: Automatic caption/subtitle upload
8. **End Screen Editor**: Add end screens and cards

## Architecture

```
┌─────────────────┐
│   Controller    │  ← REST API endpoints
└────────┬────────┘
         │
┌────────▼────────┐
│    Service      │  ← Business logic
├─────────────────┤
│ • OAuth Flow    │
│ • Token Mgmt    │
│ • Video Upload  │
│ • Status Track  │
└────────┬────────┘
         │
    ┌────▼────┐     ┌──────────┐
    │ Prisma  │────▶│ Postgres │
    └─────────┘     └──────────┘
         │
    ┌────▼────────┐
    │ googleapis  │  ← YouTube Data API v3
    └─────────────┘
```

## License

MIT License - TubeGenius AI
