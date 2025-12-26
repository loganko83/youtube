# ElevenLabs TTS Service Documentation

## Overview

Production-ready Text-to-Speech service for TubeGenius AI, integrating ElevenLabs API for high-quality Korean voice synthesis.

## Features

✅ **Korean TTS Support** - Using ElevenLabs multilingual v2 model
✅ **Multiple Voices per Vertical** - Specialized voices for each niche
✅ **Audio File Storage** - Local file system with configurable path
✅ **Error Handling & Retries** - 3 retries with exponential backoff
✅ **Cost Tracking** - Per-generation cost calculation and database logging
✅ **Voice Settings Customization** - Stability, similarity boost, style control
✅ **Health Monitoring** - API status and quota tracking

## Configuration

### Environment Variables

```bash
# Required
ELEVENLABS_API_KEY=your_api_key_here

# Optional
STORAGE_PATH=./storage/audio  # Default path for audio files
```

### Voice Configuration

Voice IDs and settings are defined in `@tubegenius/shared/constants`:

```typescript
VERTICAL_SETTINGS = {
  senior_health: {
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // Sarah
    voiceSettings: {
      stability: 0.7,
      similarity_boost: 0.8,
      style: 0.3,
    },
  },
  finance: {
    voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam
    voiceSettings: {
      stability: 0.8,
      similarity_boost: 0.7,
      style: 0.2,
    },
  },
  // ... other verticals
}
```

## API Reference

### `generateAudio()`

Generate TTS audio from text.

```typescript
await ttsService.generateAudio(
  text: string,
  niche: NicheType,
  format: ContentFormat,
  contentId: string,
  customVoiceId?: string,
  customVoiceSettings?: VoiceSettings,
): Promise<TTSGenerationResult>
```

**Parameters:**
- `text` - Text to convert to speech (max 5,000 characters)
- `niche` - Content vertical (senior_health, finance, etc.)
- `format` - Content format (shorts, long_form)
- `contentId` - Unique content identifier for file naming
- `customVoiceId` - (Optional) Override default voice for niche
- `customVoiceSettings` - (Optional) Custom voice settings

**Returns:**
```typescript
{
  audioUrl: string;          // Public URL path
  audioPath: string;         // File system path
  durationSeconds: number;   // Estimated duration
  characterCount: number;    // Text length
  costUsd: number;          // Generation cost
  voiceId: string;          // Used voice ID
  voiceSettings: VoiceSettings;
}
```

### `getAvailableVoices()`

Fetch available voices from ElevenLabs API.

```typescript
await ttsService.getAvailableVoices(niche?: NicheType): Promise<Voice[]>
```

### `getVoiceSettings()`

Get recommended voice settings for a niche.

```typescript
const settings = ttsService.getVoiceSettings(NicheType.SENIOR_HEALTH);
```

### `healthCheck()`

Check ElevenLabs API status and quota.

```typescript
const health = await ttsService.healthCheck();
// { status: 'healthy', quota: { characterCount: 1234, characterLimit: 100000 } }
```

### `deleteAudioFile()`

Remove audio file from storage.

```typescript
await ttsService.deleteAudioFile(audioPath: string);
```

## Integration with Contents Pipeline

The TTS service is automatically integrated into the content generation pipeline:

```typescript
// contents.service.ts

async generateContentAsync(contentId, config) {
  // 1. Generate script
  const script = await gemini.generateScript(config);

  // 2. Safety check
  const safety = await safetyFilter.check(script, config.niche);

  // 3. Generate TTS (NEW)
  const ttsResult = await tts.generateAudio(
    script.voiceoverText,
    config.niche,
    config.format,
    contentId,
  );

  // 4. Save to database with TTS metadata
  await prisma.content.update({
    data: {
      status: 'completed',
      metadata: {
        tts: {
          audioUrl: ttsResult.audioUrl,
          costUsd: ttsResult.costUsd,
          // ... other TTS metadata
        },
      },
    },
  });
}
```

## Cost Management

### Pricing Model

- **ElevenLabs Creator Plan**: $0.30 per 1,000 characters
- **Target Cost**: $0.015 USD per content (from NFRs)
- **Average Script**: ~50 characters → ~$0.015 USD

### Cost Tracking

Costs are automatically tracked in the database:

```typescript
// Stored in Content.metadata.tts
{
  costUsd: 0.0123,
  characterCount: 41,
  generatedAt: "2024-01-15T10:30:00Z"
}
```

### Cost Warnings

The service logs warnings when costs exceed targets:

```
[WARN] TTS cost 0.0234 USD exceeds target 0.0150 USD
```

## Error Handling

### Retry Logic

- **Max Retries**: 3 attempts
- **Backoff Strategy**: Exponential (1s, 2s, 4s)
- **Retryable Errors**: Network failures, rate limits, temporary API errors
- **Non-retryable Errors**: Invalid API key, character limit exceeded

### Graceful Degradation

If TTS generation fails, the content is still saved with status `tts_failed`:

```typescript
{
  status: 'tts_failed',
  metadata: {
    tts: {
      status: 'failed',
      error: 'ElevenLabs API error: Rate limit exceeded'
    }
  }
}
```

### Error Examples

```typescript
// Invalid input
throw new BadRequestException('Text cannot be empty');
throw new BadRequestException('Text exceeds maximum length of 5000 characters');

// API failures
throw new InternalServerErrorException('TTS generation failed after 3 attempts');
throw new InternalServerErrorException('Failed to save audio file');
```

## Storage Management

### File Organization

```
storage/
└── audio/
    ├── {contentId}_1704967800000.mp3
    ├── {contentId}_1704967900000.mp3
    └── ...
```

### File Naming Convention

```
{contentId}_{timestamp}.mp3
```

Example: `clw1234abc_1704967800000.mp3`

### Storage Operations

```typescript
// Get file stats
const stats = await ttsService.getAudioStats(audioPath);
// { size: 245678, created: Date }

// Delete file
await ttsService.deleteAudioFile(audioPath);
```

## Voice Settings Guide

### Stability (0.0 - 1.0)

- **Low (0.3-0.5)**: More expressive, variable
- **Medium (0.6-0.7)**: Balanced
- **High (0.8-1.0)**: Consistent, stable

### Similarity Boost (0.0 - 1.0)

- **Low (0.5-0.6)**: More creative interpretation
- **Medium (0.7-0.8)**: Balanced voice match
- **High (0.9-1.0)**: Exact voice replication

### Style (0.0 - 1.0)

- **Low (0.0-0.2)**: Neutral delivery
- **Medium (0.3-0.5)**: Moderate expression
- **High (0.6-1.0)**: Maximum emotion

### Recommended Settings by Vertical

| Vertical | Stability | Similarity | Style | Rationale |
|----------|-----------|------------|-------|-----------|
| Senior Health | 0.7 | 0.8 | 0.3 | Clear, stable, friendly |
| Finance | 0.8 | 0.7 | 0.2 | Professional, trustworthy |
| Tech/AI | 0.6 | 0.75 | 0.4 | Enthusiastic but clear |
| History | 0.75 | 0.8 | 0.5 | Dramatic storytelling |
| Commerce | 0.65 | 0.75 | 0.35 | Engaging, persuasive |

## Performance Targets

From NFRs (Non-Functional Requirements):

- **TTS Generation**: < 60 seconds
- **API Response**: < 200ms (for health checks)
- **Cost per Content**: < $0.015 USD

## Monitoring

### Health Checks

```typescript
// Check API status
const health = await ttsService.healthCheck();

if (health.status === 'unhealthy') {
  logger.error('ElevenLabs API is unavailable');
}

// Check quota
if (health.quota.characterCount > health.quota.characterLimit * 0.9) {
  logger.warn('ElevenLabs quota approaching limit');
}
```

### Metrics to Track

1. **Success Rate**: % of successful TTS generations
2. **Average Cost**: Per content, per vertical
3. **Average Duration**: Generation time
4. **Quota Usage**: Characters consumed vs. limit
5. **Error Rate**: Failed generations, retry counts

## Testing

### Unit Tests

```typescript
describe('TtsService', () => {
  it('should generate audio for Korean text', async () => {
    const result = await ttsService.generateAudio(
      '안녕하세요',
      NicheType.SENIOR_HEALTH,
      ContentFormat.SHORTS,
      'test-content-id',
    );

    expect(result.audioUrl).toBeDefined();
    expect(result.costUsd).toBeLessThan(COST_TARGETS_USD.TTS_ELEVENLABS);
  });

  it('should retry on failure', async () => {
    // Mock API failure
    // Verify 3 retry attempts
  });

  it('should validate character limit', async () => {
    const longText = 'x'.repeat(6000);

    await expect(
      ttsService.generateAudio(longText, ...)
    ).rejects.toThrow('exceeds maximum length');
  });
});
```

### Integration Tests

```typescript
describe('Content Generation Pipeline', () => {
  it('should generate content with TTS', async () => {
    const content = await contentsService.create(userId, {
      projectId,
      config: {
        niche: NicheType.SENIOR_HEALTH,
        topic: '건강한 아침 습관',
        format: ContentFormat.SHORTS,
      },
    });

    // Wait for async generation
    await waitForStatus(content.id, 'completed');

    const result = await contentsService.findOne(content.id, userId);

    expect(result.metadata.tts).toBeDefined();
    expect(result.metadata.tts.audioUrl).toBeTruthy();
  });
});
```

## Troubleshooting

### Common Issues

**Problem**: "ELEVENLABS_API_KEY not configured"
- **Solution**: Add API key to `.env` file

**Problem**: "Text exceeds maximum length"
- **Solution**: Script too long, adjust Gemini prompt to generate shorter scripts

**Problem**: "TTS generation failed after 3 attempts"
- **Causes**:
  - Network issues
  - ElevenLabs API outage
  - Rate limiting
- **Solution**: Check health status, verify quota, check API status page

**Problem**: Audio files filling storage
- **Solution**: Implement cleanup job to delete old files after video rendering

### Debug Logging

Enable debug logging in development:

```typescript
// Set in .env
LOG_LEVEL=debug

// Check logs
[DEBUG] Voice: EXAVITQu4vr4xnSDxMaL, Text length: 123 chars
[DEBUG] Audio generated in 2345ms, saved to /storage/audio/...
```

## Future Enhancements

- [ ] Support for multiple languages (Japanese, Chinese, English)
- [ ] Voice cloning for branded content
- [ ] Real-time streaming TTS for live content
- [ ] Audio post-processing (normalization, background music)
- [ ] S3/GCS integration for cloud storage
- [ ] Voice A/B testing for conversion optimization
- [ ] Custom pronunciation dictionary for technical terms
- [ ] Emotion detection and adaptive voice settings

## References

- [ElevenLabs API Documentation](https://docs.elevenlabs.io/)
- [Voice Settings Guide](https://docs.elevenlabs.io/api-reference/text-to-speech)
- [Korean Language Support](https://docs.elevenlabs.io/languages)
- [Pricing](https://elevenlabs.io/pricing)
