/**
 * New Project Page - Create a new project
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCreateProject } from '@/lib/hooks';

type NicheType = 'finance' | 'senior_health' | 'tech_ai' | 'history' | 'commerce';

const NICHE_OPTIONS: { value: NicheType; label: string; description: string; icon: string }[] = [
  {
    value: 'finance',
    label: '금융/투자',
    description: '주식, 부동산, 적금, 투자 정보 등',
    icon: '💰'
  },
  {
    value: 'senior_health',
    label: '시니어 건강',
    description: '노년층 건강, 운동, 영양 정보 등',
    icon: '❤️'
  },
  {
    value: 'tech_ai',
    label: '테크/AI',
    description: '기술, 인공지능, 소프트웨어 등',
    icon: '🤖'
  },
  {
    value: 'history',
    label: '역사',
    description: '역사적 사건, 인물, 문화 등',
    icon: '📜'
  },
  {
    value: 'commerce',
    label: '커머스',
    description: '쇼핑, 리뷰, 추천 상품 등',
    icon: '🛒'
  },
];

export default function NewProjectPage() {
  const router = useRouter();
  const createProject = useCreateProject();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [niche, setNiche] = useState<NicheType | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('프로젝트 이름을 입력해주세요');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const project = await createProject.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        settings: niche ? { niche } : undefined,
      });
      router.push(`/dashboard/projects/${project.id}`);
    } catch (err) {
      setError('프로젝트 생성에 실패했습니다. 다시 시도해주세요.');
      console.error('Failed to create project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <Link href="/dashboard/projects" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
              프로젝트
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 dark:text-white font-medium">
            새 프로젝트
          </li>
        </ol>
      </nav>

      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            새 프로젝트 만들기
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            새로운 YouTube 채널 또는 콘텐츠 시리즈를 위한 프로젝트를 생성하세요
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            {/* Error message */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Project name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                프로젝트 이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 시니어 건강 채널"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                설명 (선택)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="프로젝트에 대한 간단한 설명을 입력하세요"
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            {/* Niche selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                기본 니치 (선택)
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                프로젝트의 기본 콘텐츠 카테고리를 선택하세요. 나중에 변경할 수 있습니다.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {NICHE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setNiche(niche === option.value ? '' : option.value)}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      niche === option.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">{option.icon}</span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {option.label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit buttons */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link
                href="/dashboard/projects"
                className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className={`inline-flex items-center px-6 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isSubmitting || !name.trim()
                    ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed text-gray-500'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? (
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    프로젝트 생성
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Help text */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                프로젝트란?
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                프로젝트는 YouTube 채널이나 콘텐츠 시리즈를 관리하는 단위입니다.
                프로젝트 내에서 여러 개의 콘텐츠를 생성하고 관리할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
