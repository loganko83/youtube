'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@tubegenius/ui';
import { cn } from '@tubegenius/ui';
import { useAppStore } from '@/store';
import {
  NicheType,
  ContentFormat,
  ToneType,
  type ContentConfig,
} from '@tubegenius/shared';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface GenerationWizardProps {
  onGenerate: (config: ContentConfig) => void;
  isGenerating?: boolean;
}

const steps = [
  { id: 0, title: '버티컬 선택', description: '콘텐츠 주제를 선택하세요' },
  { id: 1, title: '콘텐츠 설정', description: '세부 사항을 입력하세요' },
  { id: 2, title: '톤 & 형식', description: '스타일을 선택하세요' },
] as const;

const niches = [
  { value: NicheType.SENIOR_HEALTH, label: '시니어 건강', description: '건강 정보와 웰빙' },
  { value: NicheType.FINANCE, label: '금융 & 투자', description: '재테크와 투자 전략' },
  { value: NicheType.TECH_AI, label: 'Tech & AI', description: 'IT 및 AI 리뷰' },
  { value: NicheType.HISTORY, label: '역사', description: '역사 스토리텔링' },
  { value: NicheType.COMMERCE, label: '상품 리뷰', description: '제품 리뷰 및 추천' },
];

const tones = [
  { value: ToneType.PROFESSIONAL, label: '전문적', icon: '💼' },
  { value: ToneType.FRIENDLY, label: '친근한', icon: '😊' },
  { value: ToneType.MYSTERIOUS, label: '신비로운', icon: '🔮' },
  { value: ToneType.URGENT, label: '긴급한', icon: '⚡' },
];

const formats = [
  { value: ContentFormat.SHORTS, label: 'Shorts', description: '60초 이하 짧은 영상' },
  { value: ContentFormat.LONG_FORM, label: '롱폼', description: '5-15분 길이 영상' },
];

export function GenerationWizard({ onGenerate, isGenerating }: GenerationWizardProps) {
  const { wizardStep, setWizardStep } = useAppStore();
  const [config, setConfig] = useState<Partial<ContentConfig>>({
    language: 'ko',
  });

  const currentStep = steps[wizardStep] ?? steps[0];
  const isLastStep = wizardStep === steps.length - 1;
  const canProceed = () => {
    switch (wizardStep) {
      case 0:
        return !!config.niche;
      case 1:
        return !!config.topic;
      case 2:
        return !!config.tone && !!config.format;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (isLastStep && canProceed()) {
      onGenerate(config as ContentConfig);
    } else if (canProceed()) {
      setWizardStep(wizardStep + 1);
    }
  };

  const handleBack = () => {
    if (wizardStep > 0) {
      setWizardStep(wizardStep - 1);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                'flex items-center',
                index < steps.length - 1 && 'flex-1'
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-semibold',
                  index === wizardStep
                    ? 'bg-tube-600 text-white'
                    : index < wizardStep
                    ? 'bg-tube-200 text-tube-700'
                    : 'bg-gray-200 text-gray-500'
                )}
              >
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-1 mx-2',
                    index < wizardStep ? 'bg-tube-600' : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <CardTitle>{currentStep.title}</CardTitle>
        <CardDescription>{currentStep.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step 0: Niche Selection */}
        {wizardStep === 0 && (
          <div className="grid md:grid-cols-2 gap-4">
            {niches.map((niche) => (
              <button
                key={niche.value}
                onClick={() => setConfig({ ...config, niche: niche.value })}
                className={cn(
                  'p-4 border-2 rounded-lg text-left transition-all hover:shadow-md',
                  config.niche === niche.value
                    ? 'border-tube-600 bg-tube-50'
                    : 'border-gray-200 hover:border-tube-300'
                )}
              >
                <div className="font-semibold text-lg mb-1">{niche.label}</div>
                <div className="text-sm text-gray-600">{niche.description}</div>
              </button>
            ))}
          </div>
        )}

        {/* Step 1: Content Configuration */}
        {wizardStep === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                콘텐츠 주제 *
              </label>
              <input
                type="text"
                value={config.topic || ''}
                onChange={(e) => setConfig({ ...config, topic: e.target.value })}
                placeholder="예: 노년층을 위한 건강한 식습관"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tube-600 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Step 2: Tone & Format */}
        {wizardStep === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                톤 선택 *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {tones.map((tone) => (
                  <button
                    key={tone.value}
                    onClick={() => setConfig({ ...config, tone: tone.value })}
                    className={cn(
                      'p-4 border-2 rounded-lg text-center transition-all',
                      config.tone === tone.value
                        ? 'border-tube-600 bg-tube-50'
                        : 'border-gray-200 hover:border-tube-300'
                    )}
                  >
                    <div className="text-3xl mb-2">{tone.icon}</div>
                    <div className="text-sm font-medium">{tone.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                형식 선택 *
              </label>
              <div className="grid md:grid-cols-2 gap-4">
                {formats.map((format) => (
                  <button
                    key={format.value}
                    onClick={() => setConfig({ ...config, format: format.value })}
                    className={cn(
                      'p-4 border-2 rounded-lg text-left transition-all',
                      config.format === format.value
                        ? 'border-tube-600 bg-tube-50'
                        : 'border-gray-200 hover:border-tube-300'
                    )}
                  >
                    <div className="font-semibold text-lg mb-1">{format.label}</div>
                    <div className="text-sm text-gray-600">{format.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={wizardStep === 0 || isGenerating}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            이전
          </Button>
          <Button
            variant="tube"
            onClick={handleNext}
            disabled={!canProceed() || isGenerating}
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                생성 중...
              </>
            ) : isLastStep ? (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                콘텐츠 생성
              </>
            ) : (
              <>
                다음
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
