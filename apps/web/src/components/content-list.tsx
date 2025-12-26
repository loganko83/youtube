'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@tubegenius/ui';
import { Button } from '@tubegenius/ui';
import { cn } from '@tubegenius/ui';
import type { ContentJob, ContentJobStatus } from '@tubegenius/shared';
import { Clock, CheckCircle2, XCircle, Loader2, Play } from 'lucide-react';

interface ContentListProps {
  contents: ContentJob[];
  onSelect?: (content: ContentJob) => void;
  className?: string;
}

const statusConfig: Record<
  ContentJobStatus,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }
> = {
  pending: {
    label: '대기 중',
    icon: Clock,
    color: 'text-gray-500 bg-gray-100',
  },
  script_generating: {
    label: '스크립트 생성 중',
    icon: Loader2,
    color: 'text-blue-500 bg-blue-100',
  },
  tts_processing: {
    label: '음성 처리 중',
    icon: Loader2,
    color: 'text-purple-500 bg-purple-100',
  },
  video_rendering: {
    label: '비디오 렌더링 중',
    icon: Loader2,
    color: 'text-orange-500 bg-orange-100',
  },
  uploading: {
    label: '업로드 중',
    icon: Loader2,
    color: 'text-indigo-500 bg-indigo-100',
  },
  completed: {
    label: '완료',
    icon: CheckCircle2,
    color: 'text-green-500 bg-green-100',
  },
  failed: {
    label: '실패',
    icon: XCircle,
    color: 'text-red-500 bg-red-100',
  },
};

export function ContentList({ contents, onSelect, className }: ContentListProps) {
  if (contents.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12">
          <div className="text-center">
            <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">아직 생성된 콘텐츠가 없습니다.</p>
            <p className="text-sm text-gray-400 mt-2">
              콘텐츠 생성 페이지에서 새로운 비디오를 만들어보세요.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {contents.map((content) => {
        const status = statusConfig[content.status];
        const StatusIcon = status.icon;
        const isProcessing = [
          'script_generating',
          'tts_processing',
          'video_rendering',
          'uploading',
        ].includes(content.status);

        return (
          <Card
            key={content.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onSelect?.(content)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {content.content?.title || content.config.topic}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {content.config.niche} · {content.config.format}
                  </CardDescription>
                </div>
                <div
                  className={cn(
                    'flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium',
                    status.color
                  )}
                >
                  <StatusIcon
                    className={cn('w-4 h-4', isProcessing && 'animate-spin')}
                  />
                  {status.label}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  생성일: {new Date(content.createdAt).toLocaleDateString('ko-KR')}
                </span>
                {content.status === 'completed' && content.youtubeVideoId && (
                  <Button variant="link" size="sm" asChild>
                    <a
                      href={`https://youtube.com/watch?v=${content.youtubeVideoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      YouTube에서 보기
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
