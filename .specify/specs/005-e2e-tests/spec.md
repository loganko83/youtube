# Feature Specification: E2E Test Scenarios

**Feature ID**: 005-e2e-tests
**Created**: 2024-12-25
**Priority**: P1 (High)
**Status**: In Progress

## Overview

Define comprehensive end-to-end test scenarios for the complete content generation pipeline.

## Test Scenarios

### TS-1: Manual Content Generation Flow
**Objective**: Verify full pipeline from content creation to completion

**Prerequisites**:
- User is authenticated
- Project exists with valid configuration
- API keys configured (GEMINI_API_KEY, CREATOMATE_API_KEY)

**Steps**:
1. Navigate to Content Generator
2. Select project and configure content (niche, topic, tone, format)
3. Submit content generation request
4. Observe status transitions: PENDING → SCRIPT_GENERATING → TTS_PROCESSING → VIDEO_RENDERING → COMPLETED
5. Verify videoUrl is populated
6. Verify metadata contains TTS and video information

**Expected Results**:
- Content progresses through all stages
- Final status is COMPLETED
- videoUrl contains valid Creatomate URL
- metadata.tts contains provider, duration, cost
- metadata.video contains renderId, url, cost

### TS-2: Automated Content Generation
**Objective**: Verify automation triggers content generation at scheduled time

**Prerequisites**:
- Project has automation enabled (isEnabled: true)
- autoPublish is false (no YouTube upload)
- YouTube channel not connected

**Steps**:
1. Enable automation for a project
2. Manually trigger content generation via scheduler API
3. Verify content is created with source: 'automation'
4. Verify content completes full pipeline

**Expected Results**:
- Content created with automation source
- Content reaches COMPLETED status
- No YouTube upload attempted

### TS-3: Auto-Publish to YouTube
**Objective**: Verify automatic YouTube upload when autoPublish is enabled

**Prerequisites**:
- Project has YouTube channel connected
- autoPublish is enabled
- Valid YouTube OAuth tokens

**Steps**:
1. Enable autoPublish for project
2. Generate content
3. Observe UPLOADING status
4. Verify youtubeVideoId is populated

**Expected Results**:
- Content transitions through UPLOADING status
- youtubeVideoId is populated
- Status changes to COMPLETED (or PUBLISHED)

### TS-4: Error Handling - TTS Failure
**Objective**: Verify proper error handling when TTS fails

**Steps**:
1. Configure invalid TTS provider settings
2. Generate content
3. Observe TTS_FAILED status

**Expected Results**:
- Content status is TTS_FAILED or FAILED
- Error message is populated
- Script content is preserved

### TS-5: Error Handling - Video Rendering Failure
**Objective**: Verify proper error handling when video rendering fails

**Steps**:
1. Configure invalid CREATOMATE_API_KEY
2. Generate content through TTS stage
3. Observe FAILED status at video stage

**Expected Results**:
- Content status is FAILED
- Error message mentions video/render failure
- TTS output is preserved

### TS-6: Error Handling - YouTube Upload Failure
**Objective**: Verify graceful handling of YouTube upload failure

**Steps**:
1. Configure expired YouTube OAuth tokens
2. Enable autoPublish
3. Generate content
4. Observe upload failure

**Expected Results**:
- Content reaches COMPLETED status (not FAILED)
- Error field contains YouTube upload failure message
- videoUrl is still valid

### TS-7: Real-time Progress Updates
**Objective**: Verify frontend receives real-time status updates

**Steps**:
1. Navigate to content detail page
2. Generate new content
3. Observe progress indicator updates
4. Verify polling mechanism works

**Expected Results**:
- Progress indicator shows correct stage
- Status updates every 3 seconds
- Completion triggers notification

### TS-8: Processing Queue Visibility
**Objective**: Verify processing queue shows active contents

**Steps**:
1. Generate multiple contents simultaneously
2. Observe floating queue indicator
3. Click to expand queue
4. Navigate to individual content

**Expected Results**:
- Queue indicator shows count
- Expanded view shows all processing contents
- Links navigate to correct content

### TS-9: Analytics Data Accuracy
**Objective**: Verify analytics dashboard shows accurate data

**Steps**:
1. Generate several contents with known costs
2. Navigate to analytics dashboard
3. Verify cost totals match expected values
4. Verify success rates are accurate

**Expected Results**:
- Cost breakdown matches content metadata
- Success rate calculation is correct
- Trend chart reflects actual data

## Test Data Requirements

### Environment Variables
```env
# Required for E2E tests
GEMINI_API_KEY=<valid_key>
CREATOMATE_API_KEY=<valid_key>
ELEVENLABS_API_KEY=<valid_key> (optional)
YOUTUBE_CLIENT_ID=<valid_id>
YOUTUBE_CLIENT_SECRET=<valid_secret>
```

### Test Users
- Admin user with full access
- Regular user with project ownership

### Test Projects
- Project with YouTube connected
- Project without YouTube
- Project with automation enabled

## Manual Test Procedure

### Before Testing
1. Ensure all environment variables are configured
2. Run database migrations
3. Start API server (`npm run dev:api`)
4. Start web server (`npm run dev:web`)

### Test Execution Checklist
- [ ] TS-1: Manual content generation
- [ ] TS-2: Automated content generation
- [ ] TS-3: Auto-publish to YouTube
- [ ] TS-4: TTS failure handling
- [ ] TS-5: Video rendering failure handling
- [ ] TS-6: YouTube upload failure handling
- [ ] TS-7: Real-time progress updates
- [ ] TS-8: Processing queue visibility
- [ ] TS-9: Analytics data accuracy
