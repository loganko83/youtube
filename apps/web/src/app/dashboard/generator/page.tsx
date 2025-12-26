/**
 * Content Generator Page - Multi-step content creation wizard
 */

'use client';

import { useState } from 'react';
import { useContentGenerationStore, useProjectStore } from '@/lib/store';
import { useProjects, useCreateContent } from '@/lib/hooks';

type NicheType = 'finance' | 'senior_health' | 'tech_ai' | 'history' | 'commerce';
type ContentFormat = 'shorts' | 'long_form';
type ToneType = 'informative' | 'entertaining' | 'educational' | 'storytelling' | 'professional';

// Step configuration
const STEPS = [
  { id: 1, name: '프로젝트 선택', description: '콘텐츠를 생성할 프로젝트를 선택하세요' },
  { id: 2, name: '주제 설정', description: '니치와 주제를 입력하세요' },
  { id: 3, name: '스타일 설정', description: '톤, 형식, 언어를 선택하세요' },
  { id: 4, name: '검토 및 생성', description: '설정을 확인하고 생성하세요' },
] as const;

const NICHE_OPTIONS: { value: NicheType; label: string; icon: string }[] = [
  { value: 'finance', label: '금융/투자', icon: '💰' },
  { value: 'senior_health', label: '시니어 건강', icon: '❤️' },
  { value: 'tech_ai', label: '테크/AI', icon: '🤖' },
  { value: 'history', label: '역사', icon: '📜' },
  { value: 'commerce', label: '커머스', icon: '🛒' },
];

const FORMAT_OPTIONS: { value: ContentFormat; label: string; description: string }[] = [
  { value: 'shorts', label: 'Shorts', description: '60초 이하 세로 영상 (9:16)' },
  { value: 'long_form', label: 'Long-form', description: '5-15분 가로 영상 (16:9)' },
];

const TONE_OPTIONS: { value: ToneType; label: string }[] = [
  { value: 'informative', label: '정보 전달' },
  { value: 'entertaining', label: '엔터테인먼트' },
  { value: 'educational', label: '교육적' },
  { value: 'storytelling', label: '스토리텔링' },
  { value: 'professional', label: '전문적' },
];

const LANGUAGE_OPTIONS = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
];

export default function GeneratorPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const { config, updateConfig, reset } = useContentGenerationStore();
  const { selectProject } = useProjectStore();
  const { data: projectsData, isLoading: projectsLoading } = useProjects();
  const createContent = useCreateContent();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContentId, setGeneratedContentId] = useState<string | null>(null);

  const projects = projectsData?.items || [];

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    selectProject(projectId);
  };

  const handleNextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedProjectId !== null;
      case 2:
        return config.niche && config.topic && config.topic.trim().length > 0;
      case 3:
        return config.tone && config.format && config.language;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleGenerate = async () => {
    if (!selectedProjectId) return;

    setIsGenerating(true);
    try {
      const result = await createContent.mutateAsync({
        projectId: selectedProjectId,
        title: config.topic,
        config: {
          niche: config.niche,
          topic: config.topic,
          tone: config.tone,
          format: config.format,
          language: config.language,
        },
      });
      setGeneratedContentId(result.id);
    } catch (error) {
      console.error('Content generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    reset();
    setSelectedProjectId(null);
    setCurrentStep(1);
    setGeneratedContentId(null);
  };

  // If content was generated, show success state
  if (generatedContentId) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            콘텐츠 생성이 시작되었습니다!
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            AI가 스크립트를 생성하고 있습니다. 잠시 후 대시보드에서 확인하세요.
          </p>
          <div className="flex justify-center space-x-4">
            <a
              href={`/dashboard/contents/${generatedContentId}`}
              className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              콘텐츠 상세 보기
            </a>
            <button
              onClick={handleReset}
              className="inline-flex items-center px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              새 콘텐츠 생성
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          콘텐츠 생성
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          AI로 YouTube 영상 스크립트와 콘텐츠를 생성하세요
        </p>
      </div>

      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm transition-colors ${
                    currentStep > step.id
                      ? 'bg-blue-600 text-white'
                      : currentStep === step.id
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {currentStep > step.id ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </div>
                <span className={`mt-2 text-xs font-medium ${
                  currentStep >= step.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {step.name}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`w-full h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                  style={{ width: '80px' }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {/* Step 1: Project Selection */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {STEPS[0].name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {STEPS[0].description}
              </p>

              {projectsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse h-20 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                  ))}
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <p className="mt-4 text-gray-500 dark:text-gray-400">프로젝트가 없습니다</p>
                  <a
                    href="/dashboard/projects/new"
                    className="inline-flex items-center mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    프로젝트 만들기 →
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => handleProjectSelect(project.id)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                        selectedProjectId === project.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {project.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {project.description || '설명 없음'}
                          </p>
                        </div>
                        {selectedProjectId === project.id && (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Topic Selection */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {STEPS[1].name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {STEPS[1].description}
              </p>

              <div className="space-y-6">
                {/* Niche selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    니치 (Niche)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {NICHE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateConfig({ niche: option.value })}
                        className={`p-3 rounded-lg border-2 text-center transition-colors ${
                          config.niche === option.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <span className="text-2xl block mb-1">{option.icon}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Topic input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    주제 (Topic)
                  </label>
                  <input
                    type="text"
                    value={config.topic}
                    onChange={(e) => updateConfig({ topic: e.target.value })}
                    placeholder="예: 2024년 최고의 적금 상품 비교"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    구체적인 주제를 입력할수록 더 좋은 스크립트가 생성됩니다
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Style Settings */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {STEPS[2].name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {STEPS[2].description}
              </p>

              <div className="space-y-6">
                {/* Format selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    영상 형식
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {FORMAT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateConfig({ format: option.value })}
                        className={`p-4 rounded-lg border-2 text-left transition-colors ${
                          config.format === option.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <span className="block text-lg font-semibold text-gray-900 dark:text-white">
                          {option.label}
                        </span>
                        <span className="block text-sm text-gray-500 dark:text-gray-400">
                          {option.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tone selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    톤 (Tone)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TONE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateConfig({ tone: option.value })}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          config.tone === option.value
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    언어
                  </label>
                  <div className="flex gap-3">
                    {LANGUAGE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateConfig({ language: option.value as 'ko' | 'en' })}
                        className={`px-6 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                          config.language === option.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {STEPS[3].name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {STEPS[3].description}
              </p>

              <div className="space-y-4">
                {/* Summary */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">프로젝트</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {projects.find((p) => p.id === selectedProjectId)?.name || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">니치</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {NICHE_OPTIONS.find((n) => n.value === config.niche)?.label || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">주제</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">
                      {config.topic || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">형식</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {FORMAT_OPTIONS.find((f) => f.value === config.format)?.label || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">톤</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {TONE_OPTIONS.find((t) => t.value === config.tone)?.label || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">언어</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {LANGUAGE_OPTIONS.find((l) => l.value === config.language)?.label || '-'}
                    </span>
                  </div>
                </div>

                {/* Safety notice */}
                <div className="flex items-start p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      안전 검사
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      생성된 콘텐츠는 AI 안전 필터를 통해 검토됩니다. 건강, 금융 관련 콘텐츠는 추가 검증이 필요합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handlePrevStep}
              disabled={currentStep === 1}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                currentStep === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              이전
            </button>

            {currentStep < STEPS.length ? (
              <button
                onClick={handleNextStep}
                disabled={!canProceed()}
                className={`inline-flex items-center px-6 py-2 text-sm font-medium rounded-lg transition-colors ${
                  canProceed()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                다음
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className={`inline-flex items-center px-6 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isGenerating
                    ? 'bg-blue-400 cursor-wait'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                {isGenerating ? (
                  <>
                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    생성 중...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    AI 콘텐츠 생성
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
