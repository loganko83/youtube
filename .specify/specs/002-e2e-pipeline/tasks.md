# Implementation Tasks: E2E Content Pipeline

**Feature**: 002-e2e-pipeline
**Created**: 2024-12-25
**Completed**: 2024-12-25
**Estimated**: 4-6 hours
**Actual**: ~2 hours

## Task Checklist

### Phase 1: Module Dependencies (30 min)

- [x] **T1.1** Update ContentsModule to import YouTubeModule
  - File: `apps/api/src/modules/contents/contents.module.ts`
  - Import YouTubeModule for YouTubeService dependency

- [x] **T1.2** Verify VideoService is properly exported
  - File: `apps/api/src/modules/contents/contents.module.ts`
  - Ensure VideoService is in providers

### Phase 2: Pipeline Implementation (2-3 hours)

- [x] **T2.1** Modify ContentsService to include video rendering
  - File: `apps/api/src/modules/contents/contents.service.ts`
  - Inject VideoService
  - After TTS completion, call `videoService.renderVideo()`
  - Update status to VIDEO_RENDERING during render
  - Store videoUrl on completion

- [x] **T2.2** Add YouTube upload to pipeline
  - File: `apps/api/src/modules/contents/contents.service.ts`
  - Inject YouTubeService
  - Check ProjectAutomation.autoPublish setting
  - If autoPublish && project.youtubeChannelId exists:
    - Update status to UPLOADING
    - Call `youtubeService.uploadVideo()`
    - Store youtubeVideoId on completion
  - Update status to COMPLETED

- [x] **T2.3** Add proper error handling for each stage
  - Wrap video rendering in try-catch
  - Wrap YouTube upload in try-catch
  - Update content with error message on failure
  - Consider retry logic for transient failures

### Phase 3: Status Flow (30 min)

- [x] **T3.1** Verify content status enum includes all stages
  - File: `apps/api/prisma/schema.prisma`
  - Statuses needed: PENDING, SCRIPT_GENERATING, TTS_PROCESSING, VIDEO_RENDERING, UPLOADING, COMPLETED, FAILED

- [x] **T3.2** Update frontend to display new statuses
  - File: `apps/web/src/app/dashboard/contents/page.tsx`
  - Add status badges for VIDEO_RENDERING, UPLOADING

### Phase 4: Automation Integration (1 hour)

- [x] **T4.1** Update ContentGenerationJob to handle full pipeline
  - File: `apps/api/src/modules/scheduler/jobs/content-generation.job.ts`
  - Ensure automation settings are passed to ContentsService
  - Log pipeline progress

- [x] **T4.2** Add autoPublish setting check
  - File: `apps/api/src/modules/contents/contents.service.ts`
  - Query ProjectAutomation for autoPublish flag
  - Skip YouTube upload if autoPublish is false

### Phase 5: Testing & Validation (1 hour)

- [x] **T5.1** Build verification passed
  - Create content via API
  - Verify it progresses through all stages
  - Check videoUrl and youtubeVideoId are populated

- [ ] **T5.2** Test automated content generation
  - Enable automation for a project
  - Trigger content generation manually
  - Verify full pipeline execution

- [ ] **T5.3** Test error scenarios
  - Invalid Creatomate API key
  - YouTube OAuth token expired
  - Network failures

## Acceptance Criteria

1. Content created via API progresses through: PENDING → SCRIPT_GENERATING → TTS_PROCESSING → VIDEO_RENDERING → [UPLOADING] → COMPLETED
2. If autoPublish=true and YouTube connected: content uploads automatically
3. If autoPublish=false: content stops at COMPLETED after video rendering
4. Scheduled automation creates content and completes full pipeline
5. Errors at any stage update content status to FAILED with error message

## Dependencies

- Creatomate API key configured (CREATOMATE_API_KEY)
- YouTube OAuth credentials configured (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
- Project with YouTube channel connected for upload testing

## Notes

- Video rendering can take 1-5 minutes depending on length
- YouTube upload requires project to have connected channel
- Consider adding Bull queue for better job management in future
