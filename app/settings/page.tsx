'use client';

import { useEffect, useState } from 'react';
import { useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';
import { Copy, Database, ExternalLink, Shield, Trash2, Wallet } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { GlassCard } from '@/components/GlassCard';
import { GlowButton } from '@/components/GlowButton';
import { WalletConnectButton } from '@/components/WalletConnectButton';
import { defaultSuiNetwork, suiRpcUrl, tatumSuiRpcUrl } from '@/lib/sui-client';
import { validateWalrusConfig } from '@/lib/walrus';
import { getRegistryConfig } from '@/lib/registry';
import { useMemoryStore } from '@/store/memory-store';

function shortenAddress(address: string) {
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

function StatusRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-cyan-500/15 bg-black/25 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="min-w-0 text-sm text-gray-300">{label}</span>
      <span className={enabled ? 'w-fit rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-300' : 'w-fit rounded-full bg-gray-500/10 px-3 py-1 text-xs font-semibold text-gray-500'}>
        {enabled ? 'Configured' : 'Missing'}
      </span>
    </div>
  );
}

export default function SettingsPage() {
  const account = useCurrentAccount();
  const disconnect = useDisconnectWallet();
  const [copied, setCopied] = useState(false);
  const [tatumStatus, setTatumStatus] = useState({
    rpcConfigured: Boolean(tatumSuiRpcUrl),
    apiKeyConfigured: false,
  });
  const {
    uploadedMemories,
    savedMemoryIds,
    clearUploadedMemories,
    clearSavedMemories,
    clearLocalEchoMapData,
  } = useMemoryStore();
  const walrusConfig = validateWalrusConfig();
  const registryConfig = getRegistryConfig();
  const walrusMode = [walrusConfig.publisherUrl, walrusConfig.aggregatorUrl].some((url) => url.includes('mainnet'))
    ? 'mainnet'
    : 'testnet';

  useEffect(() => {
    let mounted = true;
    fetch('/api/tatum/sui/status')
      .then((response) => response.json())
      .then((payload: { rpcConfigured?: boolean; apiKeyConfigured?: boolean }) => {
        if (mounted) {
          setTatumStatus({
            rpcConfigured: Boolean(payload.rpcConfigured),
            apiKeyConfigured: Boolean(payload.apiKeyConfigured),
          });
        }
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  const copyWallet = async () => {
    if (!account) return;
    await navigator.clipboard.writeText(account.address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const confirmAction = (message: string, action: () => void) => {
    if (window.confirm(message)) {
      action();
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
        <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">Settings</h1>
        <p className="mb-8 text-gray-400">Manage your EchoMap wallet, network, storage, and local app data.</p>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <GlassCard strong className="p-5 sm:p-8">
            <div className="mb-5 flex items-center gap-3">
              <Wallet className="h-5 w-5 text-cyan-300" />
              <h2 className="text-xl font-bold text-white">Wallet</h2>
            </div>
            {account ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-cyan-500/20 bg-black/30 p-4">
                  <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">Connected address</p>
                  <p className="truncate font-mono text-sm text-cyan-200">{shortenAddress(account.address)}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <GlowButton variant="ghost" onClick={copyWallet}>
                    <Copy className="h-4 w-4" />
                    {copied ? 'Copied' : 'Copy Address'}
                  </GlowButton>
                  <a
                    href={`https://suiscan.xyz/${defaultSuiNetwork}/account/${account.address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-500/50 bg-transparent px-6 py-3 font-semibold text-cyan-300 transition-all duration-200 hover:bg-cyan-500/10"
                  >
                    <ExternalLink className="h-4 w-4" />
                    SuiScan
                  </a>
                  <GlowButton variant="accent" onClick={() => disconnect.mutate()} disabled={disconnect.isPending}>
                    Disconnect
                  </GlowButton>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-400">Wallet not connected. Connect a Sui wallet to create proof transactions after Walrus upload.</p>
                <WalletConnectButton />
              </div>
            )}
          </GlassCard>

          <GlassCard strong className="p-5 sm:p-8">
            <div className="mb-5 flex items-center gap-3">
              <Shield className="h-5 w-5 text-purple-300" />
              <h2 className="text-xl font-bold text-white">Network</h2>
            </div>
            <div className="space-y-3">
              <div className="rounded-lg border border-purple-500/15 bg-black/25 px-4 py-3">
                <p className="text-sm text-gray-300">Sui network</p>
                <p className="mt-1 font-semibold text-purple-200">{defaultSuiNetwork}</p>
              </div>
              <StatusRow label="Browser Sui RPC" enabled={Boolean(suiRpcUrl)} />
              <StatusRow label="EchoMap registry package" enabled={registryConfig.configured} />
              <StatusRow label="Tatum RPC env" enabled={tatumStatus.rpcConfigured} />
              <StatusRow label="Tatum API key env" enabled={tatumStatus.apiKeyConfigured} />
              <p className="text-xs text-gray-500">API keys are never displayed. Tatum is reserved for future server-side verification/proxying.</p>
            </div>
          </GlassCard>

          <GlassCard strong className="p-5 sm:p-8">
            <div className="mb-5 flex items-center gap-3">
              <Database className="h-5 w-5 text-cyan-300" />
              <h2 className="text-xl font-bold text-white">Storage</h2>
            </div>
            <div className="space-y-3">
              <StatusRow label="Walrus publisher" enabled={Boolean(walrusConfig.publisherUrl)} />
              <StatusRow label="Walrus aggregator" enabled={Boolean(walrusConfig.aggregatorUrl)} />
              <div className="rounded-lg border border-cyan-500/15 bg-black/25 px-4 py-3">
                <p className="text-sm text-gray-300">Walrus mode</p>
                <p className="mt-1 font-semibold text-cyan-200">{walrusMode}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard strong className="p-5 sm:p-8">
            <div className="mb-5 flex items-center gap-3">
              <Trash2 className="h-5 w-5 text-pink-300" />
              <h2 className="text-xl font-bold text-white">Local Data</h2>
            </div>
            <p className="mb-5 text-sm text-gray-400">
              EchoMap uses Sui registry events as the source of truth. Browser cache is only used after successful on-chain sync.
            </p>
            <div className="mb-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-black/25 p-3 text-center">
                <p className="text-2xl font-bold text-cyan-300">{uploadedMemories.length}</p>
                <p className="text-xs text-gray-500">Local uploads</p>
              </div>
              <div className="rounded-lg bg-black/25 p-3 text-center">
                <p className="text-2xl font-bold text-pink-300">{savedMemoryIds.length}</p>
                <p className="text-xs text-gray-500">Saved IDs</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <GlowButton variant="ghost" onClick={() => confirmAction('Clear uploaded local memories from this browser?', clearUploadedMemories)}>
                Clear Uploads
              </GlowButton>
              <GlowButton variant="ghost" onClick={() => confirmAction('Clear saved memories from this browser?', clearSavedMemories)}>
                Clear Saved
              </GlowButton>
              <GlowButton variant="accent" onClick={() => confirmAction('Clear all local EchoMap data from this browser?', clearLocalEchoMapData)}>
                Clear All
              </GlowButton>
            </div>
          </GlassCard>

          <GlassCard strong className="p-5 sm:p-8 lg:col-span-2">
            <h2 className="mb-3 text-xl font-bold text-white">Public Indexing</h2>
            <p className="text-sm leading-relaxed text-gray-400">
              New uploads are real Walrus media and metadata blobs with optional Sui proof transactions. EchoMap uses Sui registry events
              as the source of truth. Browser cache is only used after successful on-chain sync.
              Unlisted memories are hidden from public Explore but still stored on Walrus and linked to your wallet.
              Profile cache is scoped by wallet address so disconnected or different wallets do not reuse another profile.
            </p>
          </GlassCard>
        </div>
      </div>
    </AppShell>
  );
}
