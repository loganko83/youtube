'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  Button,
} from '@tubegenius/ui';
import {
  Settings,
  Power,
  Clock,
  TrendingUp,
  Play,
  Pause,
  Save,
  ArrowLeft,
  Zap,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { api, ProjectAutomation } from '@/lib/api';

const TIMEZONE_OPTIONS = [
  { value: 'Asia/Seoul', label: '서울 (KST)' },
  { value: 'Asia/Tokyo', label: '도쿄 (JST)' },
  { value: 'America/Los_Angeles', label: 'LA (PST)' },
  { value: 'America/New_York', label: '뉴욕 (EST)' },
  { value: 'Europe/London', label: '런던 (GMT)' },
];

const TREND_SOURCES = [
  { value: 'google', label: 'Google Trends' },
  { value: 'naver', label: 'Naver DataLab' },
  { value: 'rss', label: 'RSS Feeds' },
];

export default function AutomationSettingsPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const projectId = params.id as string;

  const [formData, setFormData] = useState<Partial<ProjectAutomation>>({
    isEnabled: false,
    generateTime: '09:00',
    publishTime: '12:00',
    timezone: 'Asia/Seoul',
    dailyLimit: 1,
    autoPublish: false,
    useTrends: true,
    trendSources: ['google', 'naver', 'rss'],
  });

  // Fetch project details
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.getProject(projectId),
  });

  // Fetch automation settings
  const {
    data: automationData,
    isLoading: automationLoading,
  } = useQuery({
    queryKey: ['automation', projectId],
    queryFn: () => api.getAutomation(projectId),
  });

  // Update form when data loads
  useEffect(() => {
    if (automationData?.data) {
      setFormData(automationData.data);
    }
  }, [automationData]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<ProjectAutomation>) =>
      api.updateAutomation(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation', projectId] });
    },
  });

  // Enable/disable mutations
  const enableMutation = useMutation({
    mutationFn: () => api.enableAutomation(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation', projectId] });
      setFormData((prev) => ({ ...prev, isEnabled: true }));
    },
  });

  const disableMutation = useMutation({
    mutationFn: () => api.disableAutomation(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation', projectId] });
      setFormData((prev) => ({ ...prev, isEnabled: false }));
    },
  });

  // Trigger mutations
  const triggerTrendsMutation = useMutation({
    mutationFn: () => api.triggerTrendCollection(projectId),
  });

  const triggerContentMutation = useMutation({
    mutationFn: () => api.triggerContentGeneration(projectId),
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleToggle = () => {
    if (formData.isEnabled) {
      disableMutation.mutate();
    } else {
      enableMutation.mutate();
    }
  };

  const handleTrendSourceChange = (source: string) => {
    setFormData((prev) => {
      const sources = prev.trendSources || [];
      if (sources.includes(source)) {
        return { ...prev, trendSources: sources.filter((s) => s !== source) };
      }
      return { ...prev, trendSources: [...sources, source] };
    });
  };

  const isLoading = projectLoading || automationLoading;
  const isSaving = updateMutation.isPending;

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
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/projects`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              뒤로
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              자동화 설정
            </h1>
            <p className="text-gray-600">
              {project?.name || '프로젝트'} - 콘텐츠 자동 생성 설정
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={formData.isEnabled ? 'destructive' : 'default'}
            onClick={handleToggle}
            disabled={enableMutation.isPending || disableMutation.isPending}
          >
            {formData.isEnabled ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                비활성화
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                활성화
              </>
            )}
          </Button>
          <Button
            variant="tube"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      <Card
        className={`border-l-4 ${
          formData.isEnabled
            ? 'border-l-green-500 bg-green-50'
            : 'border-l-gray-300 bg-gray-50'
        }`}
      >
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Power
                className={`w-5 h-5 ${
                  formData.isEnabled ? 'text-green-600' : 'text-gray-400'
                }`}
              />
              <div>
                <p className="font-medium">
                  {formData.isEnabled
                    ? '자동화가 활성화되어 있습니다'
                    : '자동화가 비활성화되어 있습니다'}
                </p>
                <p className="text-sm text-gray-600">
                  {formData.isEnabled
                    ? `매일 ${formData.generateTime}에 콘텐츠가 자동 생성됩니다`
                    : '자동화를 활성화하면 설정된 시간에 콘텐츠가 생성됩니다'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Schedule Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              스케줄 설정
            </CardTitle>
            <CardDescription>
              콘텐츠 생성 및 발행 시간을 설정하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                콘텐츠 생성 시간
              </label>
              <input
                type="time"
                value={formData.generateTime || '09:00'}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    generateTime: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                매일 이 시간에 콘텐츠가 자동 생성됩니다
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                발행 시간
              </label>
              <input
                type="time"
                value={formData.publishTime || '12:00'}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    publishTime: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                자동 발행 시 이 시간에 YouTube에 업로드됩니다
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                타임존
              </label>
              <select
                value={formData.timezone || 'Asia/Seoul'}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    timezone: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg"
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                일일 생성 한도
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={formData.dailyLimit || 1}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    dailyLimit: parseInt(e.target.value) || 1,
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                하루에 최대 생성할 콘텐츠 수 (1-10)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Content Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              콘텐츠 설정
            </CardTitle>
            <CardDescription>
              자동 생성될 콘텐츠의 설정을 관리하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">자동 발행</p>
                <p className="text-sm text-gray-500">
                  생성된 콘텐츠를 자동으로 YouTube에 발행
                </p>
              </div>
              <button
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    autoPublish: !prev.autoPublish,
                  }))
                }
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  formData.autoPublish ? 'bg-tube-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    formData.autoPublish ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">트렌드 기반 토픽</p>
                <p className="text-sm text-gray-500">
                  실시간 트렌드를 분석하여 토픽 선정
                </p>
              </div>
              <button
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    useTrends: !prev.useTrends,
                  }))
                }
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  formData.useTrends ? 'bg-tube-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    formData.useTrends ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {formData.useTrends && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  트렌드 소스
                </label>
                <div className="space-y-2">
                  {TREND_SOURCES.map((source) => (
                    <label
                      key={source.value}
                      className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={formData.trendSources?.includes(source.value)}
                        onChange={() => handleTrendSourceChange(source.value)}
                        className="w-4 h-4 text-tube-600 rounded"
                      />
                      <span>{source.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Manual Triggers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            수동 실행
          </CardTitle>
          <CardDescription>
            스케줄 외에 수동으로 작업을 실행할 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button
              variant="outline"
              onClick={() => triggerTrendsMutation.mutate()}
              disabled={triggerTrendsMutation.isPending}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              {triggerTrendsMutation.isPending
                ? '수집 중...'
                : '트렌드 수집 실행'}
            </Button>
            <Button
              variant="outline"
              onClick={() => triggerContentMutation.mutate()}
              disabled={triggerContentMutation.isPending}
            >
              <Play className="w-4 h-4 mr-2" />
              {triggerContentMutation.isPending
                ? '생성 중...'
                : '콘텐츠 생성 실행'}
            </Button>
          </div>
          {(triggerTrendsMutation.isSuccess ||
            triggerContentMutation.isSuccess) && (
            <p className="text-sm text-green-600 mt-3">
              작업이 성공적으로 시작되었습니다.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
