/**
 * Content List Component - Recent Contents Display
 */

'use client';

import Link from 'next/link';
import { cn } from '@tubegenius/ui';
import type { Content } from '@/lib/api';

interface ContentListProps {
  contents: Content[];
  isLoading?: boolean;
  emptyMessage?: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: '대기 중', color: 'bg-gray-100 text-gray-700' },
  script_generating: { label: '스크립트 생성 중', color: 'bg-blue-100 text-blue-700' },
  tts_generating: { label: 'TTS 생성 중', color: 'bg-indigo-100 text-indigo-700' },
  video_rendering: { label: '비디오 렌더링 중', color: 'bg-purple-100 text-purple-700' },
  completed: { label: '완료', color: 'bg-green-100 text-green-700' },
  failed: { label: '실패', color: 'bg-red-100 text-red-700' },
  tts_failed: { label: 'TTS 실패', color: 'bg-orange-100 text-orange-700' },
  published: { label: '게시됨', color: 'bg-emerald-100 text-emerald-700' },
};

function ContentSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center space-x-4 py-4">
        <div className="w-16 h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
        <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>
    </div>
  );
}

export function ContentList({ contents, isLoading, emptyMessage = '콘텐츠가 없습니다' }: ContentListProps) {
  if (isLoading) {
    return (
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {[1, 2, 3, 4, 5].map((i) => (
          <ContentSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (contents.length === 0) {
    return (
      <div className="py-12 text-center">
        <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <p className="mt-4 text-gray-500 dark:text-gray-400">{emptyMessage}</p>
        <Link
          href="/dashboard/generator"
          className="inline-flex items-center mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          새 콘텐츠 만들기
        </Link>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {contents.map((content) => {
        const status = statusConfig[content.status] ?? { label: '대기 중', color: 'bg-gray-100 text-gray-700' };
        const createdDate = new Date(content.createdAt).toLocaleDateString('ko-KR', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <Link
            key={content.id}
            href={`/dashboard/contents/${content.id}`}
            className="flex items-center space-x-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-4 px-4 transition-colors"
          >
            {/* Thumbnail placeholder */}
            <div className="flex-shrink-0 w-16 h-10 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
              {content.videoUrl ? (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  </svg>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Content info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {content.title || '제목 없음'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {content.project?.name || '프로젝트 미지정'} · {createdDate}
              </p>
            </div>

            {/* Status badge */}
            <span className={cn(
              'flex-shrink-0 px-2.5 py-0.5 text-xs font-medium rounded-full',
              status.color
            )}>
              {status.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
