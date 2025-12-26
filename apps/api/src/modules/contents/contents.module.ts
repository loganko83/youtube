import { Module } from '@nestjs/common';
import { ContentsController } from './contents.controller';
import { ContentsService } from './contents.service';
import { GeminiService } from './gemini.service';
import { SafetyFilterService } from './safety-filter.service';
import { TtsService } from './tts.service';
import { EdgeTtsService } from './edge-tts.service';
import { ElevenLabsTtsService } from './elevenlabs-tts.service';
import { VideoService } from './video.service';
import { YouTubeModule } from '../youtube/youtube.module';

@Module({
  imports: [YouTubeModule],
  controllers: [ContentsController],
  providers: [
    ContentsService,
    GeminiService,
    SafetyFilterService,
    // TTS Providers
    EdgeTtsService,
    ElevenLabsTtsService,
    TtsService,
    // Video
    VideoService,
  ],
  exports: [ContentsService, TtsService, EdgeTtsService, ElevenLabsTtsService, VideoService],
})
export class ContentsModule {}
