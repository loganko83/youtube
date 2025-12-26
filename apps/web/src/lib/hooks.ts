/**
 * React Query Hooks - TubeGenius Data Fetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, User, Project, ContentConfig, CostBreakdown, SuccessRateMetrics, AutomationMetricsData } from './api';

// ============================================================
// Query Keys
// ============================================================

export const queryKeys = {
  user: ['user'] as const,
  projects: (page?: number) => ['projects', page] as const,
  project: (id: string) => ['project', id] as const,
  contents: (projectId?: string, page?: number) => ['contents', projectId, page] as const,
  content: (id: string) => ['content', id] as const,
};

// ============================================================
// Auth Hooks
// ============================================================

export function useUser() {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: () => api.getMe(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      api.login(email, password),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.user, data.user);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password, name }: { email: string; password: string; name: string }) =>
      api.register(email, password, name),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.user, data.user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return () => {
    api.logout();
    queryClient.clear();
  };
}

// ============================================================
// Projects Hooks
// ============================================================

export function useProjects(page = 1) {
  return useQuery({
    queryKey: queryKeys.projects(page),
    queryFn: () => api.getProjects(page),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.project(id),
    queryFn: () => api.getProject(id),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      niche?: string;
      settings?: { niche?: string };
      defaultConfig?: Record<string, unknown>;
    }) => {
      const niche = data.niche || data.settings?.niche || 'senior_health';
      return api.createProject({
        name: data.name,
        description: data.description,
        niche,
        defaultConfig: data.defaultConfig,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) =>
      api.updateProject(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.project(id) });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

// ============================================================
// Contents Hooks
// ============================================================

export function useContents(projectId?: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: queryKeys.contents(projectId, page),
    queryFn: () => api.getContents(projectId, page, limit),
  });
}

export function useContent(id: string) {
  return useQuery({
    queryKey: queryKeys.content(id),
    queryFn: () => api.getContent(id),
    enabled: !!id,
    refetchInterval: (data) => {
      // Refetch while content is processing
      const status = data?.state?.data?.status;
      if (status && !['completed', 'failed'].includes(status)) {
        return 3000; // Refetch every 3 seconds
      }
      return false;
    },
  });
}

export function useCreateContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, config }: { projectId: string; title?: string; config: ContentConfig }) =>
      api.createContent(projectId, config),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['contents'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
    },
  });
}

export function useDeleteContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteContent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contents'] });
    },
  });
}

// ============================================================
// Dashboard Stats Hook
// ============================================================

export function useDashboardStats() {
  const { data: projects } = useProjects(1);
  const { data: contents } = useContents(undefined, 1);

  const stats = {
    totalProjects: projects?.meta?.total || 0,
    totalContents: contents?.meta?.total || 0,
    pendingContents: contents?.items?.filter(c =>
      !['completed', 'failed'].includes(c.status)
    ).length || 0,
    completedToday: contents?.items?.filter(c => {
      const today = new Date().toDateString();
      return c.status === 'completed' && new Date(c.createdAt).toDateString() === today;
    }).length || 0,
  };

  return {
    stats,
    isLoading: !projects || !contents,
  };
}

// ============================================================
// Analytics Hooks
// ============================================================

export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const response = await api.getAnalytics();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCostBreakdown() {
  return useQuery({
    queryKey: ['analytics', 'costs'],
    queryFn: async () => {
      const response = await api.getCostBreakdown();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSuccessRates() {
  return useQuery({
    queryKey: ['analytics', 'success-rates'],
    queryFn: async () => {
      const response = await api.getSuccessRates();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAutomationAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'automation'],
    queryFn: async () => {
      const response = await api.getAutomationMetricsData();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
