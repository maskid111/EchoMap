'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Clock, Globe, Heart, Home, Settings, Tag, Upload, User } from 'lucide-react';
import type { ReactNode } from 'react';
import { GlassCard } from '@/components/GlassCard';
import { WalletConnectButton } from '@/components/WalletConnectButton';
import { cn } from '@/lib/utils';

export type AppNavKey = 'home' | 'explore' | 'timeline' | 'categories' | 'saved' | 'upload' | 'profile' | 'settings';

export interface AppNavItem {
  key: AppNavKey;
  label: string;
  shortLabel: string;
  href: string;
  icon: ReactNode;
}

export const appNavItems: AppNavItem[] = [
  { key: 'home', label: 'Home', shortLabel: 'Home', href: '/', icon: <Home className="h-5 w-5" /> },
  { key: 'explore', label: 'Explore', shortLabel: 'Explore', href: '/explore', icon: <Globe className="h-5 w-5" /> },
  { key: 'timeline', label: 'Timeline', shortLabel: 'Timeline', href: '/explore?view=timeline', icon: <Clock className="h-5 w-5" /> },
  { key: 'categories', label: 'Categories', shortLabel: 'Tags', href: '/explore?view=categories', icon: <Tag className="h-5 w-5" /> },
  { key: 'saved', label: 'Saved', shortLabel: 'Saved', href: '/explore?view=saved', icon: <Heart className="h-5 w-5" /> },
  { key: 'upload', label: 'Upload', shortLabel: 'Upload', href: '/upload', icon: <Upload className="h-5 w-5" /> },
  { key: 'profile', label: 'Profile', shortLabel: 'Profile', href: '/profile', icon: <User className="h-5 w-5" /> },
  { key: 'settings', label: 'Settings', shortLabel: 'Settings', href: '/settings', icon: <Settings className="h-5 w-5" /> },
];

export function getActiveNavKey(pathname: string, view: string | null): AppNavKey {
  if (pathname === '/') return 'home';
  if (pathname === '/upload') return 'upload';
  if (pathname === '/profile') return 'profile';
  if (pathname === '/settings') return 'settings';

  if (pathname === '/explore') {
    if (view === 'timeline') return 'timeline';
    if (view === 'categories') return 'categories';
    if (view === 'saved') return 'saved';
    return 'explore';
  }

  return 'explore';
}

export function useActiveNavKey() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return getActiveNavKey(pathname, searchParams.get('view'));
}

interface AppNavListProps {
  onNavigate?: () => void;
  compact?: boolean;
}

export function AppNavList({ onNavigate, compact = false }: AppNavListProps) {
  const activeKey = useActiveNavKey();

  return (
    <nav className="flex flex-col gap-2">
      {appNavItems.map((item) => {
        const isActive = activeKey === item.key;
        return (
          <Link
            key={item.key}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg transition-all duration-200',
              compact ? 'px-3 py-3' : 'px-4 py-3',
              isActive
                ? 'border border-cyan-500/50 bg-cyan-500/20 text-cyan-400 glow-cyan'
                : 'text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-300'
            )}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppSidebar() {
  return (
    <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-64 flex-col gap-8 border-r border-cyan-500/20 bg-black/40 p-6 backdrop-blur-md lg:flex">
      <Link href="/" className="flex items-center gap-2 group">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 text-sm font-bold text-white transition group-hover:glow-cyan">
          EM
        </div>
        <span className="text-xl font-bold text-white">EchoMap</span>
      </Link>

      <AppNavList />

      <div className="mt-auto">
        <GlassCard strong className="p-4 text-center">
          <p className="mb-3 text-sm text-gray-400">Connected Wallet</p>
          <WalletConnectButton compact />
        </GlassCard>
      </div>
    </aside>
  );
}
