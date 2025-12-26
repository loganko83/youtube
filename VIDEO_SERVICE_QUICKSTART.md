# Video Service Quick Start Guide

Get started with video rendering in 5 minutes.

## 🚀 Quick Setup (5 steps)

### Step 1: Get Creatomate API Key

1. Sign up at https://creatomate.com
2. Navigate to Settings → API Keys
3. Copy your API key

### Step 2: Configure Environment

Add to `.env.local`:

```bash
CREATOMATE_API_KEY=your_api_key_here
```

### Step 3: Run Database Migration

```bash
cd apps/api
npx prisma migrate dev --name add_video_rendering_fields
npx prisma generate
```

### Step 4: Test the Service

Create `test-video.ts`:

```typescript
import { VideoService } from './src/modules/contents/video.service';
import { ConfigService } from '@nestjs/config';
import { ContentFormat, NicheType } from '@tubegenius/shared';

// Mock config
const mockConfig = {
  get: (key: string) => {
    if (key === 'CREATOMATE_API_KEY') {
      return process.env.CREATOMATE_API_KEY;
    }
    return null;
  },
};

const videoService = new VideoService(mockConfig as ConfigService);

// Test render
async function testRender() {
  const result = await videoService.renderVideo({
    templateId: '',
    format: ContentFormat.SHORTS,
    niche: NicheType.SENIOR_HEALTH,
    title: 'Test Video',
    script: 'This is a test script for video rendering.',
    voiceoverText: 'This is a test voiceover text with multiple words for subtitle segmentation.',
    audioUrl: 'https://example.com/audio.mp3', // Optional
    imagePrompts: ['Beautiful nature scene', 'Happy senior smiling'],
    imageUrls: [], // Optional
    language: 'ko',
  });

  console.log('Render Result:', result);
  console.log(`Video URL: ${result.url}`);
  console.log(`Cost: $${result.cost}`);
}

testRender().catch(console.error);
```

Run:
```bash
npx ts-node test-video.ts
```

### Step 5: Integrate into Workflow

Update `contents.service.ts`:

```typescript
import { VideoService } from './video.service';

@Injectable()
export class ContentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
    private readonly safetyFilter: SafetyFilterService,
    private readonly tts: TtsService,
    private readonly video: VideoService, // Add this
  ) {}

  private async generateContentAsync(contentId: string, config: any) {
    try {
      // 1. Script generation
      await this.prisma.content.update({
        where: { id: contentId },
        data: { status: 'script_generating' },
      });
      const generated = await this.gemini.generateScript(config);

      // 2. Safety check
      const safetyReport = await this.safetyFilter.check(generated, config.niche);
      if (!safetyReport.passed) {
        throw new Error('Safety check failed');
      }

      // 3. TTS generation
      await this.prisma.content.update({
        where: { id: contentId },
        data: { status: 'tts_processing' },
      });
      const audioUrl = await this.tts.generateAudio(generated.voiceoverText, config.niche);

      // 4. Video rendering (NEW!)
      await this.prisma.content.update({
        where: { id: contentId },
        data: { status: 'video_rendering' },
      });

      const videoResult = await this.video.renderVideo({
        templateId: this.video.getTemplateId(config.format, config.niche) || '',
        format: config.format,
        niche: config.niche,
        title: generated.title,
        script: generated.script,
        voiceoverText: generated.voiceoverText,
        audioUrl: audioUrl,
        imagePrompts: generated.imagePrompts,
        language: config.language,
      });

      // 5. Update with video URL
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
          audioUrl: audioUrl,
          videoUrl: videoResult.url,
          renderingCost: videoResult.cost,
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
}
```

## 🎯 Verify Setup

Run all checks:

```bash
# 1. Check environment
echo $CREATOMATE_API_KEY

# 2. Check database
cd apps/api
npx prisma studio
# Open Content model and verify new fields exist

# 3. Run tests
npm test -- video.service.spec.ts

# 4. Start dev server
npm run dev

# 5. Test API endpoint
curl -X POST http://localhost:3000/api/contents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "projectId": "test-project-id",
    "config": {
      "niche": "Senior Health",
      "topic": "건강한 노년",
      "tone": "Friendly",
      "format": "Shorts",
      "language": "ko"
    }
  }'
```

## 📊 Monitor Progress

Check content status:

```bash
# Get content by ID
curl http://localhost:3000/api/contents/{contentId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Response:
{
  "success": true,
  "data": {
    "id": "...",
    "status": "video_rendering", // or "completed"
    "videoUrl": "https://cdn.creatomate.com/...",
    "renderingCost": 0.0225,
    "title": "...",
    "script": "..."
  }
}
```

## 🎨 Customize Templates

### Option 1: Use Dynamic Templates (Default)

Set `templateId` to empty string - the service will generate templates on-the-fly.

### Option 2: Create Templates in Creatomate Dashboard

1. Go to https://creatomate.com/editor
2. Create new template
3. Set dimensions:
   - Shorts: 1080x1920
   - Long-form: 1920x1080
4. Add elements (background, subtitles, audio)
5. Save with ID: `tmpl_shorts_senior_health_v1`
6. Update `video-templates.ts` TEMPLATE_IDS

## 💰 Monitor Costs

Query rendering costs:

```sql
-- Total rendering costs
SELECT SUM(renderingCost) as total_cost
FROM "Content"
WHERE videoUrl IS NOT NULL;

-- Cost by niche
SELECT
  config->>'niche' as niche,
  COUNT(*) as videos,
  SUM(renderingCost) as total_cost,
  AVG(renderingCost) as avg_cost
FROM "Content"
WHERE videoUrl IS NOT NULL
GROUP BY config->>'niche';

-- Daily costs
SELECT
  DATE(createdAt) as date,
  COUNT(*) as videos_rendered,
  SUM(renderingCost) as total_cost
FROM "Content"
WHERE videoUrl IS NOT NULL
GROUP BY DATE(createdAt)
ORDER BY date DESC;
```

## 🐛 Troubleshooting

### Issue: "CREATOMATE_API_KEY not configured"

**Solution**:
```bash
# Check .env.local
cat .env.local | grep CREATOMATE

# If missing, add:
echo "CREATOMATE_API_KEY=your_key_here" >> .env.local

# Restart server
npm run dev
```

### Issue: Migration fails

**Solution**:
```bash
# Reset database (development only!)
npx prisma migrate reset

# Re-run migration
npx prisma migrate dev --name add_video_rendering_fields

# Regenerate client
npx prisma generate
```

### Issue: Render timeout

**Solution**: Increase polling timeout in `video.service.ts`:
```typescript
private readonly maxPollAttempts = 120; // 10 minutes
```

### Issue: High rendering costs

**Solution**: Use Standard quality:
```typescript
const { estimateRenderingCost } = require('@tubegenius/shared');
const cost = estimateRenderingCost(45, 'STANDARD'); // $0.0225
```

## 📚 Next Steps

1. **Read full documentation**: `VIDEO_SERVICE_README.md`
2. **Review integration example**: `video.integration.example.ts`
3. **Check database migration guide**: `DATABASE_MIGRATION.md`
4. **See implementation summary**: `VIDEO_SERVICE_IMPLEMENTATION_SUMMARY.md`

## ✅ Checklist

- [ ] Creatomate account created
- [ ] API key added to `.env.local`
- [ ] Database migration completed
- [ ] Prisma client regenerated
- [ ] Tests passing
- [ ] Service integrated into ContentsService
- [ ] API endpoint working
- [ ] Video rendering successful
- [ ] Costs monitored

## 🎉 You're Ready!

Your video rendering service is now set up and ready to generate professional videos for TubeGenius AI!

**Test command**:
```bash
# Run the complete workflow
npm run dev

# In another terminal
curl -X POST http://localhost:3000/api/contents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d @test-content.json

# Watch the logs for rendering progress
```

**Expected output**:
```
Starting video render: format=Shorts, niche=Senior Health
Render job created: render_abc123
Poll attempt 1/60: status=queued
Poll attempt 2/60: status=processing
...
Poll attempt 45/60: status=completed
Render completed: render_abc123, url=https://cdn.creatomate.com/...
```

For help: See `VIDEO_SERVICE_README.md` or open an issue.
