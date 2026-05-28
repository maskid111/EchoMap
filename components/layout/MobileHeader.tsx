'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';
import { WalletConnectButton } from '@/components/WalletConnectButton';

interface MobileHeaderProps {
  onOpenMenu: () => void;
}

export function MobileHeader({ onOpenMenu }: MobileHeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-cyan-500/20 bg-black/70 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur-xl lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open navigation menu"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 transition hover:bg-cyan-500/20"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/" className="flex min-w-0 flex-1 items-center justify-center gap-2">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 text-xs font-bold text-white">
            EM
          </div>
          <span className="truncate text-lg font-bold text-white">EchoMap</span>
        </Link>

        <div className="flex max-w-[8.5rem] justify-end">
          <WalletConnectButton compact />
        </div>
      </div>
    </header>
  );
}
