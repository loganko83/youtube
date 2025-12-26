# TubeGenius AI - n8n Workflow Templates

This directory contains importable n8n workflow JSON files for automating the TubeGenius AI content pipeline.

## Workflows Overview

### 1. Content Generation Pipeline (`content-generation-pipeline.json`)

**Purpose**: Main workflow for automated video content creation from start to finish.

**Trigger**: Webhook from API when a content generation job is created

**Flow**:
1. **Webhook Trigger** - Receives job request with config (niche, topic, tone, format, language)
2. **Gemini Script Generation** - Calls Gemini API to generate structured video script
3. **Safety Filter** - Validates content against safety guidelines and critical claims confidence
4. **ElevenLabs TTS** - Converts voiceover text to audio using multilingual v2 model
5. **Creatomate Video Render** - Combines TTS audio with scene images into final video
6. **YouTube Upload** (conditional) - Publishes video if `autoPublish` is enabled
7. **Status Updates** - Sends progress webhooks back to API at each stage

**Error Handling**:
- Each critical step has error detection and reporting
- Failed jobs trigger status update webhooks with error details
- Supports graceful degradation (e.g., render without publish)

**Configuration Required**:
- `GEMINI_API_KEY` - Google AI Studio API key
- `ELEVENLABS_API_KEY` - ElevenLabs API key
- `CREATOMATE_API_KEY` - Creatomate API key
- `YOUTUBE_OAUTH2` - YouTube API OAuth2 credentials
- Template IDs for `shorts_template_id` and `long_form_template_id`

---

### 2. Scheduled Publishing (`scheduled-publish.json`)

**Purpose**: Automatically publish scheduled content to YouTube at designated times.

**Trigger**: Cron schedule (runs every hour)

**Flow**:
1. **Schedule Trigger** - Runs hourly to check for pending scheduled content
2. **Fetch Scheduled Content** - Queries API for videos with `scheduledPublishAt <= now()`
3. **Split Content** - Processes each video individually
4. **Download Video** - Fetches rendered video file from storage URL
5. **YouTube Upload** - Publishes to YouTube with scheduled metadata
6. **Status Updates** - Updates content status to `published` with YouTube video ID
7. **Batch Summary** - Generates summary report of all publish operations

**Error Handling**:
- Download failures tracked with detailed error logs
- Upload failures trigger retry notifications
- Per-video error tracking with aggregated reporting

**Configuration Required**:
- `API_BASE_URL` - Base URL for TubeGenius API
- `YOUTUBE_OAUTH2` - YouTube API OAuth2 credentials
- HTTP Header Auth credentials for API authentication

---

### 3. Analytics Sync (`analytics-sync.json`)

**Purpose**: Daily synchronization of YouTube analytics data for published videos.

**Trigger**: Cron schedule (daily at 2 AM)

**Flow**:
1. **Schedule Trigger** - Runs daily at 2 AM server time
2. **Fetch Published Videos** - Retrieves all videos with YouTube IDs
3. **Split Videos** - Processes each video individually
4. **YouTube Video Details** - Fetches current statistics (views, likes, comments)
5. **YouTube Analytics API** - Retrieves last 30 days of detailed metrics
6. **Combine Data** - Merges statistics with analytics breakdown
7. **Update API** - Sends analytics data back to TubeGenius database
8. **Batch Summary** - Generates aggregate metrics report

**Metrics Collected**:
- **Current Totals**: Views, likes, comments (from Video API)
- **Last 30 Days**: Daily breakdown of views, watch time, engagement
- **Engagement Rate**: Calculated engagement percentage
- **Status**: Privacy status, duration, publish date

**Error Handling**:
- Handles deleted/private videos gracefully
- API failures tracked per-video with error webhooks
- Summary includes success/failure counts

**Configuration Required**:
- `API_BASE_URL` - Base URL for TubeGenius API
- `YOUTUBE_OAUTH2` - YouTube API OAuth2 credentials with Analytics scope
- HTTP Header Auth credentials for API authentication

---

## Installation Instructions

### 1. Import Workflows into n8n

1. Access your n8n instance (self-hosted or cloud)
2. Navigate to **Workflows** → **Import from File**
3. Upload each JSON file:
   - `content-generation-pipeline.json`
   - `scheduled-publish.json`
   - `analytics-sync.json`
4. Review imported nodes and connections

### 2. Configure Credentials

#### Google Gemini API
- Node: HTTP Request (custom)
- Add `GEMINI_API_KEY` to Headers or use predefined credential type
- Get key from: https://ai.google.dev/gemini-api/docs/api-key

#### ElevenLabs API
- Node: HTTP Request (custom)
- Add `ELEVENLABS_API_KEY` to Headers
- Get key from: https://elevenlabs.io/app/settings/api-keys

#### Creatomate API
- Node: HTTP Request (custom)
- Add `CREATOMATE_API_KEY` to Headers
- Get key from: https://creatomate.com/docs/api/rest-api/authentication

#### YouTube OAuth2 API
- Node: YouTube (native n8n node)
- Create OAuth2 app in Google Cloud Console
- Scopes required:
  - `https://www.googleapis.com/auth/youtube.upload`
  - `https://www.googleapis.com/auth/youtube.readonly`
  - `https://www.googleapis.com/auth/yt-analytics.readonly`
- Guide: https://docs.n8n.io/integrations/builtin/credentials/google/oauth-generic/

#### API Base URL
- Set environment variable: `API_BASE_URL=https://your-api-domain.com`
- Or manually update in each HTTP Request node

### 3. Configure Template IDs

In `content-generation-pipeline.json`, update:
```javascript
"template_id": "={{ JSON.parse($('Extract Job Data').item.json.config).format === 'shorts' ? 'YOUR_SHORTS_TEMPLATE_ID' : 'YOUR_LONG_FORM_TEMPLATE_ID' }}"
```

Replace `YOUR_SHORTS_TEMPLATE_ID` and `YOUR_LONG_FORM_TEMPLATE_ID` with actual Creatomate template IDs.

### 4. Test Workflows

#### Test Content Generation Pipeline
```bash
curl -X POST https://your-n8n-instance.com/webhook/content-job \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "test-job-123",
    "projectId": "project-456",
    "userId": "user-789",
    "config": {
      "niche": "finance",
      "topic": "Best savings accounts 2024",
      "tone": "informative",
      "format": "shorts",
      "language": "en",
      "autoPublish": false,
      "voiceId": "default_voice_id"
    },
    "callbackUrl": "https://your-api.com/api/webhooks/job-status"
  }'
```

#### Test Scheduled Publishing
- Add test content to database with `scheduledPublishAt` in the past
- Manually trigger workflow or wait for next hourly run

#### Test Analytics Sync
- Ensure published videos exist in database with `youtubeVideoId`
- Manually trigger workflow or wait for next daily run at 2 AM

---

## Workflow Architecture

### Data Flow

```
API Request → n8n Webhook → Content Generation
                              ↓
                         Gemini Script
                              ↓
                         Safety Filter
                              ↓
                         ElevenLabs TTS
                              ↓
                         Creatomate Render
                              ↓
                         YouTube Upload (optional)
                              ↓
                         API Status Update
```

### Error Propagation

All workflows use `onError: "continueErrorOutput"` for critical nodes, allowing:
- Error detection via IF nodes checking for `error` field
- Graceful fallback paths for non-critical failures
- Comprehensive error logging back to API

### Status Updates

Each workflow sends progress updates via webhooks:
- **start**: Job initiated, initial validation passed
- **processing**: Active stage with progress percentage
- **completed**: Successful completion with result data
- **failed**: Error occurred with detailed error information

---

## Queue Mode Configuration (Optional)

For high-volume production environments, run n8n in queue mode:

```yaml
# docker-compose.yml
services:
  n8n:
    environment:
      - EXECUTIONS_MODE=queue
      - QUEUE_BULL_REDIS_HOST=redis
      - QUEUE_BULL_REDIS_PORT=6379

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
```

Benefits:
- Parallel execution of multiple jobs
- Automatic retry on failure
- Better resource utilization
- Improved reliability

---

## Monitoring and Debugging

### Enable Workflow Logging
1. Navigate to **Settings** → **Workflow**
2. Enable **Save Manual Executions**
3. Enable **Save Error Executions**
4. Set **Log Level** to `debug` for troubleshooting

### View Execution History
1. Open workflow
2. Click **Executions** tab
3. Review logs for each execution
4. Inspect node outputs and errors

### Common Issues

**Gemini API Timeout**
- Increase timeout in HTTP Request node options to 60000ms (60 seconds)
- Check API quota limits in Google AI Studio

**YouTube Upload Fails**
- Verify OAuth2 scopes include `youtube.upload`
- Check video file format (MP4 recommended)
- Ensure video meets YouTube requirements (duration, size, codec)

**Analytics API Returns Empty**
- Requires at least 24-48 hours of data after video publish
- Verify OAuth2 scopes include `yt-analytics.readonly`
- Check date range parameters (max 180 days)

---

## API Webhook Endpoints

Your backend API must implement these webhook endpoints:

### Content Generation Status Updates
```
POST /api/webhooks/job-status
Body: {
  jobId: string,
  status: 'processing' | 'completed' | 'failed',
  stage: string,
  progress: number,
  data?: object,
  error?: string
}
```

### Publishing Status Updates
```
POST /api/webhooks/publish-status
Body: {
  contentId: string,
  status: 'publishing' | 'published' | 'failed',
  stage: string,
  youtubeVideoId?: string,
  youtubeUrl?: string,
  error?: string
}
```

### Analytics Updates
```
POST /api/webhooks/analytics-update
Body: {
  contentId: string,
  youtubeVideoId: string,
  analytics: {
    totalViews: number,
    totalLikes: number,
    totalComments: number,
    last30Days: object,
    dailyData: array,
    engagementRate: number,
    syncedAt: string
  }
}
```

### Batch Completion Notifications
```
POST /api/webhooks/publish-batch-complete
POST /api/webhooks/analytics-batch-complete
Body: {
  summary: {
    totalProcessed: number,
    successful: number,
    failed: number,
    ...additionalMetrics
  },
  timestamp: string
}
```

---

## Production Checklist

- [ ] All API credentials configured and tested
- [ ] Webhook URLs point to production API endpoints
- [ ] Template IDs updated with production Creatomate templates
- [ ] Error handling tested with mock failures
- [ ] Queue mode enabled with Redis for scalability
- [ ] Workflow execution logs monitored and alerted
- [ ] Rate limits configured for external APIs
- [ ] Retry logic enabled for transient failures
- [ ] Security: API keys stored in n8n credentials vault
- [ ] Backup: Workflow JSON files version controlled

---

## Support and Resources

- **n8n Documentation**: https://docs.n8n.io
- **Gemini API Docs**: https://ai.google.dev/gemini-api/docs
- **ElevenLabs API Docs**: https://elevenlabs.io/docs
- **Creatomate API Docs**: https://creatomate.com/docs/api
- **YouTube API Docs**: https://developers.google.com/youtube/v3

For TubeGenius-specific issues, refer to the main project documentation in `/docs`.
