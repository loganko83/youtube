/**
 * Content Detail Page - View and manage individual content
 */

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useContent, useDeleteContent } from '@/lib/hooks';

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: '대기 중', color: 'text-gray-700 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-700' },
  script_generating: { label: '스크립트 생성 중', color: 'text-blue-700 dark:text-blue-300', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  tts_processing: { label: 'TTS 생성 중', color: 'text-indigo-700 dark:text-indigo-300', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30' },
  tts_generating: { label: 'TTS 생성 중', color: 'text-indigo-700 dark:text-indigo-300', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30' },
  video_rendering: { label: '비디오 렌더링 중', color: 'text-purple-700 dark:text-purple-300', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  uploading: { label: 'YouTube 업로드 중', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  completed: { label: '완료', color: 'text-green-700 dark:text-green-300', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  failed: { label: '실패', color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  tts_failed: { label: 'TTS 실패', color: 'text-orange-700 dark:text-orange-300', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  published: { label: '게시됨', color: 'text-emerald-700 dark:text-emerald-300', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' },
};

function ContentSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8" />
      <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-xl mb-6" />
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
      </div>
    </div>
  );
}

export default function ContentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contentId = params.id as string;
  const { data: content, isLoading, error } = useContent(contentId);
  const deleteContent = useDeleteContent();
  const [activeTab, setActiveTab] = useState<'script' | 'claims' | 'metadata'>('script');

  const handleDelete = async () => {
    if (confirm('정말 이 콘텐츠를 삭제하시겠습니까?')) {
      try {
        await deleteContent.mutateAsync(contentId);
        router.push('/dashboard/contents');
      } catch (error) {
        console.error('Failed to delete content:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <ContentSkeleton />
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="p-6 text-center py-12">
        <svg className="w-12 h-12 mx-auto text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="mt-4 text-gray-500 dark:text-gray-400">
          콘텐츠를 찾을 수 없습니다
        </p>
        <Link
          href="/dashboard/contents"
          className="inline-flex items-center mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← 콘텐츠 목록으로
        </Link>
      </div>
    );
  }

  const status = statusConfig[content.status] ?? { label: '대기 중', color: 'text-gray-700', bgColor: 'bg-gray-100' };
  const script = content.generatedScript?.script || [];
  const claims = content.generatedScript?.criticalClaims || [];
  const metadata = content.generatedScript?.metadata || {};

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
              대시보드
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li>
            <Link href="/dashboard/contents" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
              콘텐츠
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 dark:text-white font-medium truncate max-w-xs">
            {content.title || '제목 없음'}
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {content.title || '제목 없음'}
            </h1>
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${status.color} ${status.bgColor}`}>
              {status.label}
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            {content.project?.name || '프로젝트 미지정'} · {new Date(content.createdAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {content.status === 'completed' && (
            <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              YouTube 업로드
            </button>
          )}
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            삭제
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video preview */}
          {content.videoUrl ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="aspect-video bg-gray-900">
                <video
                  src={content.videoUrl}
                  controls
                  className="w-full h-full"
                  poster={content.thumbnailUrl || undefined}
                />
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                <div className="text-center">
                  {content.status === 'video_rendering' ? (
                    <>
                      <svg className="w-16 h-16 mx-auto text-purple-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <p className="mt-4 text-gray-500 dark:text-gray-400">비디오 렌더링 중...</p>
                    </>
                  ) : (
                    <>
                      <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <p className="mt-4 text-gray-500 dark:text-gray-400">비디오가 아직 생성되지 않았습니다</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex -mb-px">
                {(['script', 'claims', 'metadata'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-4 text-center text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    {tab === 'script' && '스크립트'}
                    {tab === 'claims' && `주요 주장 (${claims.length})`}
                    {tab === 'metadata' && '메타데이터'}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* Script tab */}
              {activeTab === 'script' && (
                <div className="space-y-4">
                  {script.length > 0 ? (
                    script.map((section: { type: string; content: string }, index: number) => (
                      <div key={index} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <span className="inline-block px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 rounded mb-2">
                          {section.type || `섹션 ${index + 1}`}
                        </span>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {section.content}
                        </p>
                      </div>
                    ))
                  ) : content.generatedScript?.voiceoverText ? (
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {content.generatedScript.voiceoverText}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      스크립트가 아직 생성되지 않았습니다
                    </p>
                  )}
                </div>
              )}

              {/* Claims tab */}
              {activeTab === 'claims' && (
                <div className="space-y-4">
                  {claims.length > 0 ? (
                    claims.map((claim: { claim: string; confidence: number; source?: string }, index: number) => (
                      <div key={index} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-gray-700 dark:text-gray-300 flex-1">
                            {claim.claim}
                          </p>
                          <span className={`ml-4 px-2 py-0.5 text-xs font-medium rounded ${
                            claim.confidence >= 80
                              ? 'bg-green-100 text-green-700'
                              : claim.confidence >= 60
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            신뢰도 {claim.confidence}%
                          </span>
                        </div>
                        {claim.source && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            출처: {claim.source}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      주요 주장이 없습니다
                    </p>
                  )}
                </div>
              )}

              {/* Metadata tab */}
              {activeTab === 'metadata' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">예상 길이</p>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {metadata.duration || '-'}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">언어</p>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {content.config?.language === 'ko' ? '한국어' : 'English'}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">형식</p>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {content.config?.format === 'shorts' ? 'Shorts (9:16)' : 'Long-form (16:9)'}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">톤</p>
                      <p className="text-gray-900 dark:text-white font-medium capitalize">
                        {content.config?.tone || '-'}
                      </p>
                    </div>
                  </div>
                  {metadata.description && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">설명</p>
                      <p className="text-gray-700 dark:text-gray-300">
                        {metadata.description}
                      </p>
                    </div>
                  )}
                  {metadata.tags && metadata.tags.length > 0 && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">태그</p>
                      <div className="flex flex-wrap gap-2">
                        {metadata.tags.map((tag: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progress card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              진행 상태
            </h3>
            <div className="space-y-4">
              {['스크립트 생성', 'TTS 변환', '비디오 렌더링', 'YouTube 업로드'].map((step, index) => {
                const stepStatus = getStepStatus(content.status, index);
                return (
                  <div key={index} className="flex items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                      stepStatus === 'completed' ? 'bg-green-100 text-green-600' :
                      stepStatus === 'current' ? 'bg-blue-100 text-blue-600' :
                      stepStatus === 'failed' ? 'bg-red-100 text-red-600' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {stepStatus === 'completed' ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : stepStatus === 'current' ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : stepStatus === 'failed' ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : (
                        <span className="w-2 h-2 bg-gray-300 rounded-full" />
                      )}
                    </div>
                    <span className={`text-sm ${
                      stepStatus === 'completed' ? 'text-green-600' :
                      stepStatus === 'current' ? 'text-blue-600 font-medium' :
                      stepStatus === 'failed' ? 'text-red-600' :
                      'text-gray-400'
                    }`}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Config card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              생성 설정
            </h3>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500 dark:text-gray-400">니치</dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white">
                  {content.config?.niche || '-'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500 dark:text-gray-400">주제</dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-32">
                  {content.config?.topic || '-'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500 dark:text-gray-400">형식</dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white">
                  {content.config?.format === 'shorts' ? 'Shorts' : 'Long-form'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500 dark:text-gray-400">톤</dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {content.config?.tone || '-'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Safety report */}
          {content.generatedScript?.safetyReport && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                안전 보고서
              </h3>
              <div className={`p-3 rounded-lg ${
                content.generatedScript.safetyReport.passed
                  ? 'bg-green-50 dark:bg-green-900/20'
                  : 'bg-yellow-50 dark:bg-yellow-900/20'
              }`}>
                <div className="flex items-center">
                  {content.generatedScript.safetyReport.passed ? (
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-yellow-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                  <span className={`text-sm font-medium ${
                    content.generatedScript.safetyReport.passed
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-yellow-700 dark:text-yellow-300'
                  }`}>
                    {content.generatedScript.safetyReport.passed ? '안전 검사 통과' : '검토 필요'}
                  </span>
                </div>
                {content.generatedScript.safetyReport.flags && content.generatedScript.safetyReport.flags.length > 0 && (
                  <ul className="mt-2 text-xs text-yellow-700 dark:text-yellow-300 list-disc list-inside">
                    {content.generatedScript.safetyReport.flags.map((flag: string, index: number) => (
                      <li key={index}>{flag}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getStepStatus(contentStatus: string, stepIndex: number): 'completed' | 'current' | 'pending' | 'failed' {
  const statusSteps: Record<string, number> = {
    pending: 0,
    script_generating: 0,
    tts_processing: 1,
    tts_generating: 1,
    tts_failed: 1,
    video_rendering: 2,
    uploading: 3,
    completed: 4,
    published: 4,
    failed: -1,
  };

  const currentStep = statusSteps[contentStatus] ?? -1;

  if (contentStatus === 'failed') {
    return stepIndex === 0 ? 'failed' : 'pending';
  }
  if (contentStatus === 'tts_failed') {
    if (stepIndex === 0) return 'completed';
    if (stepIndex === 1) return 'failed';
    return 'pending';
  }

  if (stepIndex < currentStep) return 'completed';
  if (stepIndex === currentStep) return 'current';
  return 'pending';
}
