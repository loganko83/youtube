import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Type } from '@google/genai';

interface GeneratedScript {
  title: string;
  script: string;
  voiceoverText: string;
  imagePrompts: string[];
  criticalClaims: Array<{ text: string; confidence: number }>;
  metadata: {
    description: string;
    tags: string[];
  };
  safetyReport?: {
    passed: boolean;
    warnings: string[];
  };
}

interface CostMetrics {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number; // in USD
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey: string;
  private readonly genAI: GoogleGenAI;
  private readonly modelName = 'gemini-2.0-flash';
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // ms

  // Pricing for gemini-2.0-flash (as of 2024)
  // Input: $0.075 per 1M tokens, Output: $0.30 per 1M tokens
  private readonly INPUT_COST_PER_1M = 0.075;
  private readonly OUTPUT_COST_PER_1M = 0.3;

  // Forbidden topics for safety pre-check
  private readonly FORBIDDEN_TOPICS = [
    'gambling',
    'casino',
    'betting',
    'adult content',
    'pornography',
    'illegal drugs',
    'drug trafficking',
    'violence',
    'terrorism',
    'hate speech',
    'scam',
    'ponzi',
    'pyramid scheme',
  ];

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('GEMINI_API_KEY') || '';
    if (!this.apiKey) {
      this.logger.warn('GEMINI_API_KEY is not set. Service will not function.');
    }
    this.genAI = new GoogleGenAI({ apiKey: this.apiKey });
  }

  async generateScript(
    contentConfig: any,
  ): Promise<GeneratedScript & { costMetrics: CostMetrics }> {
    const { niche, topic, tone, format, language = 'ko' } = contentConfig;

    // Safety pre-check
    const safetyCheck = this.performSafetyPreCheck(topic, niche);
    if (!safetyCheck.passed) {
      throw new BadRequestException({
        message: 'Content topic contains forbidden elements',
        warnings: safetyCheck.warnings,
      });
    }

    const systemPrompt = this.buildSystemPrompt(niche, tone, format, language);
    const userPrompt = this.buildUserPrompt(topic, format, language);

    try {
      const result = await this.callGeminiAPIWithRetry(
        systemPrompt,
        userPrompt,
      );

      return {
        ...result.content,
        safetyReport: safetyCheck,
        costMetrics: result.costMetrics,
      };
    } catch (error) {
      this.logger.error('Gemini API call failed:', error);
      throw error;
    }
  }

  /**
   * Safety pre-check to filter forbidden topics
   */
  private performSafetyPreCheck(
    topic: string,
    niche: string,
  ): { passed: boolean; warnings: string[] } {
    const warnings: string[] = [];
    const topicLower = topic.toLowerCase();

    // Check for forbidden topics
    for (const forbidden of this.FORBIDDEN_TOPICS) {
      if (topicLower.includes(forbidden)) {
        warnings.push(`Topic contains forbidden keyword: ${forbidden}`);
      }
    }

    // Special checks for senior health niche
    if (niche === 'Senior Health' || niche === 'senior_health') {
      const sensitiveHealthClaims = [
        'cure cancer',
        'cure diabetes',
        'miracle cure',
        'guaranteed results',
        '100% effective',
      ];

      for (const claim of sensitiveHealthClaims) {
        if (topicLower.includes(claim)) {
          warnings.push(
            `Potentially misleading health claim detected: ${claim}`,
          );
        }
      }
    }

    return {
      passed: warnings.length === 0,
      warnings,
    };
  }

  /**
   * Build user prompt based on language
   */
  private buildUserPrompt(
    topic: string,
    format: string,
    language: string,
  ): string {
    const isShorts = format === 'Shorts';
    const duration = isShorts ? '60초 이내' : '5분 이상';
    const formatType = isShorts ? '숏폼' : '롱폼';

    if (language === 'ko') {
      return `주제: ${topic}\n\n위 주제에 대한 ${duration} ${formatType} 영상 스크립트를 생성해주세요.

스크립트는 반드시 Hook-Body-CTA 구조로 작성하고, 각 장면마다 시각적 이미지 프롬프트를 제공해주세요.`;
    } else {
      return `Topic: ${topic}\n\nGenerate a ${isShorts ? '60-second short-form' : '5+ minute long-form'} video script for this topic.

The script must follow the Hook-Body-CTA structure and provide visual image prompts for each scene.`;
    }
  }

  private buildSystemPrompt(
    niche: string,
    tone: string,
    format: string,
    language: string,
  ): string {
    const nicheInstructions = this.getNicheInstructions(niche, language);
    const isKorean = language === 'ko';

    if (isKorean) {
      return `당신은 ${niche} 분야의 전문 유튜브 콘텐츠 작가입니다.

${nicheInstructions}

톤: ${tone}
형식: ${format}
언어: ${language}

**스크립트 구조 요구사항:**
1. Hook (첫 3-5초): 시청자의 주목을 끄는 강력한 질문이나 문제 제기
2. Body (메인 콘텐츠): 명확한 정보 전달, 구체적인 예시 포함
3. CTA (마무리): 구독/좋아요/댓글 유도

**중요 주의사항:**
- 모든 주장은 검증 가능해야 합니다
- 과장되거나 허위 정보를 포함하지 마세요
- 의료/금융 정보는 반드시 전문가 상담 권고를 포함하세요
- 시청자에게 실질적인 가치를 제공하세요

스크립트의 각 장면마다 영어로 작성된 이미지 프롬프트를 제공하세요 (AI 이미지 생성 도구에 사용).`;
    } else {
      return `You are a professional YouTube content writer specializing in ${niche}.

${nicheInstructions}

Tone: ${tone}
Format: ${format}
Language: ${language}

**Script Structure Requirements:**
1. Hook (first 3-5 seconds): A powerful question or problem statement to grab attention
2. Body (main content): Clear information delivery with specific examples
3. CTA (closing): Encourage subscription/likes/comments

**Important Guidelines:**
- All claims must be verifiable
- Avoid exaggerated or false information
- Medical/financial information must include professional consultation advice
- Provide real value to viewers

Provide image prompts in English for each scene (for AI image generation tools).`;
    }
  }

  private getNicheInstructions(niche: string, language: string): string {
    const isKorean = language === 'ko';

    const koreanInstructions: Record<string, string> = {
      'Senior Health': `
- 60대 이상 시청자를 위한 쉬운 언어 사용
- 의학 전문용어 대신 일상 용어 사용
- 실천 가능한 건강 팁 제공
- 과장된 효과 주장 금지
- 반드시 의료 전문가 상담 권고 포함`,
      'Finance & Investing': `
- 투자 리스크 명확히 고지
- 과거 수익률이 미래를 보장하지 않음 언급
- 객관적 데이터 기반 분석
- 특정 종목 추천 자제`,
      'Tech & AI Reviews': `
- 최신 트렌드 반영
- 기술 개념을 쉽게 설명
- 실제 사용 경험 기반
- 장단점 균형있게 제시`,
      'History & Storytelling': `
- 스토리텔링 기법 활용
- 역사적 사실 정확성 유지
- 흥미로운 일화 포함
- 현재와의 연결점 제시`,
      'Product Reviews': `
- 솔직한 장단점 분석
- 실제 사용 경험 기반
- 가성비 평가 포함
- 제휴 관계 투명하게 공개`,
    };

    const englishInstructions: Record<string, string> = {
      'Senior Health': `
- Use simple language for 60+ audience
- Avoid medical jargon, use everyday terms
- Provide actionable health tips
- No exaggerated claims
- Must include professional consultation advice`,
      'Finance & Investing': `
- Clearly disclose investment risks
- Note that past returns don't guarantee future results
- Use objective data-based analysis
- Avoid specific stock recommendations`,
      'Tech & AI Reviews': `
- Reflect latest trends
- Explain technical concepts simply
- Base on actual usage experience
- Present pros and cons balanced`,
      'History & Storytelling': `
- Use storytelling techniques
- Maintain historical accuracy
- Include interesting anecdotes
- Connect to present day`,
      'Product Reviews': `
- Honest pros and cons analysis
- Based on actual usage
- Include value assessment
- Transparently disclose affiliations`,
    };

    const instructions = isKorean ? koreanInstructions : englishInstructions;
    return instructions[niche] || '';
  }

  /**
   * Call Gemini API with retry logic
   */
  private async callGeminiAPIWithRetry(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<{ content: GeneratedScript; costMetrics: CostMetrics }> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.logger.log(`Gemini API call attempt ${attempt}/${this.maxRetries}`);
        return await this.callGeminiAPI(systemPrompt, userPrompt);
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `Attempt ${attempt} failed: ${lastError.message}`,
          lastError.stack,
        );

        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          this.logger.log(`Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Gemini API call failed after retries');
  }

  /**
   * Call Gemini API with structured JSON output
   */
  private async callGeminiAPI(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<{ content: GeneratedScript; costMetrics: CostMetrics }> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    // Define JSON schema for structured output
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: 'Video title (engaging and SEO-friendly)',
        },
        script: {
          type: Type.STRING,
          description:
            'Full script with Hook-Body-CTA structure, including timestamps',
        },
        voiceoverText: {
          type: Type.STRING,
          description:
            'Clean voiceover text for TTS (no special characters, natural pronunciation)',
        },
        imagePrompts: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
          description:
            'Array of image prompts in English for each scene (for AI image generation)',
        },
        criticalClaims: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: {
                type: Type.STRING,
                description: 'Claim that needs verification',
              },
              confidence: {
                type: Type.NUMBER,
                description: 'Confidence score (0-100)',
              },
            },
            required: ['text', 'confidence'],
          },
          description: 'Claims that require fact-checking or verification',
        },
        metadata: {
          type: Type.OBJECT,
          properties: {
            description: {
              type: Type.STRING,
              description: 'Video description for YouTube',
            },
            tags: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
              description: 'Relevant tags/keywords for SEO',
            },
          },
          required: ['description', 'tags'],
        },
      },
      required: [
        'title',
        'script',
        'voiceoverText',
        'imagePrompts',
        'criticalClaims',
        'metadata',
      ],
    };

    const combinedPrompt = `${systemPrompt}\n\n---\n\n${userPrompt}`;

    const startTime = Date.now();
    const result = await this.genAI.models.generateContent({
      model: this.modelName,
      contents: combinedPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema,
        temperature: 0.8,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    });
    const endTime = Date.now();

    const text = result.text;

    // Calculate cost metrics
    const usageMetadata = result.usageMetadata;
    const inputTokens = usageMetadata?.promptTokenCount || 0;
    const outputTokens = usageMetadata?.candidatesTokenCount || 0;
    const totalTokens = usageMetadata?.totalTokenCount || 0;

    const costMetrics: CostMetrics = {
      inputTokens,
      outputTokens,
      totalTokens,
      estimatedCost:
        (inputTokens / 1_000_000) * this.INPUT_COST_PER_1M +
        (outputTokens / 1_000_000) * this.OUTPUT_COST_PER_1M,
    };

    this.logger.log(
      `Gemini API call completed in ${endTime - startTime}ms. Cost: $${costMetrics.estimatedCost.toFixed(6)}`,
    );
    this.logger.debug(
      `Token usage - Input: ${inputTokens}, Output: ${outputTokens}, Total: ${totalTokens}`,
    );

    let content: GeneratedScript;
    try {
      content = JSON.parse(text || '{}');
    } catch (parseError) {
      this.logger.error('Failed to parse Gemini response:', parseError);
      throw new Error('Invalid JSON response from Gemini API');
    }

    // Validate response structure
    if (!content.title || !content.script || !content.voiceoverText) {
      throw new Error('Incomplete response from Gemini API');
    }

    return { content, costMetrics };
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
