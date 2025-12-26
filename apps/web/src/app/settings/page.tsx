'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@tubegenius/ui';
import { useAppStore } from '@/store';
import { User, Youtube, Key, Bell, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAppStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'youtube' | 'api' | 'notifications'>('profile');

  const tabs = [
    { id: 'profile' as const, label: '프로필', icon: User },
    { id: 'youtube' as const, label: 'YouTube 연동', icon: Youtube },
    { id: 'api' as const, label: 'API 키', icon: Key },
    { id: 'notifications' as const, label: '알림 설정', icon: Bell },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">설정</h1>
        <p className="text-gray-600 mt-1">
          계정 및 서비스 설정을 관리하세요
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <Card className="lg:col-span-1 h-fit">
          <CardContent className="p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-tube-50 text-tube-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>프로필 정보</CardTitle>
                <CardDescription>
                  계정 정보를 수정하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이름
                  </label>
                  <input
                    type="text"
                    defaultValue={user?.name || ''}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tube-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이메일
                  </label>
                  <input
                    type="email"
                    defaultValue={user?.email || ''}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tube-600 focus:border-transparent"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    이메일 변경은 고객 지원팀에 문의하세요
                  </p>
                </div>
                <div className="pt-4 border-t">
                  <Button variant="tube">변경사항 저장</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* YouTube Integration */}
          {activeTab === 'youtube' && (
            <Card>
              <CardHeader>
                <CardTitle>YouTube 채널 연동</CardTitle>
                <CardDescription>
                  YouTube 채널을 연결하여 자동 업로드를 활성화하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    현재 연결된 채널이 없습니다.
                  </p>
                </div>
                <Button variant="tube">
                  <Youtube className="w-4 h-4 mr-2" />
                  YouTube 계정 연결
                </Button>
                <p className="text-xs text-gray-500">
                  OAuth 2.0을 통해 안전하게 YouTube 계정을 연동합니다.
                  자동 업로드 권한만 요청됩니다.
                </p>
              </CardContent>
            </Card>
          )}

          {/* API Keys */}
          {activeTab === 'api' && (
            <Card>
              <CardHeader>
                <CardTitle>API 키 관리</CardTitle>
                <CardDescription>
                  외부 서비스 API 키를 설정하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Google Gemini API Key
                  </label>
                  <input
                    type="password"
                    placeholder="AIza..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tube-600 focus:border-transparent font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    콘텐츠 생성에 사용됩니다. Google AI Studio에서 발급받을 수 있습니다.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ElevenLabs API Key (선택)
                  </label>
                  <input
                    type="password"
                    placeholder="sk_..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tube-600 focus:border-transparent font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    고품질 TTS를 위해 사용됩니다. 미입력시 기본 TTS가 사용됩니다.
                  </p>
                </div>
                <div className="pt-4 border-t">
                  <Button variant="tube">API 키 저장</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>알림 설정</CardTitle>
                <CardDescription>
                  원하는 알림을 선택하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">콘텐츠 생성 완료</p>
                    <p className="text-sm text-gray-600">
                      비디오 생성이 완료되면 알림을 받습니다
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 text-tube-600 rounded focus:ring-tube-500"
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">업로드 성공</p>
                    <p className="text-sm text-gray-600">
                      YouTube 업로드가 완료되면 알림을 받습니다
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 text-tube-600 rounded focus:ring-tube-500"
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">안전 검토 필요</p>
                    <p className="text-sm text-gray-600">
                      YMYL 콘텐츠 검토가 필요할 때 알림을 받습니다
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 text-tube-600 rounded focus:ring-tube-500"
                  />
                </div>
                <div className="pt-4 border-t">
                  <Button variant="tube">알림 설정 저장</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">위험 영역</CardTitle>
              <CardDescription>
                계정 삭제 등 되돌릴 수 없는 작업입니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                계정 삭제
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
