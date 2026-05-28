'use client';

import { useState } from 'react';
import { ConnectModal, useCurrentAccount, useCurrentWallet, useDisconnectWallet } from '@mysten/dapp-kit';
import { LogOut, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

interface WalletConnectButtonProps {
  compact?: boolean;
  className?: string;
}

export function WalletConnectButton({ compact = false, className }: WalletConnectButtonProps) {
  const [open, setOpen] = useState(false);
  const account = useCurrentAccount();
  const wallet = useCurrentWallet();
  const disconnect = useDisconnectWallet();

  if (account) {
    return (
      <div
        className={cn(
          'glass-effect-strong border border-cyan-500/30 rounded-lg px-3 py-2 flex items-center gap-2',
          compact ? 'justify-between' : 'justify-center',
          className
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Wallet className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <div className="min-w-0">
            {!compact && (
              <p className="text-[10px] uppercase tracking-wide text-gray-500">
                {wallet.currentWallet?.name || 'Sui Wallet'}
              </p>
            )}
            <p className="text-xs text-cyan-300 font-mono truncate">
              {shortenAddress(account.address)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => disconnect.mutate()}
          disabled={disconnect.isPending}
          className="p-1.5 rounded-md text-gray-400 hover:text-pink-300 hover:bg-pink-500/10 transition disabled:opacity-50"
          aria-label="Disconnect wallet"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <ConnectModal
      open={open}
      onOpenChange={setOpen}
      trigger={
        <button
          type="button"
          className={cn(
            'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-black font-semibold hover:bg-cyan-400 transition glow-cyan',
            compact && 'w-full',
            className
          )}
        >
          <Wallet className="w-4 h-4" />
          Connect Wallet
        </button>
      }
    />
  );
}
