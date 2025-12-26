# TTS Service Implementation - Code Changes

## Summary of Changes

### New Files Created

1. **`src/modules/contents/tts.service.ts`** (420 lines)
   - Complete ElevenLabs TTS integration
   - Production-ready with retry logic, cost tracking, health monitoring

2. **`.env.example`** (16 lines)
   - Environment variable documentation
   - ELEVENLABS_API_KEY, STORAGE_PATH configuration

3. **`src/modules/contents/TTS_README.md`** (525 lines)
   - Complete API documentation
   - Configuration, integration, troubleshooting guides

4. **`IMPLEMENTATION_SUMMARY.md`**
   - Architecture overview
   - Technical decisions and rationale

5. **`TTS_VERIFICATION_CHECKLIST.md`**
   - Implementation verification steps
   - Testing and deployment checklists

---

## File Modifications

### 1. `src/modules/contents/contents.module.ts`

**Before:**
```typescript
import { Module } from '@nestjs/common';
import { ContentsController } from './contents.controller';
import { ContentsService } from './contents.service';
import { GeminiService } from './gemini.service';
import { SafetyFilterService } from './safety-filter.service';

@Module({
  controllers: [ContentsController],
  providers: [ContentsService, GeminiService, SafetyFilterService],
  exports: [ContentsService],
})
export class ContentsModule {}
```

**After:**
```typescript
import { Module } from '@nestjs/common';
import { ContentsController } from './contents.controller';
import { ContentsService } from './contents.service';
import { GeminiService } from './gemini.service';
import { SafetyFilterService } from './safety-filter.service';
import { TtsService } from './tts.service';            // ← ADDED
import { VideoService } from './video.service';        // (User added)

@Module({
  controllers: [ContentsController],
  providers: [
    ContentsService,
    GeminiService,
    SafetyFilterService,
    TtsService,                                        // ← ADDED
    VideoService,                                      // (User added)
  ],
  exports: [
    ContentsService,
    TtsService,                                        // ← ADDED
    VideoService,                                      // (User added)
  ],
})
export class ContentsModule {}
```

**Changes:**
- ✅ Added `TtsService` import
- ✅ Added `TtsService` to providers array
- ✅ Exported `TtsService` for use in other modules

---

### 2. `src/modules/contents/contents.service.ts`

#### Change 1: Imports and Dependencies

**Before:**
```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from './gemini.service';
import { SafetyFilterService } from './safety-filter.service';
import { CreateContentDto } from './contents.dto';

@Injectable()
export class ContentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
    private readonly safetyFilter: SafetyFilterService,
  ) {}
```

**After:**
```typescript
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from './gemini.service';
import { SafetyFilterService } from './safety-filter.service';
import { TtsService } from './tts.service';              // ← ADDED
import { CreateContentDto } from './contents.dto';

@Injectable()
export class ContentsService {
  private readonly logger = new Logger(ContentsService.name);  // ← ADDED

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
    private readonly safetyFilter: SafetyFilterService,
    private readonly tts: TtsService,                    // ← ADDED
  ) {}
```

**Changes:**
- ✅ Added `Logger` import from `@nestjs/common`
- ✅ Added `TtsService` import
- ✅ Created logger instance
- ✅ Injected `TtsService` in constructor

#### Change 2: `generateContentAsync()` Method

**Before:**
```typescript
private async generateContentAsync(contentId: string, config: any) {
  try {
    // Update status
    await this.prisma.content.update({
      where: { id: contentId },
      data: { status: 'script_generating' },
    });

    // Generate script
    const generated = await this.gemini.generateScript(config);

    // Safety check
    const safetyReport = await this.safetyFilter.check(generated, config.niche);

    if (!safetyReport.passed) {
      await this.prisma.content.update({
        where: { id: contentId },
        data: {
          status: 'failed',
          error: 'Safety check failed: ' + safetyReport.issues.map(i => i.description).join(', '),
        },
      });
      return;
    }

    // Update with generated content
    await this.prisma.content.update({
      where: { id: contentId },
      data: {
        status: 'completed',
        title: generated.title,
        script: generated.script,
        voiceoverText: generated.voiceoverText,
        imagePrompts: generated.imagePrompts,
        criticalClaims: generated.criticalClaims,
        metadata: generated.metadata,
        safetyReport: safetyReport,
      },
    });
  } catch (error) {
    await this.prisma.content.update({
      where: { id: contentId },
      data: {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}
```

**After:**
```typescript
private async generateContentAsync(contentId: string, config: any) {
  try {
    // Update status
    await this.prisma.content.update({
      where: { id: contentId },
      data: { status: 'script_generating' },
    });

    // Generate script
    const generated = await this.gemini.generateScript(config);

    // Safety check
    const safetyReport = await this.safetyFilter.check(generated, config.niche);

    if (!safetyReport.passed) {
      await this.prisma.content.update({
        where: { id: contentId },
        data: {
          status: 'failed',
          error: 'Safety check failed: ' + safetyReport.issues.map(i => i.description).join(', '),
        },
      });
      return;
    }

    // ========================================
    // TTS GENERATION - NEW SECTION
    // ========================================

    // Update status to TTS generation
    await this.prisma.content.update({
      where: { id: contentId },
      data: { status: 'tts_generating' },
    });

    // Generate TTS audio
    let ttsResult;
    try {
      ttsResult = await this.tts.generateAudio(
        generated.voiceoverText,
        config.niche,
        config.format,
        contentId,
      );

      this.logger.log(
        `TTS generation completed for content ${contentId}: ${ttsResult.durationSeconds}s, ${ttsResult.costUsd.toFixed(4)} USD`,
      );
    } catch (ttsError) {
      this.logger.error('TTS generation failed', ttsError);

      // Continue with content creation but mark TTS as failed
      ttsResult = null;

      // Update metadata to include TTS error
      generated.metadata = {
        ...generated.metadata,
        tts: {
          status: 'failed',
          error: ttsError instanceof Error ? ttsError.message : 'Unknown TTS error',
        },
      };
    }

    // ========================================
    // END TTS GENERATION
    // ========================================

    // Update with generated content
    await this.prisma.content.update({
      where: { id: contentId },
      data: {
        status: ttsResult ? 'completed' : 'tts_failed',  // ← MODIFIED
        title: generated.title,
        script: generated.script,
        voiceoverText: generated.voiceoverText,
        imagePrompts: generated.imagePrompts,
        criticalClaims: generated.criticalClaims,
        metadata: {                                       // ← MODIFIED
          ...generated.metadata,
          ...(ttsResult && {
            tts: {
              audioUrl: ttsResult.audioUrl,
              audioPath: ttsResult.audioPath,
              durationSeconds: ttsResult.durationSeconds,
              characterCount: ttsResult.characterCount,
              costUsd: ttsResult.costUsd,
              voiceId: ttsResult.voiceId,
              voiceSettings: ttsResult.voiceSettings,
              generatedAt: new Date().toISOString(),
            },
          }),
        },
        safetyReport: safetyReport,
      },
    });
  } catch (error) {
    this.logger.error('Content generation failed', error);  // ← MODIFIED (added logger)
    await this.prisma.content.update({
      where: { id: contentId },
      data: {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}
```

**Changes:**
- ✅ Added status update to `tts_generating` before TTS call
- ✅ Added TTS generation logic with error handling
- ✅ Graceful degradation: content saved even if TTS fails
- ✅ TTS metadata stored in `Content.metadata.tts`
- ✅ Status set to `tts_failed` if TTS fails, `completed` if successful
- ✅ Logger used for TTS success/failure messages
- ✅ Cost tracking: `ttsResult.costUsd` logged

---

## Integration Flow

### Before TTS Integration

```
User Request
    ↓
Create Content (status: pending)
    ↓
Generate Script (status: script_generating)
    ↓
Safety Check
    ↓
Save Content (status: completed)
```

### After TTS Integration

```
User Request
    ↓
Create Content (status: pending)
    ↓
Generate Script (status: script_generating)
    ↓
Safety Check
    ↓
Generate TTS (status: tts_generating) ← NEW
    ├─ Success → status: completed
    └─ Failure → status: tts_failed (content still saved)
```

---

## Database Schema Impact

### Content.metadata Structure

**Before:**
```json
{
  "gemini": {
    "model": "gemini-3-pro-preview",
    "tokensUsed": 1234
  }
}
```

**After:**
```json
{
  "gemini": {
    "model": "gemini-3-pro-preview",
    "tokensUsed": 1234
  },
  "tts": {                              // ← NEW
    "audioUrl": "/storage/audio/clw123_1704967800000.mp3",
    "audioPath": "/app/storage/audio/clw123_1704967800000.mp3",
    "durationSeconds": 45,
    "characterCount": 567,
    "costUsd": 0.017,
    "voiceId": "EXAVITQu4vr4xnSDxMaL",
    "voiceSettings": {
      "stability": 0.7,
      "similarity_boost": 0.8,
      "style": 0.3
    },
    "generatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## Environment Variables Required

**New variables (added to `.env.example`):**

```bash
# TTS Service (NEW)
ELEVENLABS_API_KEY=your_api_key_here
STORAGE_PATH=./storage/audio
```

**Existing variables (unchanged):**
```bash
DATABASE_URL=postgresql://...
JWT_SECRET=...
GEMINI_API_KEY=...
```

---

## Testing Impact

### New Test Coverage Needed

1. **TtsService Unit Tests**
   - `generateAudio()` with valid/invalid input
   - Retry logic verification
   - Cost calculation accuracy
   - File storage operations

2. **ContentsService Integration Tests**
   - Content generation with TTS
   - TTS failure handling
   - Metadata tracking

3. **E2E Tests**
   - Full pipeline: script → TTS → storage
   - Audio file verification
   - Cost tracking in database

---

## Deployment Impact

### New Requirements

1. **Storage Directory**
   ```bash
   mkdir -p storage/audio
   chmod 755 storage/audio
   ```

2. **Environment Variables**
   ```bash
   # Production .env
   ELEVENLABS_API_KEY=prod_key_here
   STORAGE_PATH=/mnt/storage/audio
   ```

3. **ElevenLabs Account**
   - Creator plan or higher ($22/month)
   - API key with TTS permissions
   - Character quota monitoring

### No Breaking Changes

- ✅ Existing API endpoints unchanged
- ✅ Database schema compatible (JSON metadata field)
- ✅ No new dependencies required (uses native fetch)
- ✅ Graceful degradation if TTS fails

---

## Performance Impact

### Expected Metrics

- **Additional Latency**: +2-5 seconds per content generation
- **Storage Growth**: ~100-500 KB per audio file
- **Cost per Content**: +$0.015 USD (within budget)
- **API Calls**: +1 ElevenLabs call per content

### Mitigation

- Async generation (user doesn't wait)
- Retry logic for reliability
- Cost warnings in logs
- Graceful failure (content still usable)

---

## Monitoring Requirements

### Metrics to Track

1. **TTS Success Rate**: % of successful generations
2. **Average Cost**: Per content, per vertical
3. **Generation Time**: TTS latency distribution
4. **Storage Usage**: Audio file disk consumption
5. **API Quota**: Characters used vs. limit

### Alerts to Configure

- Critical: API key invalid/expired
- Warning: Cost >$0.02 per generation
- Warning: Quota >90% consumed
- Info: Storage >80% full

---

## Rollback Plan

If TTS integration causes issues:

1. **Disable TTS Generation**
   ```typescript
   // In contents.service.ts
   // Comment out TTS generation block
   // Status will remain 'completed' without TTS
   ```

2. **Remove from Module**
   ```typescript
   // Remove TtsService from providers
   // Content generation continues without TTS
   ```

3. **No Data Loss**
   - Existing content unaffected
   - TTS metadata optional in database
   - Audio files can be deleted separately

---

## Documentation Links

- **API Reference**: `src/modules/contents/TTS_README.md`
- **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md`
- **Verification Checklist**: `TTS_VERIFICATION_CHECKLIST.md`
- **Environment Setup**: `.env.example`

---

## Code Statistics

- **Lines Added**: ~500 lines (tts.service.ts + modifications)
- **Lines Modified**: ~60 lines (contents.service.ts, contents.module.ts)
- **Documentation**: ~1,500 lines (README, guides, checklists)
- **Dependencies Added**: 0 (uses Node.js built-in fetch)
- **Breaking Changes**: 0
- **Test Coverage**: TBD (tests not yet written)
