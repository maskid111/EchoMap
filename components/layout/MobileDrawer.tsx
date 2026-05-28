'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { WalletConnectButton } from '@/components/WalletConnectButton';
import { AppNavList } from './AppSidebar';
import { cn } from '@/lib/utils';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <>
      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-[65] bg-black/50 backdrop-blur-sm transition-opacity lg:hidden',
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
      />
      <aside
        className={cn(
          'fixed bottom-0 left-0 top-0 z-[70] flex w-[min(20rem,86vw)] flex-col gap-6 border-r border-cyan-500/20 bg-[#070b18]/95 p-5 pt-[calc(env(safe-area-inset-top)+1rem)] shadow-[0_0_40px_rgba(0,217,255,.16)] backdrop-blur-xl transition-transform duration-300 lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between gap-3">
          <Link href="/" onClick={onClose} className="flex min-w-0 items-center gap-2">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 text-sm font-bold text-white">
              EM
            </div>
            <span className="truncate text-xl font-bold text-white">EchoMap</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 transition hover:bg-cyan-500/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <AppNavList onNavigate={onClose} compact />

        <div className="mt-auto rounded-lg border border-cyan-500/20 bg-black/35 p-4 text-center backdrop-blur-md">
          <p className="mb-3 text-sm text-gray-400">Connected Wallet</p>
          <WalletConnectButton compact />
        </div>
      </aside>
    </>
  );
}
