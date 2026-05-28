'use client';

import { Suspense, type ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { AppSidebar } from './AppSidebar';
import { MobileDrawer } from './MobileDrawer';
import { MobileHeader } from './MobileHeader';
import { cn } from '@/lib/utils';
import { getRegistryConfig } from '@/lib/registry';
import { useMemoryStore } from '@/store/memory-store';

interface AppShellProps {
  children: ReactNode;
  className?: string;
}

function RegistryWalletSync() {
  const account = useCurrentAccount();
  const {
    walletRegistryMemories,
    clearWalletRegistryMemories,
    refreshRegistryMemories,
    refreshSavedMemoriesFromRegistry,
  } = useMemoryStore();

  useEffect(() => {
    if (!account) {
      clearWalletRegistryMemories();
      return;
    }
    if (!getRegistryConfig().configured) return;
    void refreshRegistryMemories(account.address);
  }, [account, clearWalletRegistryMemories, refreshRegistryMemories]);

  useEffect(() => {
    if (!account || !getRegistryConfig().configured) return;
    void refreshSavedMemoriesFromRegistry(account.address);
  }, [account, walletRegistryMemories.length, refreshSavedMemoriesFromRegistry]);

  return null;
}

export function AppShell({ children, className }: AppShellProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  return (
    <main className={cn('min-h-screen overflow-x-hidden bg-background pt-[calc(env(safe-area-inset-top)+4.25rem)] lg:pt-0', className)}>
      <Suspense fallback={null}>
        <AppSidebar />
      </Suspense>
      <MobileHeader onOpenMenu={openDrawer} />
      <Suspense fallback={null}>
        <MobileDrawer isOpen={isDrawerOpen} onClose={closeDrawer} />
      </Suspense>
      <RegistryWalletSync />
      <div className="min-h-screen lg:ml-64">{children}</div>
    </main>
  );
}
