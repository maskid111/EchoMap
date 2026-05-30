'use client';

import {
  createContext,
  createElement,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { MemoryDetail, MemoryPin } from '@/lib/types';
import {
  fetchPublicRegistryMemories,
  fetchRegistryMemoriesByWallet,
  fetchSavedMemoryIdsForWallet,
  fetchArchivedMemoryIdsForWallet,
  getRegistryConfig,
} from '@/lib/registry';

interface MemoryStoreValue {
  memories: MemoryPin[];
  memoryDetails: Record<string, MemoryDetail>;
  uploadedMemories: MemoryDetail[];
  registryMemories: MemoryDetail[];
  walletRegistryMemories: MemoryDetail[];
  archivedRegistryMemories: MemoryDetail[];
  savedMemories: MemoryDetail[];
  activeMemory: MemoryDetail | null;
  selectedYear: number;
  selectedCategories: string[];
  searchQuery: string;
  savedMemoryIds: string[];
  filteredMemories: MemoryPin[];
  memoryCountByYear: Record<number, number>;
  setActiveMemoryById: (id: string | null) => void;
  setSelectedYear: (year: number) => void;
  setSelectedCategories: (categories: string[]) => void;
  toggleCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;
  closeActiveMemory: () => void;
  saveMemory: (id: string) => void;
  unsaveMemory: (id: string) => void;
  toggleSavedMemory: (id: string) => void;
  isMemorySaved: (id: string) => boolean;
  addMemory: (memory: MemoryDetail) => void;
  clearUploadedMemories: () => void;
  clearSavedMemories: () => void;
  clearLocalEchoMapData: () => void;
  clearWalletRegistryMemories: () => void;
  refreshRegistryMemories: (walletAddress?: string | null) => Promise<void>;
  refreshSavedMemoriesFromRegistry: (walletAddress?: string | null) => Promise<void>;
  refreshArchivedMemoriesFromRegistry: (walletAddress?: string | null) => Promise<void>;
}

const MemoryStoreContext = createContext<MemoryStoreValue | null>(null);
const uploadedMemoriesStorageKey = 'echomap.uploadedMemories';
const savedMemoriesStorageKey = 'echomap.savedMemoryIds';

function memoryMatchesSearch(
  memory: MemoryPin,
  query: string,
  detailsById: Record<string, MemoryDetail>
) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const detail = detailsById[memory.id];
  const searchable = [
    memory.title,
    memory.location,
    detail?.creator,
    detail?.story,
    ...(detail?.categories || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return searchable.includes(normalizedQuery);
}

function memoryMatchesCategories(
  memory: MemoryPin,
  selectedCategories: string[],
  detailsById: Record<string, MemoryDetail>
) {
  if (selectedCategories.length === 0) {
    return true;
  }

  const categories = detailsById[memory.id]?.categories || [];
  return selectedCategories.some((category) => categories.includes(category));
}

function inferMediaType(memory: MemoryDetail): MemoryDetail['mediaType'] {
  if (memory.mediaType) return memory.mediaType;
  if (memory.mimeType?.startsWith('video/')) return 'video';
  if (memory.mimeType?.startsWith('audio/')) return 'audio';
  if (memory.mimeType?.startsWith('image/')) return 'image';
  const value = `${memory.mediaUrl || memory.image || ''}`.toLowerCase();
  if (/\.(mp4|webm|mov|m4v|ogg)(\?|$)/.test(value)) return 'video';
  if (/\.(mp3|wav|m4a|aac)(\?|$)/.test(value)) return 'audio';
  if (/^(https?:|blob:|data:image)/.test(value)) return 'image';
  return 'unknown';
}

function normalizeUploadedMemory(memory: MemoryDetail): MemoryDetail {
  return {
    ...memory,
    source: 'uploaded',
    visibility: memory.visibility || 'public',
    mediaType: inferMediaType(memory),
  };
}

export function MemoryStoreProvider({ children }: { children: ReactNode }) {
  const [activeMemoryId, setActiveMemoryId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(2023);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedMemoryIds, setSavedMemoryIds] = useState<string[]>([]);
  const [uploadedMemories, setUploadedMemories] = useState<MemoryDetail[]>([]);
  const [registryMemories, setRegistryMemories] = useState<MemoryDetail[]>([]);
  const [walletRegistryMemories, setWalletRegistryMemories] = useState<MemoryDetail[]>([]);
  const [archivedRegistryMemories, setArchivedRegistryMemories] = useState<MemoryDetail[]>([]);

  const persistSavedMemoryIds = useCallback((ids: string[]) => {
    window.localStorage.setItem(savedMemoriesStorageKey, JSON.stringify(ids));
  }, []);

  const refreshRegistryMemories = useCallback(async (walletAddress?: string | null) => {
    if (!getRegistryConfig().configured) return;
    try {
      const publicMemories = await fetchPublicRegistryMemories();
      setRegistryMemories(publicMemories);
      if (walletAddress) {
        const [walletMemories, archivedBlobIds] = await Promise.all([
          fetchRegistryMemoriesByWallet(walletAddress),
          fetchArchivedMemoryIdsForWallet(walletAddress),
        ]);
        const archivedBlobIdSet = new Set(archivedBlobIds);
        setWalletRegistryMemories(
          walletMemories.filter((memory) => !memory.archived && !archivedBlobIdSet.has(memory.metadataWalrusBlobId || ''))
        );
        setArchivedRegistryMemories(
          walletMemories.filter((memory) => memory.archived || archivedBlobIdSet.has(memory.metadataWalrusBlobId || ''))
        );
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.info('Unable to refresh Sui registry memories.', error);
      }
    }
  }, []);

  const findIdsForMetadataBlobIds = useCallback((blobIds: string[], details: Record<string, MemoryDetail>) => {
    const idByBlobId = new Map(
      Object.values(details)
        .filter((memory) => memory.metadataWalrusBlobId)
        .map((memory) => [memory.metadataWalrusBlobId as string, memory.id])
    );

    return blobIds
      .map((blobId) => idByBlobId.get(blobId))
      .filter((id): id is string => Boolean(id));
  }, []);

  useEffect(() => {
    void refreshRegistryMemories();
  }, [refreshRegistryMemories]);

  const allMemories = useMemo<MemoryPin[]>(
    () => {
      const registryIds = new Set(
        [...registryMemories, ...walletRegistryMemories, ...archivedRegistryMemories]
          .map((memory) => memory.metadataWalrusBlobId || memory.id)
      );
      const localOnlyUploads = uploadedMemories.filter(
        (memory) =>
          (memory.visibility || 'public') === 'public' &&
          !memory.archived &&
          Boolean(memory.suiTxDigest && memory.metadataWalrusBlobId) &&
          !registryIds.has(memory.metadataWalrusBlobId || memory.id)
      );
      return [...registryMemories, ...localOnlyUploads];
    },
    [archivedRegistryMemories, registryMemories, uploadedMemories, walletRegistryMemories]
  );

  const allMemoryDetails = useMemo<Record<string, MemoryDetail>>(
    () =>
      [...registryMemories, ...walletRegistryMemories, ...archivedRegistryMemories, ...uploadedMemories].reduce<Record<string, MemoryDetail>>(
        (acc, memory) => {
          acc[memory.id] = memory;
          return acc;
        },
        {}
      ),
    [archivedRegistryMemories, registryMemories, uploadedMemories, walletRegistryMemories]
  );

  const refreshSavedMemoriesFromRegistry = useCallback(async (walletAddress?: string | null) => {
    if (!walletAddress || !getRegistryConfig().configured) return;
    try {
      const metadataBlobIds = await fetchSavedMemoryIdsForWallet(walletAddress);
      const ids = findIdsForMetadataBlobIds(metadataBlobIds, allMemoryDetails);
      setSavedMemoryIds(ids);
      persistSavedMemoryIds(ids);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.info('Unable to refresh Sui registry saved memories.', error);
      }
    }
  }, [allMemoryDetails, findIdsForMetadataBlobIds, persistSavedMemoryIds]);

  const savedMemories = useMemo(
    () => savedMemoryIds
      .map((id) => allMemoryDetails[id])
      .filter((memory): memory is MemoryDetail => Boolean(memory)),
    [allMemoryDetails, savedMemoryIds]
  );

  const refreshArchivedMemoriesFromRegistry = useCallback(async (walletAddress?: string | null) => {
    if (!walletAddress || !getRegistryConfig().configured) return;
    try {
      await refreshRegistryMemories(walletAddress);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.info('Unable to refresh Sui registry archived memories.', error);
      }
    }
  }, [refreshRegistryMemories]);

  const filteredMemories = useMemo(
    () =>
      allMemories.filter(
        (memory) =>
          memory.year === selectedYear &&
          memoryMatchesCategories(memory, selectedCategories, allMemoryDetails) &&
          memoryMatchesSearch(memory, searchQuery, allMemoryDetails)
      ),
    [allMemories, allMemoryDetails, searchQuery, selectedCategories, selectedYear]
  );

  const memoryCountByYear = useMemo(
    () =>
      allMemories.reduce<Record<number, number>>((acc, memory) => {
        if (
          memoryMatchesCategories(memory, selectedCategories, allMemoryDetails) &&
          memoryMatchesSearch(memory, searchQuery, allMemoryDetails)
        ) {
          acc[memory.year] = (acc[memory.year] || 0) + 1;
        }
        return acc;
      }, {}),
    [allMemories, allMemoryDetails, searchQuery, selectedCategories]
  );

  useEffect(() => {
    if (activeMemoryId && !filteredMemories.some((memory) => memory.id === activeMemoryId)) {
      setActiveMemoryId(null);
    }
  }, [activeMemoryId, filteredMemories]);

  const setActiveMemoryById = useCallback((id: string | null) => {
    setActiveMemoryId(id && allMemoryDetails[id] ? id : null);
  }, [allMemoryDetails]);

  const toggleCategory = useCallback((category: string) => {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedCategories([]);
    setSearchQuery('');
  }, []);

  const closeActiveMemory = useCallback(() => {
    setActiveMemoryId(null);
  }, []);

  const saveMemory = useCallback((id: string) => {
    setSavedMemoryIds((current) => {
      const next = current.includes(id) ? current : [...current, id];
      persistSavedMemoryIds(next);
      return next;
    });
  }, [persistSavedMemoryIds]);

  const unsaveMemory = useCallback((id: string) => {
    setSavedMemoryIds((current) => {
      const next = current.filter((item) => item !== id);
      persistSavedMemoryIds(next);
      return next;
    });
  }, [persistSavedMemoryIds]);

  const toggleSavedMemory = useCallback((id: string) => {
    setSavedMemoryIds((current) => {
      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];
      persistSavedMemoryIds(next);
      return next;
    });
  }, [persistSavedMemoryIds]);

  const isMemorySaved = useCallback(
    (id: string) => savedMemoryIds.includes(id),
    [savedMemoryIds]
  );

  const addMemory = useCallback((memory: MemoryDetail) => {
    setUploadedMemories((current) => {
      const normalized = normalizeUploadedMemory(memory);
      const next = [normalized, ...current.filter((item) => item.id !== memory.id)];
      window.localStorage.setItem(uploadedMemoriesStorageKey, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearUploadedMemories = useCallback(() => {
    window.localStorage.removeItem(uploadedMemoriesStorageKey);
    setUploadedMemories([]);
    setActiveMemoryId(null);
  }, []);

  const clearSavedMemories = useCallback(() => {
    window.localStorage.removeItem(savedMemoriesStorageKey);
    setSavedMemoryIds([]);
  }, []);

  const clearLocalEchoMapData = useCallback(() => {
    window.localStorage.removeItem(uploadedMemoriesStorageKey);
    window.localStorage.removeItem(savedMemoriesStorageKey);
    setUploadedMemories([]);
    setSavedMemoryIds([]);
    setActiveMemoryId(null);
  }, []);

  const clearWalletRegistryMemories = useCallback(() => {
    setWalletRegistryMemories([]);
    setActiveMemoryId((current) => {
      if (current && !registryMemories.some((memory) => memory.id === current)) {
        return null;
      }
      return current;
    });
  }, [registryMemories]);

  const value = useMemo<MemoryStoreValue>(
    () => ({
      memories: allMemories,
      memoryDetails: allMemoryDetails,
      uploadedMemories,
      registryMemories,
      walletRegistryMemories,
      archivedRegistryMemories,
      savedMemories,
      activeMemory: activeMemoryId ? allMemoryDetails[activeMemoryId] : null,
      selectedYear,
      selectedCategories,
      searchQuery,
      savedMemoryIds,
      filteredMemories,
      memoryCountByYear,
      setActiveMemoryById,
      setSelectedYear,
      setSelectedCategories,
      toggleCategory,
      setSearchQuery,
      clearFilters,
      closeActiveMemory,
      saveMemory,
      unsaveMemory,
      toggleSavedMemory,
      isMemorySaved,
      addMemory,
      clearUploadedMemories,
      clearSavedMemories,
      clearLocalEchoMapData,
      clearWalletRegistryMemories,
      refreshRegistryMemories,
      refreshSavedMemoriesFromRegistry,
      refreshArchivedMemoriesFromRegistry,
    }),
    [
      activeMemoryId,
      addMemory,
      allMemories,
      allMemoryDetails,
      archivedRegistryMemories,
      clearFilters,
      clearLocalEchoMapData,
      clearWalletRegistryMemories,
      clearSavedMemories,
      clearUploadedMemories,
      closeActiveMemory,
      filteredMemories,
      isMemorySaved,
      memoryCountByYear,
      refreshRegistryMemories,
      refreshSavedMemoriesFromRegistry,
      refreshArchivedMemoriesFromRegistry,
      registryMemories,
      walletRegistryMemories,
      savedMemoryIds,
      savedMemories,
      saveMemory,
      searchQuery,
      selectedCategories,
      selectedYear,
      setSelectedCategories,
      setActiveMemoryById,
      toggleCategory,
      toggleSavedMemory,
      unsaveMemory,
      uploadedMemories,
    ]
  );

  return createElement(MemoryStoreContext.Provider, { value }, children);
}

export function useMemoryStore() {
  const context = useContext(MemoryStoreContext);

  if (!context) {
    throw new Error('useMemoryStore must be used within MemoryStoreProvider');
  }

  return context;
}
