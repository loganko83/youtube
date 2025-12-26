# YouTube Integration - Migration Guide

Step-by-step guide to integrate YouTube OAuth and upload functionality into your TubeGenius AI project.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- Google Cloud Console account
- Existing TubeGenius AI project

## Step 1: Google Cloud Setup

### 1.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Enter project name: `TubeGenius AI`
4. Click **Create**

### 1.2 Enable YouTube Data API v3

1. In the Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "YouTube Data API v3"
3. Click **Enable**

### 1.3 Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - User Type: **External** (for testing) or **Internal** (if using Google Workspace)
   - App name: `TubeGenius AI`
   - User support email: Your email
   - Developer contact: Your email
   - Click **Save and Continue**
   - Scopes: Skip for now (will be requested during OAuth flow)
   - Test users: Add your Google account email
   - Click **Save and Continue**

4. Create OAuth client ID:
   - Application type: **Web application**
   - Name: `TubeGenius AI Web Client`
   - Authorized JavaScript origins:
     - `http://localhost:3000` (development)
     - `https://yourdomain.com` (production)
   - Authorized redirect URIs:
     - `http://localhost:3000/dashboard/youtube/callback` (development)
     - `https://yourdomain.com/dashboard/youtube/callback` (production)
   - Click **Create**

5. Copy the **Client ID** and **Client Secret** - you'll need these for `.env`

### 1.4 OAuth Consent Screen - Add Scopes

1. Go to **OAuth consent screen**
2. Click **Edit App**
3. In **Scopes**, click **Add or Remove Scopes**
4. Add these scopes:
   - `https://www.googleapis.com/auth/youtube.upload`
   - `https://www.googleapis.com/auth/youtube.readonly`
   - `https://www.googleapis.com/auth/youtube.force-ssl`
5. Click **Update** → **Save and Continue**

## Step 2: Install Dependencies

```bash
cd apps/api
npm install googleapis
```

## Step 3: Database Migration

### 3.1 Update Prisma Schema

The Prisma schema has already been updated in `apps/api/prisma/schema.prisma`. Review the changes:

```prisma
model Project {
  // ... existing fields ...

  // YouTube OAuth credentials
  youtubeChannelId    String?  @map("youtube_channel_id")
  youtubeAccessToken  String?  @map("youtube_access_token")
  youtubeRefreshToken String?  @map("youtube_refresh_token")
  youtubeTokenExpiry  DateTime? @map("youtube_token_expiry")
  youtubeChannelName  String?  @map("youtube_channel_name")

  // ... rest of model ...
}
```

### 3.2 Generate Prisma Client and Push to Database

```bash
cd apps/api
npm run db:generate
npm run db:push
```

**Note:** This will modify your database schema. In production, use proper migrations:

```bash
npx prisma migrate dev --name add-youtube-oauth
```

## Step 4: Environment Variables

### 4.1 Update `.env.local` or `.env`

Add the following to `apps/api/.env.local`:

```env
# Google OAuth (YouTube Integration)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

Replace `your-client-id` and `your-client-secret` with values from Step 1.3.

### 4.2 Optional: Token Encryption

For production, generate an encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add to `.env`:

```env
ENCRYPTION_KEY=your-generated-32-byte-hex-key
```

Then update `youtube.service.ts` to use encryption (see README.md).

## Step 5: Verify Installation

### 5.1 Start the API Server

```bash
cd apps/api
npm run dev
```

You should see:

```
[Nest] INFO [YouTubeService] YouTube OAuth credentials configured successfully
[Nest] INFO [NestApplication] Nest application successfully started
```

If you see a warning about missing credentials, check your `.env` file.

### 5.2 Check Swagger Documentation

1. Open `http://localhost:3001/api` (or your configured PORT)
2. Look for the **YouTube Integration** tag
3. You should see 6 endpoints:
   - POST `/youtube/auth/url`
   - POST `/youtube/auth/callback`
   - DELETE `/youtube/auth/disconnect`
   - GET `/youtube/channel/:projectId`
   - POST `/youtube/upload`
   - GET `/youtube/upload/status/:contentId`
   - DELETE `/youtube/video/:projectId/:videoId`

## Step 6: Frontend Integration

### 6.1 Create YouTube Settings Page (React/Next.js)

```typescript
// apps/web/src/pages/dashboard/projects/[id]/youtube.tsx

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function YouTubeSettings() {
  const router = useRouter();
  const { id: projectId } = router.query;
  const [channelInfo, setChannelInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadChannelInfo();
    }
  }, [projectId]);

  async function loadChannelInfo() {
    try {
      const response = await axios.get(`/api/youtube/channel/${projectId}`);
      setChannelInfo(response.data);
    } catch (error) {
      console.error('Failed to load channel info', error);
    }
  }

  async function connectYouTube() {
    setLoading(true);
    try {
      const response = await axios.post('/api/youtube/auth/url', {
        projectId,
        redirectUri: `${window.location.origin}/dashboard/youtube/callback`,
      });

      // Redirect to YouTube OAuth
      window.location.href = response.data.authUrl;
    } catch (error) {
      console.error('Failed to generate auth URL', error);
      setLoading(false);
    }
  }

  async function disconnectYouTube() {
    if (!confirm('Are you sure you want to disconnect YouTube?')) return;

    try {
      await axios.delete('/api/youtube/auth/disconnect', {
        data: { projectId },
      });
      setChannelInfo(null);
    } catch (error) {
      console.error('Failed to disconnect', error);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">YouTube Integration</h1>

      {channelInfo ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-green-600">Connected</h2>
              <p className="text-gray-600 mt-1">Channel: {channelInfo.channelName}</p>
              <p className="text-sm text-gray-500 mt-1">
                Channel ID: {channelInfo.channelId}
              </p>
              <p className="text-sm text-gray-500">
                Token expires: {new Date(channelInfo.tokenExpiry).toLocaleString()}
              </p>
            </div>
            <button
              onClick={disconnectYouTube}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Not Connected</h2>
          <p className="text-gray-600 mb-4">
            Connect your YouTube channel to automatically upload generated videos.
          </p>
          <button
            onClick={connectYouTube}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Connecting...' : 'Connect YouTube Channel'}
          </button>
        </div>
      )}
    </div>
  );
}
```

### 6.2 Create OAuth Callback Page

```typescript
// apps/web/src/pages/dashboard/youtube/callback.tsx

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function YouTubeCallback() {
  const router = useRouter();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (error) {
      setStatus('error');
      return;
    }

    if (!code || !state) {
      setStatus('error');
      return;
    }

    handleCallback(code, state);
  }, []);

  async function handleCallback(code: string, state: string) {
    try {
      // Extract projectId from state
      const projectId = state.split(':')[1];

      const response = await axios.post('/api/youtube/auth/callback', {
        code,
        projectId,
        redirectUri: `${window.location.origin}/dashboard/youtube/callback`,
      });

      setStatus('success');

      // Redirect back to project settings
      setTimeout(() => {
        router.push(`/dashboard/projects/${projectId}/youtube`);
      }, 2000);
    } catch (error) {
      console.error('OAuth callback error', error);
      setStatus('error');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto" />
            <p className="mt-4 text-gray-600">Connecting YouTube channel...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-green-600 text-5xl mb-4">✓</div>
            <p className="text-xl font-semibold text-gray-800">Successfully Connected!</p>
            <p className="text-gray-600 mt-2">Redirecting...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-red-600 text-5xl mb-4">✗</div>
            <p className="text-xl font-semibold text-gray-800">Connection Failed</p>
            <p className="text-gray-600 mt-2">Please try again.</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded"
            >
              Go Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

## Step 7: Testing the Integration

### 7.1 Manual Testing

1. **Start the servers:**
   ```bash
   # Terminal 1: API
   cd apps/api && npm run dev

   # Terminal 2: Web
   cd apps/web && npm run dev
   ```

2. **Test OAuth flow:**
   - Navigate to `http://localhost:3000/dashboard/projects/[your-project-id]/youtube`
   - Click "Connect YouTube Channel"
   - Authorize on YouTube
   - Verify successful connection

3. **Test video upload:**
   - Create a content item with a video file
   - Use the upload endpoint:
     ```bash
     curl -X POST http://localhost:3001/youtube/upload \
       -H "Authorization: Bearer YOUR_JWT_TOKEN" \
       -H "Content-Type: application/json" \
       -d '{
         "projectId": "your-project-id",
         "contentId": "your-content-id",
         "title": "Test Video",
         "description": "Testing YouTube upload",
         "privacyStatus": "private"
       }'
     ```

### 7.2 Verify Upload in YouTube Studio

1. Go to [YouTube Studio](https://studio.youtube.com/)
2. Check the **Content** tab
3. You should see your uploaded video (in private/unlisted/public based on your settings)

## Step 8: Production Deployment

### 8.1 Update OAuth Redirect URIs

1. Go to Google Cloud Console → **Credentials**
2. Edit your OAuth client
3. Add production redirect URI:
   - `https://yourdomain.com/dashboard/youtube/callback`

### 8.2 Security Hardening

1. **Enable token encryption:**
   - Uncomment encryption code in `youtube.service.ts`
   - Set `ENCRYPTION_KEY` in production environment

2. **Use environment-specific variables:**
   ```env
   # Production .env
   GOOGLE_CLIENT_ID=prod-client-id
   GOOGLE_CLIENT_SECRET=prod-client-secret
   ENCRYPTION_KEY=your-production-encryption-key
   ```

3. **Enable HTTPS only:**
   - Ensure all redirect URIs use HTTPS
   - Update CORS settings for production domain

### 8.3 Rate Limiting

YouTube API has quotas:
- **Default quota:** 10,000 units/day
- **Upload video:** 1,600 units per upload

Monitor usage in [Google Cloud Console → APIs & Services → Dashboard](https://console.cloud.google.com/apis/dashboard)

To request quota increase:
1. Go to **YouTube Data API v3** → **Quotas**
2. Click **Request Quota Increase**

## Troubleshooting

### Issue: "YouTube OAuth not configured" error

**Solution:**
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env`
- Restart the API server after adding environment variables

### Issue: "Failed to obtain refresh token"

**Solution:**
- In OAuth consent screen, ensure `access_type: 'offline'` is set
- Add `prompt: 'consent'` to force consent screen
- These are already configured in the implementation

### Issue: "Invalid redirect URI" error

**Solution:**
- Ensure the redirect URI in Google Cloud Console exactly matches the one used in the request
- Check for trailing slashes (e.g., `/callback` vs `/callback/`)

### Issue: "Token expired" error

**Solution:**
- The service should auto-refresh tokens
- If refresh fails, user needs to reconnect (click disconnect, then connect again)
- Check `youtubeTokenExpiry` in database

### Issue: "Video upload failed" error

**Possible causes:**
1. Video file not accessible
2. Invalid video format (YouTube accepts: .MOV, .MPEG4, .MP4, .AVI, .WMV, .MPEGPS, .FLV, .3GPP, .WebM)
3. File size exceeds limits (max 256GB or 12 hours)
4. Quota exceeded

**Solution:**
- Check server logs for detailed error
- Verify video file exists and is readable
- Check YouTube quota usage

## Next Steps

1. **Implement thumbnail upload** - Upload custom thumbnails for videos
2. **Add playlist management** - Auto-add videos to playlists
3. **Integrate analytics** - Fetch view counts and engagement metrics
4. **Add caption upload** - Auto-generate and upload captions
5. **Implement batch upload** - Queue multiple videos for upload

## Support

For issues or questions:
- Check the [YouTube Data API documentation](https://developers.google.com/youtube/v3)
- Review the [googleapis npm package](https://github.com/googleapis/google-api-nodejs-client)
- See `apps/api/src/modules/youtube/README.md` for API details
