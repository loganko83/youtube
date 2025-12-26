'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { GenerationWizard } from '@/components/generation-wizard';
import { Card, CardHeader, CardTitle, CardContent } from '@tubegenius/ui';
import { useAppStore } from '@/store';
import type { ContentConfig, GeneratedContent } from '@tubegenius/shared';
import { CheckCircle2, AlertCircle } from 'lucide-react';

async function generateContent(config: ContentConfig): Promise<GeneratedContent> {
  // TODO: Replace with actual API call
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    throw new Error('콘텐츠 생성에 실패했습니다.');
  }

  return response.json();
}

export default function GeneratorPage() {
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const { resetWizard } = useAppStore();

  const { mutate: generate, isPending } = useMutation({
    mutationFn: generateContent,
    onSuccess: (data) => {
      setGeneratedContent(data);
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const handleGenerate = (config: ContentConfig) => {
    generate(config);
  };

  const handleReset = () => {
    setGeneratedContent(null);
    resetWizard();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">콘텐츠 생성</h1>
        <p className="text-gray-600 mt-1">
          AI를 활용하여 YouTube 콘텐츠를 자동으로 생성하세요
        </p>
      </div>

      {!generatedContent ? (
        /* Wizard */
        <GenerationWizard onGenerate={handleGenerate} isGenerating={isPending} />
      ) : (
        /* Generated Content Display */
        <div className="space-y-6">
          {/* Safety Report */}
          {!generatedContent.safetyReport.passed && (
            <Card className="border-yellow-300 bg-yellow-50">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <CardTitle className="text-yellow-900">안전 검토 필요</CardTitle>
                    <ul className="mt-2 space-y-1 text-sm text-yellow-800">
                      {generatedContent.safetyReport.issues.map((issue, idx) => (
                        <li key={idx}>• {issue.description}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}

          {generatedContent.safetyReport.passed && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <CardTitle className="text-green-900">안전 검증 통과</CardTitle>
                </div>
              </CardHeader>
            </Card>
          )}

          {/* Content Preview */}
          <Card>
            <CardHeader>
              <CardTitle>{generatedContent.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">스크립트</h3>
                <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap text-sm">
                  {generatedContent.script}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">음성 텍스트</h3>
                <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap text-sm">
                  {generatedContent.voiceoverText}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">메타데이터</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>설명:</strong> {generatedContent.metadata.description}</p>
                  <p>
                    <strong>태그:</strong>{' '}
                    {generatedContent.metadata.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block bg-tube-100 text-tube-700 px-2 py-1 rounded mr-2 mb-1"
                      >
                        {tag}
                      </span>
                    ))}
                  </p>
                  {generatedContent.metadata.estimatedDuration && (
                    <p>
                      <strong>예상 길이:</strong> {generatedContent.metadata.estimatedDuration}초
                    </p>
                  )}
                </div>
              </div>

              {generatedContent.criticalClaims.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">검증이 필요한 주장</h3>
                  <div className="space-y-2">
                    {generatedContent.criticalClaims.map((claim, idx) => (
                      <div key={idx} className="bg-yellow-50 border border-yellow-200 p-3 rounded text-sm">
                        <p className="font-medium">{claim.text}</p>
                        <p className="text-gray-600 mt-1">
                          신뢰도: {claim.confidence}%
                          {claim.source && ` • 출처: ${claim.source}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {generatedContent.safetyReport.disclaimerRequired && (
                <div>
                  <h3 className="font-semibold mb-2">면책조항</h3>
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded text-sm">
                    {generatedContent.safetyReport.disclaimerText}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              새로 생성
            </button>
            <button
              onClick={() => {
                // TODO: Implement save functionality
                alert('저장 기능은 백엔드 구현 후 활성화됩니다.');
              }}
              className="px-6 py-3 bg-tube-600 text-white rounded-lg hover:bg-tube-700 transition-colors"
            >
              저장하고 계속
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
