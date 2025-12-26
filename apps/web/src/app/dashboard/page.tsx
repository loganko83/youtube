'use client';

import { useQuery } from '@tanstack/react-query';
import { StatsCard } from '@/components/stats-card';
import { ContentList } from '@/components/content-list';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@tubegenius/ui';
import {
  Video,
  Eye,
  ThumbsUp,
  TrendingUp,
  Plus,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import type { ContentJob } from '@tubegenius/shared';

// Mock API functions (replace with actual API calls)
async function fetchDashboardStats() {
  // TODO: Replace with actual API call
  return {
    totalVideos: 24,
    totalViews: 15240,
    totalLikes: 3580,
    avgEngagement: 23.5,
  };
}

async function fetchRecentContent(): Promise<ContentJob[]> {
  // TODO: Replace with actual API call
  return [];
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
  });

  const {
    data: recentContent = [],
    isLoading: contentLoading,
    refetch,
  } = useQuery({
    queryKey: ['recent-content'],
    queryFn: fetchRecentContent,
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
          <p className="text-gray-600 mt-1">
            TubeGenius AI 콘텐츠 생성 현황을 확인하세요
          </p>
        </div>
        <Link href="/generator">
          <Button variant="tube" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            새 콘텐츠 생성
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="총 비디오"
          value={statsLoading ? '...' : stats?.totalVideos || 0}
          description="생성된 전체 비디오"
          icon={Video}
          trend={{
            value: 12,
            label: '지난 주 대비',
          }}
        />
        <StatsCard
          title="총 조회수"
          value={
            statsLoading
              ? '...'
              : (stats?.totalViews || 0).toLocaleString('ko-KR')
          }
          description="누적 조회수"
          icon={Eye}
          trend={{
            value: 8.2,
            label: '지난 주 대비',
          }}
        />
        <StatsCard
          title="총 좋아요"
          value={
            statsLoading
              ? '...'
              : (stats?.totalLikes || 0).toLocaleString('ko-KR')
          }
          description="누적 좋아요"
          icon={ThumbsUp}
          trend={{
            value: 15.3,
            label: '지난 주 대비',
          }}
        />
        <StatsCard
          title="평균 참여율"
          value={statsLoading ? '...' : `${stats?.avgEngagement || 0}%`}
          description="좋아요/조회수 비율"
          icon={TrendingUp}
          trend={{
            value: 2.1,
            label: '지난 주 대비',
          }}
        />
      </div>

      {/* Recent Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>최근 생성된 콘텐츠</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={contentLoading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${contentLoading ? 'animate-spin' : ''}`}
              />
              새로고침
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ContentList contents={recentContent} />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">빠른 시작</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/generator">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="w-4 h-4 mr-2" />
                새 콘텐츠 생성
              </Button>
            </Link>
            <Link href="/projects">
              <Button variant="outline" className="w-full justify-start">
                <Video className="w-4 h-4 mr-2" />
                프로젝트 관리
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">활용 팁</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-tube-600 mr-2">•</span>
                <span>시니어 건강 버티컬은 YMYL 콘텐츠로 자동 검증됩니다</span>
              </li>
              <li className="flex items-start">
                <span className="text-tube-600 mr-2">•</span>
                <span>Shorts 형식은 60초 이하로 자동 최적화됩니다</span>
              </li>
              <li className="flex items-start">
                <span className="text-tube-600 mr-2">•</span>
                <span>면책조항이 필요한 경우 자동으로 추가됩니다</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
