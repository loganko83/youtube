/**
 * Analytics Dashboard - Cost tracking and success rate monitoring
 */

'use client';

import Link from 'next/link';
import { useAnalytics } from '@/lib/hooks';

function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  color?: 'blue' | 'green' | 'purple' | 'red' | 'yellow';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
          {trend && (
            <p className={`mt-2 text-sm ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value).toFixed(1)}% {trend.label}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ label, value, max, color = 'blue' }: {
  label: string;
  value: number;
  max: number;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="text-gray-900 dark:text-white font-medium">
          {value} / {max} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { data, isLoading, error } = useAnalytics();

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">분석</h1>
        <LoadingSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center py-12">
        <svg className="w-12 h-12 mx-auto text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="mt-4 text-gray-500 dark:text-gray-400">분석 데이터를 불러오는 중 오류가 발생했습니다</p>
      </div>
    );
  }

  const { costs, successRates, automation } = data;

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">분석</h1>
        <p className="text-gray-500 dark:text-gray-400">비용, 성공률, 자동화 성과를 한눈에 확인하세요</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="총 비용"
          value={`$${costs.total.toFixed(2)}`}
          subtitle={`이번 달: $${costs.byPeriod.thisMonth.toFixed(2)}`}
          color="purple"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="절감액"
          value={`$${costs.tts.savings.toFixed(2)}`}
          subtitle="Edge TTS 사용으로 절감"
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
        <StatCard
          title="성공률"
          value={`${successRates.overall.successRate.toFixed(1)}%`}
          subtitle={`${successRates.overall.success}/${successRates.overall.total} 콘텐츠`}
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="자동화율"
          value={`${automation.overview.automationRate.toFixed(1)}%`}
          subtitle={`${automation.overview.automated}/${automation.overview.totalContents} 콘텐츠`}
          color="yellow"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
      </div>

      {/* Cost Breakdown & Success Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">비용 상세</h2>

          <div className="space-y-6">
            {/* TTS Costs */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">TTS 비용</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Edge TTS (무료)</p>
                  <p className="text-lg font-semibold text-green-600">${costs.tts.edgeTts.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">ElevenLabs</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">${costs.tts.elevenlabs.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Video Costs */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">비디오 렌더링</h3>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400">Creatomate</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">${costs.video.creatomate.toFixed(2)}</p>
              </div>
            </div>

            {/* Period Breakdown */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">기간별 비용</h3>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">오늘</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">${costs.byPeriod.today.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">이번 주</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">${costs.byPeriod.thisWeek.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">이번 달</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">${costs.byPeriod.thisMonth.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Rates */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">단계별 성공률</h2>

          <div className="space-y-4">
            <ProgressBar
              label="스크립트 생성"
              value={successRates.byStage.script.total - successRates.byStage.script.failed}
              max={successRates.byStage.script.total}
              color="blue"
            />
            <ProgressBar
              label="TTS 변환"
              value={successRates.byStage.tts.total - successRates.byStage.tts.failed}
              max={successRates.byStage.tts.total}
              color="green"
            />
            <ProgressBar
              label="비디오 렌더링"
              value={successRates.byStage.video.total - successRates.byStage.video.failed}
              max={successRates.byStage.video.total}
              color="purple"
            />
            <ProgressBar
              label="YouTube 업로드"
              value={successRates.byStage.upload.total - successRates.byStage.upload.failed}
              max={successRates.byStage.upload.total}
              color="red"
            />
          </div>

          {/* Recent Failures */}
          {successRates.recentFailures.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">최근 실패</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {successRates.recentFailures.slice(0, 5).map((failure) => (
                  <Link
                    key={failure.id}
                    href={`/dashboard/contents/${failure.id}`}
                    className="block p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-900 dark:text-white truncate max-w-48">
                        {failure.title}
                      </span>
                      <span className="text-xs text-red-500">{failure.stage}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {failure.error}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Automation by Project */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">프로젝트별 자동화</h2>

        {automation.byProject.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="pb-3">프로젝트</th>
                  <th className="pb-3">니치</th>
                  <th className="pb-3">자동 생성</th>
                  <th className="pb-3">수동 생성</th>
                  <th className="pb-3">자동화</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {automation.byProject.map((project) => (
                  <tr key={project.projectId}>
                    <td className="py-3 text-sm text-gray-900 dark:text-white">
                      {project.projectName}
                    </td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-400">
                      {project.niche}
                    </td>
                    <td className="py-3 text-sm text-gray-900 dark:text-white">
                      {project.automated}
                    </td>
                    <td className="py-3 text-sm text-gray-900 dark:text-white">
                      {project.manual}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        project.isEnabled
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {project.isEnabled ? '활성화' : '비활성화'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            프로젝트 데이터가 없습니다
          </p>
        )}
      </div>

      {/* 7-Day Trend Chart (simplified) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">7일 추이</h2>

        <div className="flex items-end justify-between h-40 gap-2">
          {successRates.trend.map((day, index) => {
            const maxValue = Math.max(...successRates.trend.map(d => d.total), 1);
            const successHeight = (day.success / maxValue) * 100;
            const failedHeight = (day.failed / maxValue) * 100;

            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col-reverse h-32 gap-0.5">
                  {day.success > 0 && (
                    <div
                      className="w-full bg-green-500 rounded-t"
                      style={{ height: `${successHeight}%` }}
                    />
                  )}
                  {day.failed > 0 && (
                    <div
                      className="w-full bg-red-500 rounded-t"
                      style={{ height: `${failedHeight}%` }}
                    />
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {new Date(day.date).toLocaleDateString('ko-KR', { weekday: 'short' })}
                </p>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span className="text-xs text-gray-600 dark:text-gray-400">성공</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded" />
            <span className="text-xs text-gray-600 dark:text-gray-400">실패</span>
          </div>
        </div>
      </div>
    </div>
  );
}
