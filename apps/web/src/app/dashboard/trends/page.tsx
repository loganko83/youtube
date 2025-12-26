'use client';

import { useState } from 'react';
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
  TrendingUp,
  RefreshCw,
  Sparkles,
  Zap,
  Globe,
  Rss,
} from 'lucide-react';
import { api, TrendItem, TopicSuggestion } from '@/lib/api';

const NICHE_OPTIONS = [
  { value: 'SENIOR_HEALTH', label: '시니어 건강' },
  { value: 'FINANCE', label: '금융 & 투자' },
  { value: 'TECH_AI', label: 'AI & 테크' },
  { value: 'HISTORY', label: '역사 & 스토리' },
  { value: 'COMMERCE', label: '제품 리뷰' },
];

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  google: <Globe className="w-4 h-4" />,
  naver: <TrendingUp className="w-4 h-4" />,
  rss: <Rss className="w-4 h-4" />,
};

const SOURCE_COLORS: Record<string, string> = {
  google: 'bg-blue-100 text-blue-800',
  naver: 'bg-green-100 text-green-800',
  rss: 'bg-orange-100 text-orange-800',
};

export default function TrendsDashboardPage() {
  const [selectedNiche, setSelectedNiche] = useState('SENIOR_HEALTH');

  // Fetch all trends
  const {
    data: trendsData,
    isLoading: trendsLoading,
    refetch: refetchTrends,
  } = useQuery({
    queryKey: ['trends'],
    queryFn: () => api.getTrends(),
  });

  // Fetch topic suggestions
  const {
    data: suggestionsData,
    isLoading: suggestionsLoading,
    refetch: refetchSuggestions,
  } = useQuery({
    queryKey: ['suggestions', selectedNiche],
    queryFn: () => api.getTopicSuggestions(selectedNiche, 10),
  });

  // Fetch provider status
  const { data: statusData } = useQuery({
    queryKey: ['trend-status'],
    queryFn: () => api.getTrendProviderStatus(),
  });

  const allTrends: TrendItem[] = trendsData?.data?.flatMap((r) => r.items) || [];
  const suggestions: TopicSuggestion[] = suggestionsData?.data || [];
  const providerStatus = statusData?.data || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">트렌드 대시보드</h1>
          <p className="text-gray-600 mt-1">
            실시간 트렌드를 확인하고 콘텐츠 토픽을 추천받으세요
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            refetchTrends();
            refetchSuggestions();
          }}
          disabled={trendsLoading || suggestionsLoading}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${trendsLoading || suggestionsLoading ? 'animate-spin' : ''}`}
          />
          새로고침
        </Button>
      </div>

      {/* Provider Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(providerStatus).map(([provider, isActive]) => (
          <Card key={provider} className="border-l-4 border-l-green-500">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {SOURCE_ICONS[provider]}
                  <span className="font-medium capitalize">{provider}</span>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {isActive ? '활성' : '비활성'}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Real-time Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-tube-600" />
              실시간 트렌드
            </CardTitle>
            <CardDescription>
              Google, Naver, RSS에서 수집된 최신 트렌드
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trendsLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : allTrends.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                트렌드 데이터가 없습니다
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {allTrends.slice(0, 20).map((trend, index) => (
                  <div
                    key={`${trend.keyword}-${index}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-400 w-6">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">
                          {trend.keyword}
                        </p>
                        {trend.category && (
                          <p className="text-xs text-gray-500">
                            {trend.category}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${SOURCE_COLORS[trend.source] || 'bg-gray-100'}`}
                      >
                        {trend.source}
                      </span>
                      <span className="text-sm font-semibold text-tube-600">
                        {trend.score.toFixed(0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Topic Suggestions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  토픽 추천
                </CardTitle>
                <CardDescription>
                  트렌드 기반 콘텐츠 토픽 제안
                </CardDescription>
              </div>
              <select
                value={selectedNiche}
                onChange={(e) => setSelectedNiche(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-sm"
              >
                {NICHE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {suggestionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : suggestions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                추천 토픽이 없습니다
              </div>
            ) : (
              <div className="space-y-4">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg hover:border-tube-300 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {suggestion.topic}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {suggestion.reasoning}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {suggestion.keywords.slice(0, 4).map((keyword, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-4">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-semibold">
                          {suggestion.trendScore.toFixed(0)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      {suggestion.sources.map((source) => (
                        <span
                          key={source}
                          className={`px-2 py-0.5 rounded text-xs ${SOURCE_COLORS[source] || 'bg-gray-100'}`}
                        >
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <Card className="bg-gradient-to-r from-tube-50 to-purple-50">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Sparkles className="w-6 h-6 text-tube-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">트렌드 활용 팁</h3>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                <li>• 점수가 높은 트렌드일수록 현재 관심도가 높습니다</li>
                <li>• 여러 소스에서 중복 등장하는 키워드는 더 신뢰도가 높습니다</li>
                <li>• 토픽 추천은 선택한 니치에 맞게 자동 필터링됩니다</li>
                <li>• 매일 오전 6시에 트렌드가 자동으로 수집됩니다</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
