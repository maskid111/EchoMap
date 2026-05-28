'use client';

import { useCallback, useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import type { MemoryDetail } from '@/lib/types';
import { getRegistryConfig, saveMemoryOnRegistry, unsaveMemoryOnRegistry } from '@/lib/registry';
import { useMemoryStore } from '@/store/memory-store';

function isSuiAddress(value: string | undefined) {
  return Boolean(value && /^0x[a-fA-F0-9]+$/.test(value.trim()));
}

export function useRegistrySavedMemory(memory: MemoryDetail | null | undefined) {
  const account = useCurrentAccount();
  const signAndExecuteTransaction = useSignAndExecuteTransaction();
  const {
    isMemorySaved,
    saveMemory,
    unsaveMemory,
    refreshSavedMemoriesFromRegistry,
  } = useMemoryStore();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saved = memory ? isMemorySaved(memory.id) : false;

  const toggleSave = useCallback(async () => {
    if (!memory) return;
    setSaveError(null);

    const config = getRegistryConfig();
    const canUseRegistry =
      config.configured &&
      account &&
      memory.metadataWalrusBlobId &&
      (!saved ? isSuiAddress(memory.creatorWallet) : true);

    if (!canUseRegistry) {
      setSaveError(
        !account
          ? 'Connect wallet to save memories.'
          : 'Save failed. EchoMap registry is not configured.'
      );
      return;
    }

    setIsSaving(true);

    try {
      const transaction = saved
        ? unsaveMemoryOnRegistry({
            metadataWalrusBlobId: memory.metadataWalrusBlobId!,
          })
        : saveMemoryOnRegistry({
            metadataWalrusBlobId: memory.metadataWalrusBlobId!,
            memoryCreator: memory.creatorWallet,
          });

      await signAndExecuteTransaction.mutateAsync({
        transaction,
        account,
      });
      if (saved) {
        unsaveMemory(memory.id);
      } else {
        saveMemory(memory.id);
      }
      await refreshSavedMemoriesFromRegistry(account.address);
    } catch (error) {
      setSaveError('Save failed. Your wallet needs SUI for gas.');
      if (process.env.NODE_ENV === 'development') {
        console.info('Unable to sync saved memory with Sui registry.', error);
      }
    } finally {
      setIsSaving(false);
    }
  }, [
    account,
    memory,
    refreshSavedMemoriesFromRegistry,
    saveMemory,
    saved,
    signAndExecuteTransaction,
    unsaveMemory,
  ]);

  return {
    saved,
    isSaving,
    saveError,
    toggleSave,
  };
}
