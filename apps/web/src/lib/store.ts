/**
 * Zustand Store - TubeGenius Client State
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================
// Content Generation Store
// ============================================================

export interface ContentGenerationState {
  step: number;
  config: {
    niche: string;
    topic: string;
    tone: string;
    format: string;
    language: string;
  };
  generatedContent: {
    title?: string;
    script?: string;
    imagePrompts?: string[];
  } | null;
  isGenerating: boolean;
  error: string | null;
}

interface ContentGenerationActions {
  setStep: (step: number) => void;
  updateConfig: (updates: Partial<ContentGenerationState['config']>) => void;
  setGeneratedContent: (content: ContentGenerationState['generatedContent']) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialGenerationState: ContentGenerationState = {
  step: 1,
  config: {
    niche: 'Senior Health',
    topic: '',
    tone: 'Friendly',
    format: 'Shorts',
    language: 'ko',
  },
  generatedContent: null,
  isGenerating: false,
  error: null,
};

export const useContentGenerationStore = create<ContentGenerationState & ContentGenerationActions>()(
  (set) => ({
    ...initialGenerationState,

    setStep: (step) => set({ step }),

    updateConfig: (updates) =>
      set((state) => ({
        config: { ...state.config, ...updates },
      })),

    setGeneratedContent: (content) => set({ generatedContent: content }),

    setIsGenerating: (isGenerating) => set({ isGenerating }),

    setError: (error) => set({ error }),

    reset: () => set(initialGenerationState),
  })
);

// ============================================================
// UI State Store
// ============================================================

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  language: 'ko' | 'en';
}

interface UIActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: UIState['theme']) => void;
  setLanguage: (language: UIState['language']) => void;
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'system',
      language: 'ko',

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'tubegenius-ui',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
      }),
    }
  )
);

// ============================================================
// Project Selection Store
// ============================================================

interface ProjectState {
  selectedProjectId: string | null;
  recentProjectIds: string[];
}

interface ProjectActions {
  selectProject: (id: string | null) => void;
  addRecentProject: (id: string) => void;
  clearRecentProjects: () => void;
}

export const useProjectStore = create<ProjectState & ProjectActions>()(
  persist(
    (set) => ({
      selectedProjectId: null,
      recentProjectIds: [],

      selectProject: (id) =>
        set((state) => {
          if (id && !state.recentProjectIds.includes(id)) {
            return {
              selectedProjectId: id,
              recentProjectIds: [id, ...state.recentProjectIds].slice(0, 5),
            };
          }
          return { selectedProjectId: id };
        }),

      addRecentProject: (id) =>
        set((state) => ({
          recentProjectIds: [id, ...state.recentProjectIds.filter((p) => p !== id)].slice(0, 5),
        })),

      clearRecentProjects: () => set({ recentProjectIds: [] }),
    }),
    {
      name: 'tubegenius-projects',
    }
  )
);

// ============================================================
// Notification Store
// ============================================================

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationState {
  notifications: Notification[];
}

interface NotificationActions {
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState & NotificationActions>()((set) => ({
  notifications: [],

  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          ...notification,
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        },
      ],
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearNotifications: () => set({ notifications: [] }),
}));
