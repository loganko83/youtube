'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@tubegenius/ui';
import { useAppStore } from '@/store';
import {
  LayoutDashboard,
  FolderKanban,
  Sparkles,
  Settings,
  Menu,
  X,
  Youtube,
  TrendingUp,
  Zap,
  BarChart3,
} from 'lucide-react';

const navigation = [
  {
    name: '대시보드',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: '프로젝트',
    href: '/dashboard/projects',
    icon: FolderKanban,
  },
  {
    name: '콘텐츠 생성',
    href: '/dashboard/generator',
    icon: Sparkles,
  },
  {
    name: '트렌드',
    href: '/dashboard/trends',
    icon: TrendingUp,
  },
  {
    name: '자동화',
    href: '/dashboard/automation',
    icon: Zap,
  },
  {
    name: '분석',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    name: '설정',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useAppStore();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-gray-200 transition-transform duration-300',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Youtube className="w-8 h-8 text-tube-600" />
            <span className="font-bold text-xl text-tube-800">TubeGenius</span>
          </Link>
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-tube-50 text-tube-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            TubeGenius AI v0.1.0
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-40 lg:hidden p-2 bg-white border border-gray-200 rounded-md shadow-sm"
      >
        <Menu className="w-5 h-5" />
      </button>
    </>
  );
}
