# AutoClip Frontend Development Guide

## 문서 정보
- **버전**: 1.0.0
- **최종 수정일**: 2024-12-24
- **작성자**: AutoClip Development Team
- **대상 독자**: 프론트엔드 개발자

---

## 1. 기술 스택 개요

### 1.1 Core Stack

| 기술 | 버전 | 용도 |
|------|------|------|
| **Next.js** | 14.2+ | React 프레임워크 (App Router) |
| **TypeScript** | 5.3+ | 타입 안전성 |
| **React** | 18.2+ | UI 라이브러리 |
| **Tailwind CSS** | 3.4+ | 유틸리티 CSS |
| **shadcn/ui** | latest | UI 컴포넌트 |

### 1.2 상태 관리 & 데이터 페칭

| 기술 | 용도 |
|------|------|
| **Zustand** | 전역 상태 관리 |
| **TanStack Query** | 서버 상태 관리 & 캐싱 |
| **React Hook Form** | 폼 상태 관리 |
| **Zod** | 스키마 검증 |

### 1.3 개발 도구

| 도구 | 용도 |
|------|------|
| **ESLint** | 코드 린팅 |
| **Prettier** | 코드 포맷팅 |
| **Husky** | Git Hooks |
| **lint-staged** | 스테이징 파일 린팅 |
| **Storybook** | 컴포넌트 문서화 |

---

## 2. 프로젝트 구조

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 인증 관련 라우트 그룹
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/              # 대시보드 라우트 그룹
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── projects/
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── settings/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── contents/
│   │   │   │       └── page.tsx
│   │   │   └── page.tsx
│   │   ├── contents/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   ├── create/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── templates/
│   │   │   └── page.tsx
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   ├── billing/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── api/                      # API Routes
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                       # shadcn/ui 컴포넌트
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── toast.tsx
│   │   └── ...
│   ├── layout/                   # 레이아웃 컴포넌트
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   ├── footer.tsx
│   │   └── mobile-nav.tsx
│   ├── forms/                    # 폼 컴포넌트
│   │   ├── login-form.tsx
│   │   ├── register-form.tsx
│   │   ├── project-form.tsx
│   │   ├── content-wizard/
│   │   │   ├── index.tsx
│   │   │   ├── step-vertical.tsx
│   │   │   ├── step-format.tsx
│   │   │   ├── step-tone.tsx
│   │   │   ├── step-source.tsx
│   │   │   └── step-review.tsx
│   │   └── settings-form.tsx
│   ├── features/                 # 기능별 컴포넌트
│   │   ├── dashboard/
│   │   │   ├── stats-cards.tsx
│   │   │   ├── recent-contents.tsx
│   │   │   ├── usage-chart.tsx
│   │   │   └── quick-actions.tsx
│   │   ├── projects/
│   │   │   ├── project-card.tsx
│   │   │   ├── project-list.tsx
│   │   │   └── project-settings.tsx
│   │   ├── contents/
│   │   │   ├── content-card.tsx
│   │   │   ├── content-list.tsx
│   │   │   ├── content-preview.tsx
│   │   │   ├── content-status.tsx
│   │   │   └── content-actions.tsx
│   │   ├── templates/
│   │   │   ├── template-card.tsx
│   │   │   ├── template-grid.tsx
│   │   │   └── template-preview.tsx
│   │   └── analytics/
│   │       ├── performance-chart.tsx
│   │       ├── engagement-metrics.tsx
│   │       └── usage-breakdown.tsx
│   └── shared/                   # 공통 컴포넌트
│       ├── loading-spinner.tsx
│       ├── error-boundary.tsx
│       ├── empty-state.tsx
│       ├── confirmation-dialog.tsx
│       ├── file-upload.tsx
│       ├── video-player.tsx
│       └── pagination.tsx
├── hooks/                        # 커스텀 훅
│   ├── use-auth.ts
│   ├── use-projects.ts
│   ├── use-contents.ts
│   ├── use-templates.ts
│   ├── use-analytics.ts
│   ├── use-subscription.ts
│   ├── use-media-query.ts
│   ├── use-local-storage.ts
│   └── use-debounce.ts
├── lib/                          # 유틸리티 & 설정
│   ├── api/                      # API 클라이언트
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── projects.ts
│   │   ├── contents.ts
│   │   ├── templates.ts
│   │   └── analytics.ts
│   ├── utils/
│   │   ├── cn.ts                 # className 유틸리티
│   │   ├── format.ts             # 포맷팅 유틸리티
│   │   ├── validation.ts         # 검증 유틸리티
│   │   └── constants.ts          # 상수 정의
│   └── config/
│       ├── site.ts               # 사이트 설정
│       └── nav.ts                # 네비게이션 설정
├── stores/                       # Zustand 스토어
│   ├── auth-store.ts
│   ├── ui-store.ts
│   ├── wizard-store.ts
│   └── notification-store.ts
├── types/                        # TypeScript 타입
│   ├── api.ts
│   ├── auth.ts
│   ├── project.ts
│   ├── content.ts
│   ├── template.ts
│   └── analytics.ts
├── styles/                       # 추가 스타일
│   └── themes/
│       ├── default.css
│       └── dark.css
└── middleware.ts                 # Next.js 미들웨어
```

---

## 3. 컴포넌트 개발 가이드

### 3.1 컴포넌트 작성 규칙

#### 기본 컴포넌트 템플릿

```tsx
// components/features/contents/content-card.tsx
'use client';

import { memo } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils/format';
import { Content, ContentStatus } from '@/types/content';
import { cn } from '@/lib/utils/cn';

// Props 인터페이스 정의
interface ContentCardProps {
  content: Content;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onPublish?: (id: string) => void;
  className?: string;
}

// 상태별 배지 색상 매핑
const statusVariants: Record<ContentStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  generating: 'default',
  ready: 'outline',
  published: 'default',
  failed: 'destructive',
};

// 상태 라벨 매핑
const statusLabels: Record<ContentStatus, string> = {
  draft: '초안',
  generating: '생성 중',
  ready: '준비됨',
  published: '게시됨',
  failed: '실패',
};

// 컴포넌트 구현
function ContentCardComponent({
  content,
  onEdit,
  onDelete,
  onPublish,
  className,
}: ContentCardProps) {
  const { id, title, status, thumbnailUrl, createdAt, platform } = content;

  return (
    <Card className={cn('overflow-hidden transition-shadow hover:shadow-lg', className)}>
      {/* 썸네일 */}
      <div className="aspect-video relative bg-muted">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="object-cover w-full h-full"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No Preview
          </div>
        )}
        <Badge 
          variant={statusVariants[status]} 
          className="absolute top-2 right-2"
        >
          {statusLabels[status]}
        </Badge>
      </div>

      {/* 헤더 */}
      <CardHeader className="pb-2">
        <CardTitle className="text-lg line-clamp-2">{title}</CardTitle>
      </CardHeader>

      {/* 컨텐츠 */}
      <CardContent className="pb-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{platform}</span>
          <span>•</span>
          <time dateTime={createdAt}>{formatDate(createdAt)}</time>
        </div>
      </CardContent>

      {/* 푸터 액션 */}
      <CardFooter className="gap-2">
        {onEdit && (
          <Button variant="outline" size="sm" onClick={() => onEdit(id)}>
            편집
          </Button>
        )}
        {onPublish && status === 'ready' && (
          <Button size="sm" onClick={() => onPublish(id)}>
            게시
          </Button>
        )}
        {onDelete && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-auto text-destructive"
            onClick={() => onDelete(id)}
          >
            삭제
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// memo로 감싸서 불필요한 리렌더링 방지
export const ContentCard = memo(ContentCardComponent);
```

### 3.2 폼 컴포넌트 패턴

```tsx
// components/forms/project-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateProject, useUpdateProject } from '@/hooks/use-projects';
import { Project, Vertical } from '@/types/project';
import { VERTICALS } from '@/lib/utils/constants';

// Zod 스키마 정의
const projectSchema = z.object({
  name: z
    .string()
    .min(2, '프로젝트 이름은 2자 이상이어야 합니다.')
    .max(100, '프로젝트 이름은 100자 이하여야 합니다.'),
  description: z
    .string()
    .max(500, '설명은 500자 이하여야 합니다.')
    .optional(),
  vertical: z.enum(['senior_health', 'finance', 'tech', 'history', 'custom'] as const),
  defaultLanguage: z.enum(['ko', 'en', 'ja', 'zh'] as const),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  project?: Project; // 편집 모드일 때 기존 프로젝트 데이터
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProjectForm({ project, onSuccess, onCancel }: ProjectFormProps) {
  const isEditMode = !!project;
  
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project?.name ?? '',
      description: project?.description ?? '',
      vertical: project?.vertical ?? 'senior_health',
      defaultLanguage: project?.defaultLanguage ?? 'ko',
    },
  });

  const onSubmit = async (values: ProjectFormValues) => {
    try {
      if (isEditMode) {
        await updateProject.mutateAsync({ id: project.id, ...values });
      } else {
        await createProject.mutateAsync(values);
      }
      onSuccess?.();
    } catch (error) {
      // 에러는 mutation에서 처리됨
    }
  };

  const isLoading = createProject.isPending || updateProject.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 프로젝트 이름 */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>프로젝트 이름 *</FormLabel>
              <FormControl>
                <Input placeholder="시니어 건강 채널" {...field} />
              </FormControl>
              <FormDescription>
                채널이나 콘텐츠 시리즈를 구분할 수 있는 이름을 입력하세요.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 설명 */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>설명</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="프로젝트에 대한 간단한 설명..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 버티컬 선택 */}
        <FormField
          control={form.control}
          name="vertical"
          render={({ field }) => (
            <FormItem>
              <FormLabel>콘텐츠 분야 *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="분야를 선택하세요" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {VERTICALS.map((vertical) => (
                    <SelectItem key={vertical.value} value={vertical.value}>
                      {vertical.icon} {vertical.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                선택한 분야에 최적화된 템플릿과 데이터 소스가 자동으로 설정됩니다.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 기본 언어 */}
        <FormField
          control={form.control}
          name="defaultLanguage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>기본 언어 *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="언어 선택" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ko">🇰🇷 한국어</SelectItem>
                  <SelectItem value="en">🇺🇸 English</SelectItem>
                  <SelectItem value="ja">🇯🇵 日本語</SelectItem>
                  <SelectItem value="zh">🇨🇳 中文</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 액션 버튼 */}
        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              취소
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? '처리 중...' : isEditMode ? '수정' : '생성'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

### 3.3 콘텐츠 생성 위저드

```tsx
// components/forms/content-wizard/index.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useWizardStore } from '@/stores/wizard-store';
import { useCreateContent } from '@/hooks/use-contents';
import { StepVertical } from './step-vertical';
import { StepFormat } from './step-format';
import { StepTone } from './step-tone';
import { StepSource } from './step-source';
import { StepReview } from './step-review';

const STEPS = [
  { id: 'vertical', title: '콘텐츠 분야', component: StepVertical },
  { id: 'format', title: '형식 선택', component: StepFormat },
  { id: 'tone', title: '톤 & 스타일', component: StepTone },
  { id: 'source', title: '데이터 소스', component: StepSource },
  { id: 'review', title: '최종 확인', component: StepReview },
] as const;

interface ContentWizardProps {
  projectId: string;
}

export function ContentWizard({ projectId }: ContentWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const { data, reset, isStepValid } = useWizardStore();
  const createContent = useCreateContent();

  const CurrentStepComponent = STEPS[currentStep].component;
  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const isLastStep = currentStep === STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      handleSubmit();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    try {
      const content = await createContent.mutateAsync({
        projectId,
        ...data,
      });
      reset();
      router.push(`/contents/${content.id}`);
    } catch (error) {
      // 에러 처리
    }
  };

  const canProceed = isStepValid(STEPS[currentStep].id);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>{STEPS[currentStep].title}</CardTitle>
          <span className="text-sm text-muted-foreground">
            {currentStep + 1} / {STEPS.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>

      <CardContent className="min-h-[400px]">
        <CurrentStepComponent />
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={isFirstStep}
        >
          이전
        </Button>
        <Button
          onClick={handleNext}
          disabled={!canProceed || createContent.isPending}
        >
          {createContent.isPending 
            ? '생성 중...' 
            : isLastStep 
              ? '콘텐츠 생성' 
              : '다음'}
        </Button>
      </CardFooter>
    </Card>
  );
}
```

---

## 4. 상태 관리

### 4.1 Zustand 스토어

```typescript
// stores/auth-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@/types/auth';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // State
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,

      // Actions
      setUser: (user) => 
        set({ user, isAuthenticated: !!user }),
      
      setAccessToken: (accessToken) => 
        set({ accessToken }),
      
      login: (user, accessToken) =>
        set({ user, accessToken, isAuthenticated: true }),
      
      logout: () =>
        set({ user: null, accessToken: null, isAuthenticated: false }),
      
      setLoading: (isLoading) => 
        set({ isLoading }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        accessToken: state.accessToken,
      }),
    }
  )
);
```

```typescript
// stores/wizard-store.ts
import { create } from 'zustand';
import { Vertical, ContentFormat, ToneStyle, DataSource } from '@/types/content';

interface WizardData {
  vertical: Vertical | null;
  format: ContentFormat | null;
  tone: ToneStyle | null;
  dataSources: DataSource[];
  customPrompt: string;
  targetPlatform: string[];
}

interface WizardState {
  data: WizardData;
  setVertical: (vertical: Vertical) => void;
  setFormat: (format: ContentFormat) => void;
  setTone: (tone: ToneStyle) => void;
  setDataSources: (sources: DataSource[]) => void;
  setCustomPrompt: (prompt: string) => void;
  setTargetPlatform: (platforms: string[]) => void;
  reset: () => void;
  isStepValid: (step: string) => boolean;
}

const initialData: WizardData = {
  vertical: null,
  format: null,
  tone: null,
  dataSources: [],
  customPrompt: '',
  targetPlatform: [],
};

export const useWizardStore = create<WizardState>((set, get) => ({
  data: initialData,

  setVertical: (vertical) =>
    set((state) => ({ data: { ...state.data, vertical } })),

  setFormat: (format) =>
    set((state) => ({ data: { ...state.data, format } })),

  setTone: (tone) =>
    set((state) => ({ data: { ...state.data, tone } })),

  setDataSources: (dataSources) =>
    set((state) => ({ data: { ...state.data, dataSources } })),

  setCustomPrompt: (customPrompt) =>
    set((state) => ({ data: { ...state.data, customPrompt } })),

  setTargetPlatform: (targetPlatform) =>
    set((state) => ({ data: { ...state.data, targetPlatform } })),

  reset: () => set({ data: initialData }),

  isStepValid: (step) => {
    const { data } = get();
    switch (step) {
      case 'vertical':
        return !!data.vertical;
      case 'format':
        return !!data.format;
      case 'tone':
        return !!data.tone;
      case 'source':
        return data.dataSources.length > 0;
      case 'review':
        return data.targetPlatform.length > 0;
      default:
        return false;
    }
  },
}));
```

### 4.2 TanStack Query 설정

```typescript
// lib/api/client.ts
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/auth-store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request 인터셉터 - 토큰 추가
apiClient.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response 인터셉터 - 에러 처리 & 토큰 갱신
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // 401 에러 시 토큰 갱신 시도
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
          withCredentials: true,
        });
        
        useAuthStore.getState().setAccessToken(data.accessToken);
        
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        }
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

```typescript
// hooks/use-contents.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Content, CreateContentDto, UpdateContentDto } from '@/types/content';
import { useToast } from '@/components/ui/use-toast';

// Query Keys
export const contentKeys = {
  all: ['contents'] as const,
  lists: () => [...contentKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...contentKeys.lists(), filters] as const,
  details: () => [...contentKeys.all, 'detail'] as const,
  detail: (id: string) => [...contentKeys.details(), id] as const,
};

// 콘텐츠 목록 조회
export function useContents(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: contentKeys.list(filters ?? {}),
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Content[]; meta: any }>('/contents', {
        params: filters,
      });
      return data;
    },
  });
}

// 콘텐츠 상세 조회
export function useContent(id: string) {
  return useQuery({
    queryKey: contentKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Content }>(`/contents/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

// 콘텐츠 생성
export function useCreateContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (dto: CreateContentDto) => {
      const { data } = await apiClient.post<{ data: Content }>('/contents', dto);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentKeys.lists() });
      toast({
        title: '콘텐츠 생성 시작',
        description: 'AI가 콘텐츠를 생성하고 있습니다. 잠시만 기다려주세요.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '콘텐츠 생성 실패',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// 콘텐츠 수정
export function useUpdateContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...dto }: UpdateContentDto & { id: string }) => {
      const { data } = await apiClient.patch<{ data: Content }>(`/contents/${id}`, dto);
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: contentKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: contentKeys.lists() });
      toast({
        title: '수정 완료',
        description: '콘텐츠가 수정되었습니다.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '수정 실패',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// 콘텐츠 삭제
export function useDeleteContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/contents/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentKeys.lists() });
      toast({
        title: '삭제 완료',
        description: '콘텐츠가 삭제되었습니다.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '삭제 실패',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// 콘텐츠 생성 시작
export function useGenerateContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<{ data: Content }>(`/contents/${id}/generate`);
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: contentKeys.detail(data.id) });
      toast({
        title: '생성 시작',
        description: 'AI가 콘텐츠를 생성하고 있습니다.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '생성 실패',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// 콘텐츠 게시
export function usePublishContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, platforms }: { id: string; platforms: string[] }) => {
      const { data } = await apiClient.post<{ data: Content }>(`/contents/${id}/publish`, {
        platforms,
      });
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: contentKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: contentKeys.lists() });
      toast({
        title: '게시 완료',
        description: '콘텐츠가 성공적으로 게시되었습니다.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '게시 실패',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
```

---

## 5. 페이지 구현

### 5.1 대시보드 페이지

```tsx
// app/(dashboard)/dashboard/page.tsx
import { Suspense } from 'react';
import { Metadata } from 'next';
import { StatsCards } from '@/components/features/dashboard/stats-cards';
import { RecentContents } from '@/components/features/dashboard/recent-contents';
import { UsageChart } from '@/components/features/dashboard/usage-chart';
import { QuickActions } from '@/components/features/dashboard/quick-actions';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Dashboard | AutoClip',
  description: 'AutoClip 대시보드',
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
        <p className="text-muted-foreground">
          콘텐츠 생성 현황과 채널 성과를 한눈에 확인하세요.
        </p>
      </div>

      {/* 통계 카드 */}
      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards />
      </Suspense>

      {/* 빠른 작업 */}
      <QuickActions />

      {/* 차트 & 최근 콘텐츠 */}
      <div className="grid gap-6 lg:grid-cols-7">
        <Suspense fallback={<ChartSkeleton />}>
          <UsageChart className="lg:col-span-4" />
        </Suspense>
        <Suspense fallback={<RecentContentsSkeleton />}>
          <RecentContents className="lg:col-span-3" />
        </Suspense>
      </div>
    </div>
  );
}

function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return <Skeleton className="h-[400px] lg:col-span-4" />;
}

function RecentContentsSkeleton() {
  return <Skeleton className="h-[400px] lg:col-span-3" />;
}
```

### 5.2 콘텐츠 생성 페이지

```tsx
// app/(dashboard)/contents/create/page.tsx
import { Metadata } from 'next';
import { ContentWizard } from '@/components/forms/content-wizard';

export const metadata: Metadata = {
  title: '새 콘텐츠 생성 | AutoClip',
  description: 'AI로 새로운 동영상 콘텐츠를 생성합니다.',
};

interface CreateContentPageProps {
  searchParams: { projectId?: string };
}

export default function CreateContentPage({ searchParams }: CreateContentPageProps) {
  const projectId = searchParams.projectId;

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-xl font-semibold mb-2">프로젝트를 선택해주세요</h2>
        <p className="text-muted-foreground">
          콘텐츠를 생성하려면 먼저 프로젝트를 선택해야 합니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">새 콘텐츠 생성</h1>
        <p className="text-muted-foreground">
          몇 가지 설정만 하면 AI가 자동으로 콘텐츠를 생성합니다.
        </p>
      </div>

      <ContentWizard projectId={projectId} />
    </div>
  );
}
```

---

## 6. 레이아웃 컴포넌트

### 6.1 대시보드 레이아웃

```tsx
// app/(dashboard)/layout.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Toaster } from '@/components/ui/toaster';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={session.user} />
      <div className="flex">
        <Sidebar className="hidden lg:flex" />
        <main className="flex-1 p-6 lg:p-8 lg:ml-64">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
```

### 6.2 사이드바 컴포넌트

```tsx
// components/layout/sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  FileVideo,
  LayoutTemplate,
  BarChart3,
  Settings,
  CreditCard,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSubscription } from '@/hooks/use-subscription';

const mainNavItems = [
  { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/projects', label: '프로젝트', icon: FolderKanban },
  { href: '/contents', label: '콘텐츠', icon: FileVideo },
  { href: '/templates', label: '템플릿', icon: LayoutTemplate },
  { href: '/analytics', label: '분석', icon: BarChart3 },
];

const secondaryNavItems = [
  { href: '/settings', label: '설정', icon: Settings },
  { href: '/settings/billing', label: '구독 & 결제', icon: CreditCard },
  { href: '/help', label: '도움말', icon: HelpCircle },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { data: subscription } = useSubscription();

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-64 border-r bg-background',
        className
      )}
    >
      <ScrollArea className="h-full py-6">
        <div className="space-y-6 px-3">
          {/* 크레딧 표시 */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="text-sm font-medium">남은 크레딧</div>
            <div className="mt-1 text-2xl font-bold">
              {subscription?.remainingCredits ?? 0}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {subscription?.planName ?? 'Free'} 플랜
            </div>
            <Button size="sm" className="mt-3 w-full" asChild>
              <Link href="/settings/billing">업그레이드</Link>
            </Button>
          </div>

          {/* 메인 네비게이션 */}
          <nav className="space-y-1">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* 구분선 */}
          <div className="border-t" />

          {/* 보조 네비게이션 */}
          <nav className="space-y-1">
            {secondaryNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </ScrollArea>
    </aside>
  );
}
```

---

## 7. 스타일 가이드

### 7.1 Tailwind 설정

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultTheme';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-pretendard)', ...fontFamily.sans],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-in-from-top': {
          from: { transform: 'translateY(-10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in': 'slide-in-from-top 0.3s ease-out',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
  ],
};

export default config;
```

### 7.2 CSS 변수

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: 'rlig' 1, 'calt' 1;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
  
  .animate-in {
    animation: fade-in 0.3s ease-out;
  }
}
```

---

## 8. 성능 최적화

### 8.1 이미지 최적화

```tsx
// components/shared/optimized-image.tsx
import Image, { ImageProps } from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface OptimizedImageProps extends Omit<ImageProps, 'onError'> {
  fallback?: string;
}

export function OptimizedImage({
  src,
  alt,
  className,
  fallback = '/images/placeholder.png',
  ...props
}: OptimizedImageProps) {
  const [error, setError] = useState(false);

  return (
    <Image
      src={error ? fallback : src}
      alt={alt}
      className={cn('object-cover', className)}
      onError={() => setError(true)}
      loading="lazy"
      {...props}
    />
  );
}
```

### 8.2 무한 스크롤

```tsx
// hooks/use-infinite-contents.ts
import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Content } from '@/types/content';

interface ContentPage {
  data: Content[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useInfiniteContents(filters?: Record<string, unknown>) {
  return useInfiniteQuery({
    queryKey: ['contents', 'infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await apiClient.get<ContentPage>('/contents', {
        params: { ...filters, page: pageParam, limit: 12 },
      });
      return data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.page < lastPage.meta.totalPages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
}
```

### 8.3 코드 스플리팅

```tsx
// 동적 임포트 예시
import dynamic from 'next/dynamic';

// 무거운 컴포넌트 지연 로딩
const VideoPlayer = dynamic(
  () => import('@/components/shared/video-player'),
  {
    loading: () => <div className="animate-pulse bg-muted aspect-video" />,
    ssr: false,
  }
);

const AnalyticsChart = dynamic(
  () => import('@/components/features/analytics/performance-chart'),
  {
    loading: () => <div className="animate-pulse bg-muted h-[400px]" />,
  }
);
```

---

## 9. 테스트

### 9.1 컴포넌트 테스트

```tsx
// __tests__/components/content-card.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ContentCard } from '@/components/features/contents/content-card';

const mockContent = {
  id: '1',
  title: 'Test Content',
  status: 'ready' as const,
  thumbnailUrl: 'https://example.com/thumb.jpg',
  createdAt: '2024-01-01T00:00:00Z',
  platform: 'YouTube',
};

describe('ContentCard', () => {
  it('renders content information correctly', () => {
    render(<ContentCard content={mockContent} />);
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.getByText('YouTube')).toBeInTheDocument();
    expect(screen.getByText('준비됨')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = jest.fn();
    render(<ContentCard content={mockContent} onEdit={onEdit} />);
    
    fireEvent.click(screen.getByText('편집'));
    expect(onEdit).toHaveBeenCalledWith('1');
  });

  it('shows publish button only for ready status', () => {
    const onPublish = jest.fn();
    render(<ContentCard content={mockContent} onPublish={onPublish} />);
    
    expect(screen.getByText('게시')).toBeInTheDocument();
  });

  it('hides publish button for draft status', () => {
    const onPublish = jest.fn();
    render(
      <ContentCard 
        content={{ ...mockContent, status: 'draft' }} 
        onPublish={onPublish} 
      />
    );
    
    expect(screen.queryByText('게시')).not.toBeInTheDocument();
  });
});
```

---

## 10. 개발 환경 설정

### 10.1 환경 변수

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Analytics (Optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### 10.2 개발 서버 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 타입 체크
npm run type-check

# 린트
npm run lint

# 테스트
npm run test

# Storybook
npm run storybook

# 빌드
npm run build
```

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0.0 | 2024-12-24 | 초기 버전 |
