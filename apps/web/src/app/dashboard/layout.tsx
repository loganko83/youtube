'use client';

import { Sidebar } from '@/components/sidebar';
import { useAppStore } from '@/store';
import { cn } from '@tubegenius/ui';
import { ToastContainer } from '@/components/ui/toast';
import { ProcessingQueue } from '@/components/ui/processing-queue';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarOpen } = useAppStore();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main
        className={cn(
          'transition-all duration-300',
          'lg:ml-64',
          sidebarOpen ? 'ml-0' : 'ml-0'
        )}
      >
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>

      {/* Global UI Components */}
      <ToastContainer />
      <ProcessingQueue />
    </div>
  );
}
