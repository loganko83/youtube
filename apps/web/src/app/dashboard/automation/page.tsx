'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  Button,
} from '@tubegenius/ui';
import {
  Zap,
  RefreshCw,
  Power,
  Clock,
  Calendar,
  Settings,
  Pause,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { api, AutomationStats, ScheduledJob } from '@/lib/api';

export default function AutomationDashboardPage() {
  // Fetch automation stats
  const {
    data: statsData,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['automation-stats'],
    queryFn: () => api.getAutomationStats(),
  });

  // Fetch scheduled jobs
  const {
    data: jobsData,
    isLoading: jobsLoading,
    refetch: refetchJobs,
  } = useQuery({
    queryKey: ['scheduled-jobs'],
    queryFn: () => api.getScheduledJobs(),
  });

  const stats: AutomationStats | undefined = statsData?.data;
  const jobs: ScheduledJob[] = jobsData?.data || [];

  const isLoading = statsLoading || jobsLoading;

  const handleRefresh = () => {
    refetchStats();
    refetchJobs();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">자동화 대시보드</h1>
          <p className="text-gray-600 mt-1">
            모든 프로젝트의 자동화 상태를 한눈에 확인하세요
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw
            className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
          />
          새로고침
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalProjects || 0}</p>
                <p className="text-sm text-gray-500">전체 프로젝트</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Power className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.enabledAutomations || 0}</p>
                <p className="text-sm text-gray-500">활성화된 자동화</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Pause className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.disabledAutomations || 0}</p>
                <p className="text-sm text-gray-500">비활성화된 자동화</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats?.contentsGeneratedToday || 0}
                </p>
                <p className="text-sm text-gray-500">오늘 생성된 콘텐츠</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Scheduled Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              스케줄 작업
            </CardTitle>
            <CardDescription>시스템에 등록된 자동 실행 작업</CardDescription>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                등록된 작업이 없습니다
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          job.isActive ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      />
                      <div>
                        <p className="font-medium">{job.name}</p>
                        <p className="text-xs text-gray-500">
                          {job.cronExpression}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      {job.nextRun && (
                        <p className="text-gray-600">
                          다음 실행:{' '}
                          {new Date(job.nextRun).toLocaleString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      )}
                      {job.lastRun && (
                        <p className="text-xs text-gray-400">
                          마지막 실행:{' '}
                          {new Date(job.lastRun).toLocaleString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Automations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              프로젝트 자동화 현황
            </CardTitle>
            <CardDescription>각 프로젝트의 자동화 설정 상태</CardDescription>
          </CardHeader>
          <CardContent>
            {!stats?.projects || stats.projects.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                프로젝트가 없습니다
              </div>
            ) : (
              <div className="space-y-3">
                {stats.projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          project.isEnabled ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      />
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-xs text-gray-500">{project.niche}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <p className="text-gray-600">
                          {project.contentsToday} / {project.dailyLimit}
                        </p>
                        <p className="text-xs text-gray-400">오늘 생성</p>
                      </div>
                      <Link
                        href={`/dashboard/projects/${project.id}/automation`}
                      >
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <Card className="bg-gradient-to-r from-tube-50 to-blue-50">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Zap className="w-6 h-6 text-tube-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">자동화 팁</h3>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                <li>
                  • 트렌드 수집은 매일 오전 6시(KST)에 자동으로 실행됩니다
                </li>
                <li>
                  • 콘텐츠 생성은 매일 오전 9시(KST)에 활성화된 프로젝트에서
                  실행됩니다
                </li>
                <li>
                  • 각 프로젝트에서 일일 생성 한도와 자동 발행 옵션을 설정할 수
                  있습니다
                </li>
                <li>
                  • 트렌드 기반 토픽을 활성화하면 실시간 인기 키워드로 콘텐츠가
                  생성됩니다
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
