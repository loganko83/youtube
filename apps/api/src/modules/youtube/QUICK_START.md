# YouTube Integration - Quick Start Guide

Get up and running with YouTube OAuth and video uploads in 5 minutes.

## Prerequisites

- Google Cloud account
- Running TubeGenius AI project
- Node.js 18+

## 1. Google Cloud Setup (2 minutes)

```bash
# 1. Go to: https://console.cloud.google.com/
# 2. Enable YouTube Data API v3
# 3. Create OAuth 2.0 credentials:
#    - Type: Web application
#    - Redirect URI: http://localhost:3000/dashboard/youtube/callback
# 4. Copy Client ID and Secret
```

## 2. Install & Configure (1 minute)

```bash
# Install dependencies
cd apps/api
npm install googleapis

# Add to .env.local
cat >> .env.local << EOF
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
EOF

# Migrate database
npm run db:generate
npm run db:push
```

## 3. Start Server (30 seconds)

```bash
npm run dev

# You should see:
# [Nest] INFO [YouTubeService] YouTube OAuth configured
```

## 4. Test with cURL (1 minute)

```bash
# Get your JWT token first
TOKEN="your-jwt-token"

# 1. Generate OAuth URL
curl -X POST http://localhost:3001/youtube/auth/url \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "your-project-id",
    "redirectUri": "http://localhost:3000/dashboard/youtube/callback"
  }'

# 2. Visit the authUrl, authorize, and get the code

# 3. Exchange code for tokens
curl -X POST http://localhost:3001/youtube/auth/callback \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "authorization-code-from-youtube",
    "projectId": "your-project-id",
    "redirectUri": "http://localhost:3000/dashboard/youtube/callback"
  }'

# 4. Upload video
curl -X POST http://localhost:3001/youtube/upload \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "your-project-id",
    "contentId": "your-content-id",
    "title": "My First Upload",
    "description": "Testing YouTube upload",
    "privacyStatus": "private"
  }'
```

## API Endpoints Cheat Sheet

```typescript
// OAuth
POST   /youtube/auth/url              // Get OAuth URL
POST   /youtube/auth/callback         // Exchange code for tokens
DELETE /youtube/auth/disconnect       // Remove connection
GET    /youtube/channel/:projectId    // Get channel info

// Upload
POST   /youtube/upload                // Upload video
GET    /youtube/upload/status/:id     // Check upload status
DELETE /youtube/video/:projectId/:id  // Delete video
```

## Common Tasks

### Connect YouTube Channel
```typescript
const { authUrl } = await fetch('/youtube/auth/url', {
  method: 'POST',
  body: JSON.stringify({ projectId, redirectUri }),
});
window.location.href = authUrl;
```

### Upload Private Video
```typescript
await fetch('/youtube/upload', {
  method: 'POST',
  body: JSON.stringify({
    projectId,
    contentId,
    title: 'My Video',
    description: 'Video description',
    privacyStatus: 'private',
  }),
});
```

### Schedule Video
```typescript
await fetch('/youtube/upload', {
  method: 'POST',
  body: JSON.stringify({
    projectId,
    contentId,
    title: 'Scheduled Video',
    description: 'Publishes tomorrow',
    scheduledAt: '2024-12-31T15:00:00Z', // Future date
    privacyStatus: 'private', // Required for scheduling
  }),
});
```

## Troubleshooting

**"YouTube OAuth not configured"**
→ Check `.env` has `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

**"Invalid redirect URI"**
→ Add redirect URI to Google Cloud Console OAuth settings

**"Failed to refresh token"**
→ Reconnect channel (disconnect → connect)

**"Video upload failed"**
→ Check video file exists and is accessible

## Next Steps

- Read [MIGRATION.md](./MIGRATION.md) for detailed setup
- Read [README.md](./README.md) for full API reference
- Read [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for architecture

## Need Help?

Check the logs:
```bash
# API server logs
tail -f logs/app.log

# Or run in debug mode
DEBUG=* npm run dev
```

## YouTube Category IDs

| ID | Category |
|----|----------|
| 22 | People & Blogs (default) |
| 28 | Science & Technology |
| 27 | Education |
| 24 | Entertainment |
| 25 | News & Politics |
| 10 | Music |

Full list: https://developers.google.com/youtube/v3/docs/videoCategories/list
