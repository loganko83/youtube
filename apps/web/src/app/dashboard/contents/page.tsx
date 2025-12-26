/**
 * Contents List Page - View all generated contents
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useContents } from '@/lib/hooks';
import type { Content } from '@/lib/api';

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: '대기 중', color: 'text-gray-700 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-700' },
  script_generating: { label: '스크립트 생성 중', color: 'text-blue-700 dark:text-blue-300', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  tts_processing: { label: 'TTS 생성 중', color: 'text-indigo-700 dark:text-indigo-300', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30' },
  tts_generating: { label: 'TTS 생성 중', color: 'text-indigo-700 dark:text-indigo-300', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30' },
  video_rendering: { label: '비디오 렌더링 중', color: 'text-purple-700 dark:text-purple-300', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  uploading: { label: 'YouTube 업로드 중', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  scheduled: { label: '예약됨', color: 'text-yellow-700 dark:text-yellow-300', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
  completed: { label: '완료', color: 'text-green-700 dark:text-green-300', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  failed: { label: '실패', color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  tts_failed: { label: 'TTS 실패', color: 'text-orange-700 dark:text-orange-300', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  published: { label: '게시됨', color: 'text-emerald-700 dark:text-emerald-300', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' },
};

type StatusFilter = 'all' | 'processing' | 'completed' | 'failed';

function ContentRow({ content }: { content: Content }) {
  const status = statusConfig[content.status] ?? { label: '대기 중', color: 'text-gray-700 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-700' };
  const createdDate = new Date(content.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Link
      href={`/dashboard/contents/${content.id}`}
      className="block hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
    >
      <div className="px-6 py-4 flex items-center">
        {/* Thumbnail */}
        <div className="flex-shrink-0 w-20 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden mr-4">
          {content.thumbnailUrl ? (
            <img
              src={content.thumbnailUrl}
              alt={content.title || '썸네일'}
              className="w-full h-full object-cover"
            />
          ) : content.videoUrl ? (
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
            {content.project?.name || '프로젝트 미지정'}
          </p>
        </div>

        {/* Format badge */}
        <div className="hidden sm:block flex-shrink-0 mr-4">
          <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            {content.config?.format === 'shorts' ? 'Shorts' : 'Long-form'}
          </span>
        </div>

        {/* Status badge */}
        <div className="flex-shrink-0 mr-4">
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${status.color} ${status.bgColor}`}>
            {status.label}
          </span>
        </div>

        {/* Date */}
        <div className="hidden md:block flex-shrink-0 text-sm text-gray-500 dark:text-gray-400 w-24 text-right">
          {createdDate}
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0 ml-4">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

function ContentSkeleton() {
  return (
    <div className="px-6 py-4 flex items-center animate-pulse">
      <div className="w-20 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg mr-4" />
      <div className="flex-1">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
      </div>
      <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded mr-4" />
      <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded-full mr-4" />
      <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  );
}

export default function ContentsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useContents(undefined, page, 20);

  const contents = data?.items || [];
  const filteredContents = contents.filter((content) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'processing') {
      return ['pending', 'script_generating', 'tts_processing', 'tts_generating', 'video_rendering', 'uploading'].includes(content.status);
    }
    if (statusFilter === 'completed') {
      return ['completed', 'published', 'scheduled'].includes(content.status);
    }
    if (statusFilter === 'failed') {
      return ['failed', 'tts_failed'].includes(content.status);
    }
    return true;
  });

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            콘텐츠
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            생성된 모든 콘텐츠를 관리하세요
          </p>
        </div>
        <Link
          href="/dashboard/generator"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          새 콘텐츠
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { value: 'all', label: '전체' },
          { value: 'processing', label: '처리 중' },
          { value: 'completed', label: '완료' },
          { value: 'failed', label: '실패' },
        ].map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value as StatusFilter)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              statusFilter === filter.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Contents table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Table header */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <div className="w-20 mr-4">썸네일</div>
            <div className="flex-1">제목</div>
            <div className="hidden sm:block w-24 mr-4">형식</div>
            <div className="w-24 mr-4">상태</div>
            <div className="hidden md:block w-24 text-right mr-4">생성일</div>
            <div className="w-5"></div>
          </div>
        </div>

        {/* Table body */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {isLoading ? (
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <ContentSkeleton key={i} />
              ))}
            </>
          ) : error ? (
            <div className="px-6 py-12 text-center">
              <svg className="w-12 h-12 mx-auto text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-4 text-gray-500 dark:text-gray-400">
                콘텐츠를 불러오는 중 오류가 발생했습니다
              </p>
            </div>
          ) : filteredContents.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="mt-4 text-gray-500 dark:text-gray-400">
                {statusFilter !== 'all' ? '해당 상태의 콘텐츠가 없습니다' : '아직 생성된 콘텐츠가 없습니다'}
              </p>
              {statusFilter === 'all' && (
                <Link
                  href="/dashboard/generator"
                  className="inline-flex items-center mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  첫 콘텐츠 만들기 →
                </Link>
              )}
            </div>
          ) : (
            filteredContents.map((content) => (
              <ContentRow key={content.id} content={content} />
            ))
          )}
        </div>

        {/* Pagination */}
        {data && data.meta?.total && data.meta.total > 20 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              총 {data.meta.total}개 중 {(page - 1) * 20 + 1}-{Math.min(page * 20, data.meta.total)}개 표시
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className={`px-3 py-1 text-sm font-medium rounded ${
                  page === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                이전
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page * 20 >= data.meta.total}
                className={`px-3 py-1 text-sm font-medium rounded ${
                  page * 20 >= data.meta.total
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
