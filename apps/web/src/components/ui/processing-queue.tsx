/**
 * Processing Queue Component
 * Shows floating indicator of contents being processed
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useContents } from '@/lib/hooks';

const processingStatuses = [
  'pending',
  'script_generating',
  'tts_processing',
  'tts_generating',
  'video_rendering',
  'uploading',
];

const statusLabels: Record<string, string> = {
  pending: '대기 중',
  script_generating: '스크립트 생성',
  tts_processing: 'TTS 생성',
  tts_generating: 'TTS 생성',
  video_rendering: '비디오 렌더링',
  uploading: '업로드 중',
};

const statusProgress: Record<string, number> = {
  pending: 10,
  script_generating: 25,
  tts_processing: 45,
  tts_generating: 45,
  video_rendering: 70,
  uploading: 90,
};

export function ProcessingQueue() {
  const [isOpen, setIsOpen] = useState(false);
  const { data } = useContents(undefined, 1, 50);

  const processingContents = data?.items?.filter((content) =>
    processingStatuses.includes(content.status)
  ) ?? [];

  if (processingContents.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {/* Expanded panel */}
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              처리 중인 콘텐츠 ({processingContents.length})
            </h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {processingContents.map((content) => (
              <Link
                key={content.id}
                href={`/dashboard/contents/${content.id}`}
                className="block p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-48">
                    {content.title || '제목 없음'}
                  </span>
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    {statusLabels[content.status] ?? content.status}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${statusProgress[content.status] ?? 0}%` }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all
          ${isOpen
            ? 'bg-blue-600 text-white'
            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
          }
        `}
      >
        <div className="relative">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <span className="text-sm font-medium">
          {processingContents.length}개 처리 중
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
}
