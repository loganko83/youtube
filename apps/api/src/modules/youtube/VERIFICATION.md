# YouTube Integration - Verification Checklist

Use this checklist to verify your YouTube integration is correctly installed and configured.

## ✅ Installation Verification

### 1. Files Created

Run this command to verify all files exist:

```bash
cd apps/api/src/modules/youtube
ls -la

# Expected output:
# youtube.module.ts
# youtube.service.ts
# youtube.controller.ts
# youtube.dto.ts
# README.md
# MIGRATION.md
# IMPLEMENTATION_SUMMARY.md
# QUICK_START.md
# VERIFICATION.md (this file)
```

### 2. Dependencies Installed

```bash
cd apps/api
npm list googleapis

# Expected output:
# └── googleapis@144.0.0
```

If not installed:
```bash
npm install googleapis
```

### 3. Module Imported

Check `apps/api/src/app.module.ts`:

```bash
grep -n "YouTubeModule" apps/api/src/app.module.ts

# Expected output:
# 7:import { YouTubeModule } from './modules/youtube/youtube.module';
# 22:    YouTubeModule,
```

### 4. Database Schema Updated

Check `apps/api/prisma/schema.prisma`:

```bash
grep -A 5 "YouTube OAuth" apps/api/prisma/schema.prisma

# Expected output:
# // YouTube OAuth credentials
# youtubeChannelId    String?  @map("youtube_channel_id")
# youtubeAccessToken  String?  @map("youtube_access_token")
# youtubeRefreshToken String?  @map("youtube_refresh_token")
# youtubeTokenExpiry  DateTime? @map("youtube_token_expiry")
# youtubeChannelName  String?  @map("youtube_channel_name")
```

## ✅ Configuration Verification

### 5. Environment Variables

Check `.env.local` or `.env`:

```bash
cd apps/api
cat .env.local | grep GOOGLE

# Expected output:
# GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
# GOOGLE_CLIENT_SECRET=your-client-secret
```

If not set, add them:
```bash
echo 'GOOGLE_CLIENT_ID=your-client-id' >> .env.local
echo 'GOOGLE_CLIENT_SECRET=your-client-secret' >> .env.local
```

### 6. Database Migration

```bash
cd apps/api
npm run db:generate
npm run db:push

# Expected output:
# ✔ Generated Prisma Client
# ✔ Database schema synchronized
```

## ✅ Runtime Verification

### 7. Server Startup

```bash
cd apps/api
npm run dev

# Check logs for:
# [Nest] INFO [YouTubeService] YouTube OAuth configured successfully
# OR
# [Nest] WARN [YouTubeService] YouTube OAuth credentials not configured
```

If you see the warning:
1. Check environment variables are set
2. Restart the server

### 8. Swagger Documentation

1. Start the server: `npm run dev`
2. Open browser: `http://localhost:3001/api`
3. Look for **YouTube Integration** tag
4. Verify 7 endpoints exist:
   - POST `/youtube/auth/url`
   - POST `/youtube/auth/callback`
   - DELETE `/youtube/auth/disconnect`
   - GET `/youtube/channel/:projectId`
   - POST `/youtube/upload`
   - GET `/youtube/upload/status/:contentId`
   - DELETE `/youtube/video/:projectId/:videoId`

### 9. API Health Check

```bash
# Test if API is responsive
curl http://localhost:3001/health

# Expected: 200 OK
```

## ✅ Functional Testing

### 10. Generate OAuth URL (Requires JWT Token)

```bash
# Get JWT token first by logging in
TOKEN="your-jwt-token-here"

# Test OAuth URL generation
curl -X POST http://localhost:3001/youtube/auth/url \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "test-project-id",
    "redirectUri": "http://localhost:3000/callback"
  }'

# Expected response:
# {
#   "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
#   "state": "random-state-string"
# }
```

### 11. Test Error Handling

```bash
# Test with invalid project ID
curl -X POST http://localhost:3001/youtube/auth/url \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "invalid-id",
    "redirectUri": "http://localhost:3000/callback"
  }'

# Expected: 404 Not Found with error message
```

### 12. TypeScript Compilation

```bash
cd apps/api
npm run build

# Expected: No TypeScript errors
# Check output:
# ls -la dist/modules/youtube/

# Should contain:
# youtube.module.js
# youtube.service.js
# youtube.controller.js
# youtube.dto.js
```

## ✅ Google Cloud Verification

### 13. OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Verify OAuth 2.0 Client exists
4. Check redirect URIs include:
   - Development: `http://localhost:3000/dashboard/youtube/callback`
   - Production: `https://yourdomain.com/dashboard/youtube/callback`

### 14. YouTube Data API v3

1. Go to **APIs & Services** → **Library**
2. Search for "YouTube Data API v3"
3. Verify status: **Enabled**

If not enabled:
- Click **Enable**
- Wait 30 seconds for propagation

### 15. OAuth Consent Screen

1. Go to **OAuth consent screen**
2. Verify scopes include:
   - `https://www.googleapis.com/auth/youtube.upload`
   - `https://www.googleapis.com/auth/youtube.readonly`
   - `https://www.googleapis.com/auth/youtube.force-ssl`

## ✅ Security Verification

### 16. JWT Guard Protection

```bash
# Test without authentication
curl -X POST http://localhost:3001/youtube/auth/url \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "test-project-id",
    "redirectUri": "http://localhost:3000/callback"
  }'

# Expected: 401 Unauthorized
```

### 17. Input Validation

```bash
# Test with invalid redirect URI
curl -X POST http://localhost:3001/youtube/auth/url \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "test-project-id",
    "redirectUri": "not-a-valid-url"
  }'

# Expected: 400 Bad Request with validation error
```

## ✅ Database Verification

### 18. Schema Applied

```bash
# Connect to database
psql -d tubegenius

# Check columns exist
\d projects

# Should show:
# youtube_channel_id    | character varying |
# youtube_access_token  | character varying |
# youtube_refresh_token | character varying |
# youtube_token_expiry  | timestamp         |
# youtube_channel_name  | character varying |
```

### 19. Test Data Creation

```sql
-- In psql:
SELECT id, youtube_channel_id, youtube_channel_name
FROM projects
WHERE youtube_channel_id IS NOT NULL;

-- Should work without errors (may return 0 rows if no channels connected yet)
```

## ✅ Production Readiness

### 20. Environment Variables in Production

- [ ] `GOOGLE_CLIENT_ID` set with production credentials
- [ ] `GOOGLE_CLIENT_SECRET` set with production credentials
- [ ] `DATABASE_URL` points to production database
- [ ] `JWT_SECRET` is strong and unique
- [ ] Optional: `ENCRYPTION_KEY` set for token encryption

### 21. HTTPS Configuration

- [ ] Production redirect URI uses HTTPS
- [ ] OAuth credentials updated with production URI
- [ ] SSL certificate valid

### 22. Monitoring Setup

- [ ] Logging configured (Winston/Pino)
- [ ] Error tracking (Sentry/Bugsnag)
- [ ] Performance monitoring (New Relic/DataDog)
- [ ] YouTube API quota alerts configured

## 📊 Verification Summary

| Check | Status | Notes |
|-------|--------|-------|
| Files created | ⬜ | 9 files expected |
| Dependencies installed | ⬜ | googleapis@144.0.0 |
| Module imported | ⬜ | In app.module.ts |
| Database migrated | ⬜ | 5 new columns |
| Environment variables | ⬜ | CLIENT_ID + SECRET |
| Server starts | ⬜ | No errors |
| Swagger docs | ⬜ | 7 endpoints |
| OAuth flow | ⬜ | URL generation works |
| TypeScript builds | ⬜ | No compilation errors |
| Google Cloud | ⬜ | API enabled + OAuth configured |

## 🚨 Common Issues

### Issue: "YouTube OAuth not configured"

**Checklist:**
- [ ] `GOOGLE_CLIENT_ID` in `.env.local`
- [ ] `GOOGLE_CLIENT_SECRET` in `.env.local`
- [ ] Server restarted after adding variables
- [ ] Variables have no quotes or extra spaces

### Issue: Module import errors

**Checklist:**
- [ ] `YouTubeModule` imported in `app.module.ts`
- [ ] No circular dependencies
- [ ] Run `npm run build` to check for TypeScript errors

### Issue: Database errors

**Checklist:**
- [ ] Prisma client regenerated: `npm run db:generate`
- [ ] Database schema updated: `npm run db:push`
- [ ] PostgreSQL server running
- [ ] `DATABASE_URL` correct in `.env`

### Issue: 401 Unauthorized

**Checklist:**
- [ ] JWT token included in Authorization header
- [ ] Token format: `Bearer <token>`
- [ ] Token not expired
- [ ] User exists in database

## ✅ Final Check

Run this comprehensive test script:

```bash
#!/bin/bash

echo "🔍 Verifying YouTube Integration..."

# 1. Check files
echo "✓ Checking files..."
test -f apps/api/src/modules/youtube/youtube.module.ts || echo "❌ Missing youtube.module.ts"
test -f apps/api/src/modules/youtube/youtube.service.ts || echo "❌ Missing youtube.service.ts"
test -f apps/api/src/modules/youtube/youtube.controller.ts || echo "❌ Missing youtube.controller.ts"
test -f apps/api/src/modules/youtube/youtube.dto.ts || echo "❌ Missing youtube.dto.ts"

# 2. Check dependencies
echo "✓ Checking dependencies..."
cd apps/api
npm list googleapis > /dev/null 2>&1 || echo "❌ googleapis not installed"

# 3. Check environment
echo "✓ Checking environment..."
grep -q "GOOGLE_CLIENT_ID" .env.local || echo "⚠️  GOOGLE_CLIENT_ID not set"
grep -q "GOOGLE_CLIENT_SECRET" .env.local || echo "⚠️  GOOGLE_CLIENT_SECRET not set"

# 4. Check database
echo "✓ Checking database..."
npm run db:generate > /dev/null 2>&1 || echo "❌ Failed to generate Prisma client"

# 5. Build check
echo "✓ Checking TypeScript compilation..."
npm run build > /dev/null 2>&1 || echo "❌ TypeScript compilation failed"

echo ""
echo "✅ Verification complete!"
echo "If you see any ❌ or ⚠️  above, refer to the troubleshooting section."
```

Save as `verify.sh`, make executable (`chmod +x verify.sh`), and run: `./verify.sh`

## 🎉 Success Criteria

Your implementation is ready when:

1. ✅ All files exist
2. ✅ Dependencies installed
3. ✅ Server starts without errors
4. ✅ Swagger shows 7 endpoints
5. ✅ OAuth URL generation works
6. ✅ TypeScript compiles successfully
7. ✅ Google Cloud configured
8. ✅ Database schema updated

## Next Steps

1. **Test OAuth Flow**
   - Follow [QUICK_START.md](./QUICK_START.md)
   - Connect a real YouTube channel

2. **Test Video Upload**
   - Create a content item with video
   - Upload to YouTube
   - Verify in YouTube Studio

3. **Deploy to Production**
   - Follow [MIGRATION.md](./MIGRATION.md) deployment section
   - Update OAuth redirect URIs
   - Configure production environment variables

4. **Monitor & Optimize**
   - Set up logging
   - Configure alerts
   - Monitor YouTube API quota usage

## Support

For issues:
1. Check logs: `tail -f logs/app.log`
2. Review [README.md](./README.md) for API details
3. See [MIGRATION.md](./MIGRATION.md) for setup help
4. Check [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for architecture
