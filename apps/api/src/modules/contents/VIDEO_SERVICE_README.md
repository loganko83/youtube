# Video Rendering Service Documentation

## Overview

The VideoService provides professional video rendering capabilities for TubeGenius AI using the Creatomate API. It supports both YouTube Shorts (9:16) and long-form videos (16:9) with niche-specific styling optimized for different content verticals.

## Features

### 🎥 Video Format Support
- **YouTube Shorts**: 1080x1920 (9:16), max 60 seconds
- **Long-form**: 1920x1080 (16:9), up to 15 minutes

### 🎨 Niche-Specific Styling
Each niche has customized:
- **Typography**: Font families, sizes, and weights optimized for target audience
- **Color Schemes**: Brand-aligned color palettes and gradients
- **Subtitle Formatting**: Readability-optimized subtitle segmentation
- **Animation Presets**: Professional transitions and effects

### ♿ Accessibility Features
- **Senior-Friendly Subtitles** (Senior Health niche):
  - Extra-large font size (80px for Shorts, 96px for long-form)
  - High contrast white text with thick black strokes
  - 3 words per subtitle segment for easy reading
  - 1.5x line height for clarity

### 📊 Cost Tracking
- Real-time rendering cost estimation
- Actual cost tracking from Creatomate API
- Quality presets (Ultra/High/Standard) with cost implications

## Setup

### 1. Environment Variables

Add to your `.env` file:

```bash
CREATOMATE_API_KEY=your_api_key_here
```

Get your API key from: [Creatomate Authentication](https://creatomate.com/docs/api/rest-api/authentication)

### 2. Database Schema

Update your Prisma schema to include video-related fields:

```prisma
model Content {
  id              String   @id @default(cuid())
  // ... existing fields ...

  // Video rendering fields
  audioUrl        String?
  videoUrl        String?
  renderId        String?
  renderingCost   Float?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

Run migration:
```bash
npx prisma db push
```

## Usage

### Basic Video Rendering

```typescript
import { VideoService, VideoRenderRequest } from './video.service';
import { ContentFormat, NicheType } from '@tubegenius/shared';

// Inject VideoService
constructor(private readonly videoService: VideoService) {}

// Create render request
const request: VideoRenderRequest = {
  templateId: this.videoService.getTemplateId(ContentFormat.SHORTS, NicheType.SENIOR_HEALTH),
  format: ContentFormat.SHORTS,
  niche: NicheType.SENIOR_HEALTH,
  title: 'Video Title',
  script: 'Full script text...',
  voiceoverText: 'Voiceover narration text...',
  audioUrl: 'https://example.com/audio.mp3',
  imagePrompts: ['Scene 1 description', 'Scene 2'],
  imageUrls: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
  language: 'ko',
};

// Render video (waits for completion)
const result = await this.videoService.renderVideo(request);

console.log(`Video URL: ${result.url}`);
console.log(`Rendering cost: $${result.cost}`);
```

### Async Rendering with Status Polling

```typescript
// Submit render job (returns immediately)
const request: VideoRenderRequest = { /* ... */ };
const renderRequest = this.videoService['buildRenderRequest'](request);

const response = await this.videoService['client'].post('/renders', [renderRequest]);
const renderId = response.data[0].id;

// Poll status later
const status = await this.videoService.getRenderStatus(renderId);

if (status.status === 'completed') {
  console.log(`Video ready: ${status.url}`);
} else if (status.status === 'processing') {
  console.log('Still rendering...');
}
```

### Cost Estimation

```typescript
import { estimateRenderingCost } from '@tubegenius/shared';

// Estimate before rendering
const duration = 45; // seconds
const quality = 'STANDARD'; // or 'HIGH', 'ULTRA'

const estimatedCost = estimateRenderingCost(duration, quality);
console.log(`Estimated cost: $${estimatedCost}`);
```

## Template Configuration

### Pre-created Templates (Recommended)

For production, create templates in Creatomate dashboard and reference them:

```typescript
const templateId = this.videoService.getTemplateId(
  ContentFormat.SHORTS,
  NicheType.SENIOR_HEALTH
);
// Returns: 'tmpl_shorts_senior_health_v1'
```

### Dynamic Template Generation

The service can generate templates on-the-fly:

```typescript
// Set templateId to empty string or null
const request: VideoRenderRequest = {
  templateId: '', // Will use dynamic template
  // ... other fields
};
```

## Niche Configurations

### Senior Health
```typescript
{
  typography: {
    titleFont: { size: 80 (shorts) / 96 (long-form), family: 'Noto Sans KR', weight: 700 },
    subtitleFont: { size: 72 / 84, family: 'Noto Sans KR', weight: 600 },
    wordsPerSegment: 3, // High readability
  },
  colors: {
    primary: '#4A90A4',
    background: 'linear-gradient(135deg, #4A90A4 0%, #3A7A8A 100%)',
  }
}
```

### Finance & Investing
```typescript
{
  typography: {
    titleFont: { size: 64 / 80, family: 'Noto Sans KR', weight: 700 },
    subtitleFont: { size: 48 / 56, family: 'Noto Sans KR', weight: 600 },
    wordsPerSegment: 5,
  },
  colors: {
    primary: '#1E3A5F',
    background: 'linear-gradient(135deg, #1E3A5F 0%, #0F1F3F 100%)',
  }
}
```

### Tech & AI Reviews
```typescript
{
  typography: {
    titleFont: { size: 60 / 72, family: 'Roboto', weight: 700 },
    subtitleFont: { size: 44 / 52, family: 'Roboto', weight: 500 },
    wordsPerSegment: 6,
  },
  colors: {
    primary: '#0D1117',
    secondary: '#58A6FF',
    background: 'linear-gradient(135deg, #0D1117 0%, #161B22 100%)',
  }
}
```

## Quality Presets

### Ultra Quality
- Bitrate: 8 Mbps
- Codec: H.264 High Profile
- Preset: Slow (best quality)
- Cost: $0.002 per second

### High Quality
- Bitrate: 5 Mbps
- Codec: H.264 High Profile
- Preset: Medium
- Cost: $0.001 per second

### Standard Quality (Default)
- Bitrate: 3 Mbps
- Codec: H.264 Main Profile
- Preset: Fast
- Cost: $0.0005 per second

## Element Types

The service creates these video elements:

1. **Background Layer** (Track 1)
   - Image slideshow with fade transitions
   - Solid color fallback if no images

2. **Overlay Layer** (Track 2)
   - Semi-transparent gradient overlay
   - Enhances text readability

3. **Subtitle Layer** (Track 3)
   - Dynamically segmented text
   - Niche-specific styling
   - Animated entrance/exit

4. **Audio Layer** (Track 4)
   - TTS voiceover
   - 0.3s fade-in, 0.5s fade-out

5. **Branding Layer** (Track 5)
   - Watermark/channel name
   - 70% opacity

## Error Handling

The service includes comprehensive error handling:

```typescript
try {
  const result = await this.videoService.renderVideo(request);
} catch (error) {
  if (error.response?.status === 401) {
    // Invalid API key
  } else if (error.response?.status === 402) {
    // Insufficient credits
  } else if (error.message.includes('timeout')) {
    // Render took too long
  } else {
    // General error
  }
}
```

## Performance Considerations

### Rendering Times
- **Shorts (45s)**: ~2-4 minutes
- **Long-form (8min)**: ~8-12 minutes

### Polling Configuration
- Poll interval: 5 seconds
- Max attempts: 60 (5 minutes total)
- Timeout: 30 seconds per API call

### Cost Optimization
1. Use **Standard** quality for draft/preview
2. Use **High** quality for final renders
3. Use **Ultra** quality only for premium content
4. Batch renders during off-peak hours

## Integration Example

See `video.integration.example.ts` for complete workflow integration:

1. Script generation (Gemini)
2. TTS audio generation (ElevenLabs)
3. Scene image generation (Gemini Image)
4. **Video rendering** (Creatomate) ← VideoService
5. Upload to YouTube

## API Reference

### VideoService Methods

#### `renderVideo(request: VideoRenderRequest): Promise<VideoRenderResult>`
Main entry point for video rendering. Submits job and polls until completion.

#### `getRenderStatus(renderId: string): Promise<VideoRenderResult>`
Get current status of a render job.

#### `cancelRender(renderId: string): Promise<void>`
Cancel an in-progress render job.

#### `getTemplateId(format: ContentFormat, niche: NicheType): string | null`
Get pre-created template ID for format/niche combination.

### Types

```typescript
interface VideoRenderRequest {
  templateId: string;
  format: ContentFormat;
  niche: NicheType;
  title: string;
  script: string;
  voiceoverText: string;
  audioUrl?: string;
  imagePrompts: string[];
  imageUrls?: string[];
  duration?: number;
  language: string;
}

interface VideoRenderResult {
  renderId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  url?: string;
  duration?: number;
  cost?: number;
  error?: string;
}
```

## Troubleshooting

### Common Issues

**Issue**: "CREATOMATE_API_KEY not configured"
- **Solution**: Add API key to `.env` file

**Issue**: "Render timeout"
- **Solution**: Increase `maxPollAttempts` or reduce video duration

**Issue**: "Insufficient credits"
- **Solution**: Add credits to your Creatomate account

**Issue**: "Template not found"
- **Solution**: Create templates in Creatomate or use dynamic generation

## Resources

- [Creatomate API Documentation](https://creatomate.com/docs/api/rest-api)
- [Creatomate Template Editor](https://creatomate.com/editor)
- [Video Template Configurations](./video-templates.ts)
- [Integration Example](./video.integration.example.ts)

## Support

For issues with:
- **VideoService**: Check this documentation and code comments
- **Creatomate API**: https://creatomate.com/docs
- **Template configuration**: See `packages/shared/src/constants/video-templates.ts`
