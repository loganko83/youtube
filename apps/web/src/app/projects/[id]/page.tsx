'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@tubegenius/ui';
import { ContentList } from '@/components/content-list';
import { ArrowLeft, Settings, Video, Plus } from 'lucide-react';
import Link from 'next/link';
import type { Project, ContentJob } from '@tubegenius/shared';

async function fetchProject(_id: string): Promise<Project | null> {
  // TODO: Replace with actual API call
  return null;
}

async function fetchProjectContent(_projectId: string): Promise<ContentJob[]> {
  // TODO: Replace with actual API call
  return [];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId),
  });

  const { data: contents = [], isLoading: contentsLoading } = useQuery({
    queryKey: ['project-content', projectId],
    queryFn: () => fetchProjectContent(projectId),
  });

  if (projectLoading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2" />
          <div className="h-6 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <p className="text-gray-500">프로젝트를 찾을 수 없습니다.</p>
            <Link href="/projects" className="mt-4 inline-block">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                프로젝트 목록으로
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/projects" className="inline-flex items-center text-tube-600 hover:text-tube-700 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          프로젝트 목록으로
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600 mt-1">
              {project.description || '프로젝트 설명 없음'}
            </p>
            <div className="flex items-center gap-4 mt-4">
              <span className="px-3 py-1 bg-tube-100 text-tube-700 rounded-full text-sm font-medium">
                {project.niche}
              </span>
              {project.youtubeChannelId && (
                <span className="flex items-center text-sm text-gray-600">
                  <Video className="w-4 h-4 mr-1" />
                  YouTube 연동됨
                </span>
              )}
            </div>
          </div>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            설정
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Link href="/generator" className="flex-1">
          <Button variant="tube" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            새 콘텐츠 생성
          </Button>
        </Link>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              총 콘텐츠
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {contents.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              완료된 콘텐츠
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {contents.filter((c) => c.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              처리 중인 콘텐츠
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {contents.filter((c) => !['completed', 'failed'].includes(c.status)).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content List */}
      <Card>
        <CardHeader>
          <CardTitle>프로젝트 콘텐츠</CardTitle>
          <CardDescription>
            이 프로젝트에서 생성된 모든 콘텐츠
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contentsLoading ? (
            <div className="text-center py-8 text-gray-500">로딩 중...</div>
          ) : (
            <ContentList contents={contents} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
