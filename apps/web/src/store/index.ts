/**
 * TubeGenius AI - Zustand Store
 * Client-side state management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Project, ContentJob } from '@tubegenius/shared';

interface AppState {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;

  // Current project
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;

  // Sidebar state
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Content generation wizard state
  wizardStep: number;
  setWizardStep: (step: number) => void;
  resetWizard: () => void;

  // Active jobs
  activeJobs: ContentJob[];
  addJob: (job: ContentJob) => void;
  updateJob: (jobId: string, updates: Partial<ContentJob>) => void;
  removeJob: (jobId: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // User state
      user: null,
      setUser: (user) => set({ user }),

      // Current project
      currentProject: null,
      setCurrentProject: (currentProject) => set({ currentProject }),

      // Sidebar state
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

      // Wizard state
      wizardStep: 0,
      setWizardStep: (wizardStep) => set({ wizardStep }),
      resetWizard: () => set({ wizardStep: 0 }),

      // Active jobs
      activeJobs: [],
      addJob: (job) =>
        set((state) => ({
          activeJobs: [...state.activeJobs, job],
        })),
      updateJob: (jobId, updates) =>
        set((state) => ({
          activeJobs: state.activeJobs.map((job) =>
            job.id === jobId ? { ...job, ...updates } : job
          ),
        })),
      removeJob: (jobId) =>
        set((state) => ({
          activeJobs: state.activeJobs.filter((job) => job.id !== jobId),
        })),
    }),
    {
      name: 'tubegenius-storage',
      partialize: (state) => ({
        user: state.user,
        currentProject: state.currentProject,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
