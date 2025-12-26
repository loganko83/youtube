import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { VideoService, VideoRenderRequest } from './video.service';
import { ContentFormat, NicheType } from '@tubegenius/shared';

describe('VideoService', () => {
  let service: VideoService;
  let configService: ConfigService;

  // Mock ConfigService
  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'CREATOMATE_API_KEY') {
        return 'test_api_key_12345';
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<VideoService>(VideoService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTemplateId', () => {
    it('should return template ID for Shorts + Senior Health', () => {
      const templateId = service.getTemplateId(ContentFormat.SHORTS, NicheType.SENIOR_HEALTH);
      expect(templateId).toBe('tmpl_shorts_senior_health');
    });

    it('should return template ID for Long-form + Finance', () => {
      const templateId = service.getTemplateId(ContentFormat.LONG_FORM, NicheType.FINANCE);
      expect(templateId).toBe('tmpl_long_finance');
    });

    it('should return template ID for Shorts + Tech/AI', () => {
      const templateId = service.getTemplateId(ContentFormat.SHORTS, NicheType.TECH_AI);
      expect(templateId).toBe('tmpl_shorts_tech');
    });
  });

  describe('Template building', () => {
    it('should build render request for Shorts format', () => {
      const request: VideoRenderRequest = {
        templateId: '',
        format: ContentFormat.SHORTS,
        niche: NicheType.SENIOR_HEALTH,
        title: 'Test Video',
        script: 'Test script content',
        voiceoverText: 'Test voiceover text for TTS generation',
        audioUrl: 'https://example.com/audio.mp3',
        imagePrompts: ['Scene 1', 'Scene 2'],
        imageUrls: ['https://example.com/img1.jpg'],
        language: 'ko',
      };

      const renderRequest = service['buildRenderRequest'](request);

      expect(renderRequest.output_format).toBe('mp4');
      expect(renderRequest.frame_rate).toBe(30);
      expect(renderRequest.resolution).toBe('1080x1920'); // Shorts
      expect(renderRequest.template).toBeDefined();
      expect(renderRequest.template?.width).toBe(1080);
      expect(renderRequest.template?.height).toBe(1920);
    });

    it('should build render request for Long-form format', () => {
      const request: VideoRenderRequest = {
        templateId: '',
        format: ContentFormat.LONG_FORM,
        niche: NicheType.FINANCE,
        title: 'Test Long Video',
        script: 'Test script',
        voiceoverText: 'Test voiceover',
        audioUrl: 'https://example.com/audio.mp3',
        imagePrompts: [],
        language: 'ko',
      };

      const renderRequest = service['buildRenderRequest'](request);

      expect(renderRequest.resolution).toBe('1920x1080'); // Long-form
      expect(renderRequest.template?.width).toBe(1920);
      expect(renderRequest.template?.height).toBe(1080);
    });
  });

  describe('Template elements', () => {
    it('should create background elements with images', () => {
      const request: VideoRenderRequest = {
        templateId: '',
        format: ContentFormat.SHORTS,
        niche: NicheType.SENIOR_HEALTH,
        title: 'Test',
        script: 'Test',
        voiceoverText: 'Test voiceover text',
        imageUrls: [
          'https://example.com/img1.jpg',
          'https://example.com/img2.jpg',
        ],
        imagePrompts: [],
        language: 'ko',
      };

      const duration = 45;
      const elements = service['createBackgroundElements'](request, duration, 1080, 1920);

      expect(elements.length).toBe(2); // 2 images
      expect(elements[0].type).toBe('image');
      expect(elements[0].track).toBe(1);
      expect(elements[0].source).toBe('https://example.com/img1.jpg');
    });

    it('should create solid background when no images', () => {
      const request: VideoRenderRequest = {
        templateId: '',
        format: ContentFormat.SHORTS,
        niche: NicheType.SENIOR_HEALTH,
        title: 'Test',
        script: 'Test',
        voiceoverText: 'Test',
        imageUrls: [],
        imagePrompts: [],
        language: 'ko',
      };

      const duration = 45;
      const elements = service['createBackgroundElements'](request, duration, 1080, 1920);

      expect(elements.length).toBe(1);
      expect(elements[0].type).toBe('shape');
      expect(elements[0].fill_color).toBe('#4A90A4'); // Senior Health color
    });

    it('should create senior-friendly subtitles', () => {
      const request: VideoRenderRequest = {
        templateId: '',
        format: ContentFormat.SHORTS,
        niche: NicheType.SENIOR_HEALTH,
        title: 'Test',
        script: 'Test',
        voiceoverText: 'This is a test voiceover text with multiple words',
        imagePrompts: [],
        language: 'ko',
      };

      const duration = 45;
      const elements = service['createSeniorFriendlySubtitles'](request, duration, 1080, 1920);

      expect(elements.length).toBeGreaterThan(0);
      expect(elements[0].type).toBe('text');
      expect(elements[0].track).toBe(3);
      expect(elements[0].font_size).toBe('80px'); // Large for seniors
      expect(elements[0].stroke_width).toBe('8px'); // High contrast
    });

    it('should create standard subtitles for other niches', () => {
      const request: VideoRenderRequest = {
        templateId: '',
        format: ContentFormat.SHORTS,
        niche: NicheType.TECH_AI,
        title: 'Test',
        script: 'Test',
        voiceoverText: 'This is a test. Multiple sentences. For testing.',
        imagePrompts: [],
        language: 'ko',
      };

      const duration = 45;
      const elements = service['createStandardSubtitles'](request, duration, 1080, 1920);

      expect(elements.length).toBe(3); // 3 sentences
      expect(elements[0].type).toBe('text');
      expect(elements[0].font_size).toBe('48px'); // Standard size
    });

    it('should create audio element', () => {
      const audioUrl = 'https://example.com/audio.mp3';
      const duration = 45;

      const element = service['createAudioElement'](audioUrl, duration);

      expect(element.type).toBe('audio');
      expect(element.track).toBe(4);
      expect(element.source).toBe(audioUrl);
      expect(element.duration).toBe(duration);
      expect(element.volume).toBe(1.0);
    });

    it('should create branding elements', () => {
      const request: VideoRenderRequest = {
        templateId: '',
        format: ContentFormat.SHORTS,
        niche: NicheType.SENIOR_HEALTH,
        title: 'Test',
        script: 'Test',
        voiceoverText: 'Test',
        imagePrompts: [],
        language: 'ko',
      };

      const duration = 45;
      const elements = service['createBrandingElements'](request, duration, 1080, 1920, true);

      expect(elements.length).toBeGreaterThan(0);
      expect(elements[0].type).toBe('text');
      expect(elements[0].track).toBe(5);
      expect(elements[0].text).toBe('TubeGenius AI');
      expect(elements[0].opacity).toBe(0.7);
    });
  });

  describe('Helper methods', () => {
    it('should estimate duration from text', () => {
      const text = 'This is a test voiceover text with multiple words to estimate duration';
      const duration = service['estimateDuration'](text);

      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeGreaterThanOrEqual(10); // Minimum 10 seconds
    });

    it('should get background color for each niche', () => {
      expect(service['getBackgroundColor'](NicheType.SENIOR_HEALTH)).toBe('#4A90A4');
      expect(service['getBackgroundColor'](NicheType.FINANCE)).toBe('#1E3A5F');
      expect(service['getBackgroundColor'](NicheType.TECH_AI)).toBe('#0D1117');
      expect(service['getBackgroundColor'](NicheType.HISTORY)).toBe('#2F2F2F');
      expect(service['getBackgroundColor'](NicheType.COMMERCE)).toBe('#2C3E50');
    });
  });

  describe('Error handling', () => {
    it('should throw error when API key is missing', () => {
      mockConfigService.get.mockReturnValueOnce(''); // Empty API key

      const serviceWithoutKey = new VideoService(configService);

      expect(() => serviceWithoutKey['validateApiKey']()).toThrow();
    });
  });

  describe('Integration with video-templates constants', () => {
    it('should use correct typography settings for Senior Health', async () => {
      const { getTypographySettings } = await import('@tubegenius/shared');
      const settings = getTypographySettings(NicheType.SENIOR_HEALTH);

      expect(settings.titleFont.size.shorts).toBe(80);
      expect(settings.subtitleFont.size.shorts).toBe(72);
      expect(settings.wordsPerSegment).toBe(3);
    });

    it('should use correct color scheme for Finance', async () => {
      const { getColorScheme } = await import('@tubegenius/shared');
      const colors = getColorScheme(NicheType.FINANCE);

      expect(colors.primary).toBe('#1E3A5F');
      expect(colors.secondary).toBe('#4CAF50');
    });

    it('should estimate rendering cost correctly', async () => {
      const { estimateRenderingCost } = await import('@tubegenius/shared');

      const shortsCost = estimateRenderingCost(45, 'STANDARD');
      const longFormCost = estimateRenderingCost(480, 'STANDARD');

      expect(shortsCost).toBe(45 * 0.0005); // $0.0225
      expect(longFormCost).toBe(480 * 0.0005); // $0.24
    });
  });
});
