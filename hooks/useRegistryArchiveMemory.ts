'use client';

import { useCallback, useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import type { MemoryDetail } from '@/lib/types';
import { archiveMemoryOnRegistry, getRegistryConfig, restoreMemoryOnRegistry } from '@/lib/registry';
import { useMemoryStore } from '@/store/memory-store';

function isSameAddress(a: string | undefined, b: string | undefined) {
  return Boolean(a && b && a.trim().toLowerCase() === b.trim().toLowerCase());
}

export function useRegistryArchiveMemory(memory: MemoryDetail | null | undefined) {
  const account = useCurrentAccount();
  const signAndExecuteTransaction = useSignAndExecuteTransaction();
  const { refreshRegistryMemories } = useMemoryStore();
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const isOwner = isSameAddress(account?.address, memory?.creatorWallet);
  const archived = Boolean(memory?.archived);

  const syncArchiveState = useCallback(async (nextArchived: boolean) => {
    if (!memory) return false;
    setArchiveError(null);

    const config = getRegistryConfig();
    if (!account) {
      setArchiveError('Connect wallet to manage this memory.');
      return false;
    }
    if (!config.configured) {
      setArchiveError('Archive failed. EchoMap registry is not configured.');
      return false;
    }
    if (!isOwner || !memory.metadataWalrusBlobId) {
      setArchiveError('Only the memory creator can archive or restore this memory.');
      return false;
    }

    setIsArchiving(true);
    try {
      const transaction = nextArchived
        ? archiveMemoryOnRegistry({ metadataWalrusBlobId: memory.metadataWalrusBlobId })
        : restoreMemoryOnRegistry({ metadataWalrusBlobId: memory.metadataWalrusBlobId });

      await signAndExecuteTransaction.mutateAsync({
        transaction,
        account,
      });
      await refreshRegistryMemories(account.address);
      return true;
    } catch (error) {
      setArchiveError(
        nextArchived
          ? 'Archive failed. Your wallet needs SUI for gas.'
          : 'Restore failed. Your wallet needs SUI for gas.'
      );
      if (process.env.NODE_ENV === 'development') {
        console.info('Unable to sync archive state with Sui registry.', error);
      }
      return false;
    } finally {
      setIsArchiving(false);
    }
  }, [account, isOwner, memory, refreshRegistryMemories, signAndExecuteTransaction]);

  return {
    archived,
    isOwner,
    isArchiving,
    archiveError,
    archiveMemory: () => syncArchiveState(true),
    restoreMemory: () => syncArchiveState(false),
  };
}
