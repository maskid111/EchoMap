'use client';

import Link from 'next/link';
import { appNavItems, useActiveNavKey, type AppNavKey } from './AppSidebar';
import { cn } from '@/lib/utils';

const mobileNavKeys: AppNavKey[] = ['explore', 'timeline', 'upload', 'saved', 'profile'];

export function MobileBottomNav() {
  const activeKey = useActiveNavKey();
  const items = mobileNavKeys
    .map((key) => appNavItems.find((item) => item.key === key))
    .filter(Boolean);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-cyan-500/20 bg-black/70 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {items.map((item) => {
          if (!item) return null;
          const isActive = activeKey === item.key;

          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-2 text-[11px] font-semibold transition',
                isActive
                  ? 'border border-cyan-500/40 bg-cyan-500/20 text-cyan-300 shadow-[0_0_18px_rgba(0,217,255,.28)]'
                  : 'text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-300'
              )}
            >
              {item.icon}
              <span>{item.shortLabel}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
