# Technical Plan: E2E Content Pipeline Completion

**Feature**: 002-e2e-pipeline
**Created**: 2024-12-25
**Status**: Ready for Implementation

## Current State Analysis

### Implemented Services
1. **VideoService** (`video.service.ts`): Complete
   - `renderVideo()` - Creatomate API integration
   - Supports Shorts (9:16) and Long-form (16:9)
   - Senior-friendly subtitles for health niche

2. **YouTubeService** (`youtube.service.ts`): Complete
   - `uploadVideo()` - YouTube Data API v3 integration
   - OAuth token management with auto-refresh
   - Supports scheduled publishing

3. **ContentsService** (`contents.service.ts`): **Incomplete**
   - Pipeline stops at TTS_PROCESSING
   - After TTS: sets status to COMPLETED without video/upload

4. **SchedulerService/Jobs**: Partially Complete
   - Cron jobs registered (6 AM trends, 9 AM content)
   - Content generation works but doesn't track full pipeline

### Gap Analysis

| Stage | Current | Required |
|-------|---------|----------|
| Script Generation | SCRIPT_GENERATING | No change |
| TTS Processing | TTS_PROCESSING | No change |
| Video Rendering | Skipped | VIDEO_RENDERING |
| YouTube Upload | Skipped | UPLOADING |
| Completion | COMPLETED (after TTS) | COMPLETED (after upload) |

## Implementation Plan

### Task 1: Extend Content Status Enum

**File**: `apps/api/prisma/schema.prisma` (if needed)
**File**: `packages/shared/src/types/content.ts`

Add missing statuses:
```typescript
enum ContentStatus {
  PENDING = 'PENDING',
  SCRIPT_GENERATING = 'SCRIPT_GENERATING',
  TTS_PROCESSING = 'TTS_PROCESSING',
  VIDEO_RENDERING = 'VIDEO_RENDERING',  // NEW
  UPLOADING = 'UPLOADING',               // NEW
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}
```

### Task 2: Wire Video Rendering into Pipeline

**File**: `apps/api/src/modules/contents/contents.service.ts`

Modify `generateContentAsync()`:
```typescript
// After TTS success:
await this.prisma.content.update({
  where: { id: contentId },
  data: { status: 'VIDEO_RENDERING' },
});

// Call VideoService
const videoResult = await this.videoService.renderVideo({
  format: config.format,
  niche: config.niche,
  title: generated.title,
  script: generated.script,
  voiceoverText: generated.voiceoverText,
  audioUrl: ttsResult.audioUrl,
  imagePrompts: generated.imagePrompts,
  language: config.language,
});

// Update with video URL
await this.prisma.content.update({
  where: { id: contentId },
  data: {
    videoUrl: videoResult.url,
    status: 'VIDEO_COMPLETED',  // or proceed to UPLOADING
  },
});
```

### Task 3: Add Auto-Upload Logic

**File**: `apps/api/src/modules/contents/contents.service.ts`

After video completion, check automation settings:
```typescript
// Check if auto-publish is enabled
const automation = await this.prisma.projectAutomation.findUnique({
  where: { projectId: content.projectId },
});

if (automation?.autoPublish && project.youtubeChannelId) {
  await this.uploadToYouTube(contentId, content, project);
} else {
  // Mark as completed (ready for manual upload)
  await this.prisma.content.update({
    where: { id: contentId },
    data: { status: 'COMPLETED' },
  });
}
```

### Task 4: Create Content Pipeline Orchestrator

**New File**: `apps/api/src/modules/contents/content-pipeline.service.ts`

Purpose: Centralize pipeline orchestration logic

```typescript
@Injectable()
export class ContentPipelineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
    private readonly tts: TtsService,
    private readonly video: VideoService,
    private readonly youtube: YouTubeService,
  ) {}

  async processContent(contentId: string): Promise<void> {
    // Step 1: Generate script
    // Step 2: Generate TTS
    // Step 3: Render video
    // Step 4: Upload to YouTube (if autoPublish)
  }
}
```

### Task 5: Handle Creatomate Webhook (Alternative)

**File**: `apps/api/src/modules/webhooks/webhooks.controller.ts`

If using async rendering, add Creatomate webhook handler:
```typescript
@Post('creatomate')
async handleCreatomateWebhook(@Body() payload: CreatomateWebhookDto) {
  // Update content with render result
  // Trigger YouTube upload if applicable
}
```

### Task 6: Update Automation Job Logic

**File**: `apps/api/src/modules/scheduler/jobs/content-generation.job.ts`

Track content completion status:
```typescript
// After content creation, poll for completion or use event-based tracking
// Consider Bull queue for job tracking
```

## File Changes Summary

### Modified Files
1. `apps/api/src/modules/contents/contents.service.ts` - Add video/upload pipeline
2. `apps/api/src/modules/contents/contents.module.ts` - Import VideoService, YouTubeService
3. `packages/shared/src/types/content.ts` - Add VIDEO_RENDERING, UPLOADING status (if not exists)

### New Files
1. `apps/api/src/modules/contents/content-pipeline.service.ts` - Pipeline orchestrator (optional)

### Database Changes
- None required (schema already has videoUrl, youtubeVideoId fields)

## Dependencies

### Service Injection
```
ContentsModule needs to import:
- VideoService (same module)
- YouTubeModule (for YouTubeService)
```

### Module Updates
```typescript
// contents.module.ts
imports: [YouTubeModule]
```

## Testing Strategy

### Unit Tests
- `content-pipeline.service.spec.ts`: Test each pipeline stage
- Mock VideoService, YouTubeService

### Integration Tests
- Full pipeline with mocked external APIs
- Error handling at each stage

### E2E Tests
- Manual trigger via API
- Verify content progresses through all stages

## Risk Mitigation

1. **Video Rendering Timeout**: Implement retry logic with exponential backoff
2. **YouTube Quota**: Check quota before upload, queue if exceeded
3. **OAuth Token Expiry**: Auto-refresh handled in YouTubeService
4. **Concurrent Jobs**: Use mutex/semaphore to prevent race conditions

## Rollback Plan

If issues occur:
1. Disable video rendering in config
2. Set `autoPublish: false` for all automations
3. Revert to TTS-only pipeline
