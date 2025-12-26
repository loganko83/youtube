'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@tubegenius/ui';
import { Plus, FolderKanban, Calendar, Video } from 'lucide-react';
import Link from 'next/link';
import { useAppStore } from '@/store';
import type { Project } from '@tubegenius/shared';

async function fetchProjects(): Promise<Project[]> {
  // TODO: Replace with actual API call
  return [];
}

export default function ProjectsPage() {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  const { setCurrentProject } = useAppStore();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">프로젝트</h1>
          <p className="text-gray-600 mt-1">
            YouTube 채널별로 프로젝트를 관리하세요
          </p>
        </div>
        <Button variant="tube" size="lg">
          <Plus className="w-5 h-5 mr-2" />
          새 프로젝트
        </Button>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FolderKanban className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">아직 프로젝트가 없습니다.</p>
              <Button variant="tube">
                <Plus className="w-4 h-4 mr-2" />
                첫 프로젝트 만들기
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              onClick={() => setCurrentProject(project)}
            >
              <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{project.name}</CardTitle>
                      <CardDescription>
                        {project.description || '설명 없음'}
                      </CardDescription>
                    </div>
                    <div className="px-3 py-1 bg-tube-100 text-tube-700 rounded-full text-xs font-medium">
                      {project.niche}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      생성일: {new Date(project.createdAt).toLocaleDateString('ko-KR')}
                    </div>
                    {project.youtubeChannelId && (
                      <div className="flex items-center">
                        <Video className="w-4 h-4 mr-2" />
                        YouTube 연동됨
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
