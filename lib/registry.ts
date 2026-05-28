import { Transaction } from '@mysten/sui/transactions';
import type { MemoryDetail } from './types';
import { getWalrusBlobUrl } from './walrus';
import { suiRpcUrl } from './sui-client';

export interface RegisterMemoryParams {
  mediaWalrusBlobId: string;
  metadataWalrusBlobId: string;
  title: string;
  category: string;
  locationName: string;
  lat: number;
  lng: number;
  year: number;
  timestamp: string;
  proofTxDigest?: string;
  visibility?: 'public' | 'unlisted';
}

export interface ProfileUpdateParams {
  profileMetadataBlobId: string;
  avatarWalrusBlobId?: string;
  displayName: string;
  timestampMs?: number;
}

export interface RegistryProfile {
  walletAddress: string;
  displayName: string;
  bio: string;
  avatar: string;
  avatarWalrusBlobId: string;
  profileMetadataBlobId: string;
  profileTxDigest?: string;
  timestampMs: number;
  syncStatus: 'synced';
  isSet: boolean;
}

export interface RegistrySaveMemoryParams {
  metadataWalrusBlobId: string;
  memoryCreator: string;
  timestampMs?: number;
}

export interface RegistryUnsaveMemoryParams {
  metadataWalrusBlobId: string;
  timestampMs?: number;
}

interface RegistryEvent {
  id?: {
    txDigest?: string;
    eventSeq?: string;
  };
  timestampMs?: string;
  parsedJson?: Record<string, unknown>;
}

export function getRegistryConfig() {
  const packageId = process.env.NEXT_PUBLIC_ECHOMAP_PACKAGE_ID?.trim() || '';
  const registryId = process.env.NEXT_PUBLIC_ECHOMAP_REGISTRY_ID?.trim() || '';

  return {
    configured: Boolean(packageId),
    packageId,
    registryId,
    eventType: packageId ? `${packageId}::registry::MemoryCreated` : '',
    profileEventType: packageId ? `${packageId}::registry::ProfileUpdated` : '',
    savedEventType: packageId ? `${packageId}::registry::MemorySaved` : '',
    unsavedEventType: packageId ? `${packageId}::registry::MemoryUnsaved` : '',
  };
}

export function createRegisterMemoryTransaction(params: RegisterMemoryParams) {
  const config = getRegistryConfig();

  if (!config.packageId) {
    throw new Error('NEXT_PUBLIC_ECHOMAP_PACKAGE_ID is not configured.');
  }

  const tx = new Transaction();
  tx.moveCall({
    target: `${config.packageId}::registry::register_memory`,
    arguments: [
      tx.pure.string(params.mediaWalrusBlobId),
      tx.pure.string(params.metadataWalrusBlobId),
      tx.pure.string(params.title),
      tx.pure.string(params.category),
      tx.pure.string(params.locationName),
      tx.pure.string(params.lat.toFixed(6)),
      tx.pure.string(params.lng.toFixed(6)),
      tx.pure.u64(params.year),
      tx.pure.u64(new Date(params.timestamp).getTime()),
      tx.pure.string(params.proofTxDigest || ''),
      tx.pure.string(params.visibility || 'public'),
    ],
  });

  return tx;
}

export function registerProfileUpdate(params: ProfileUpdateParams) {
  const config = getRegistryConfig();

  if (!config.packageId) {
    throw new Error('NEXT_PUBLIC_ECHOMAP_PACKAGE_ID is not configured.');
  }

  const tx = new Transaction();
  tx.moveCall({
    target: `${config.packageId}::registry::update_profile`,
    arguments: [
      tx.pure.string(params.profileMetadataBlobId),
      tx.pure.string(params.avatarWalrusBlobId || ''),
      tx.pure.string(params.displayName),
      tx.pure.u64(params.timestampMs || Date.now()),
    ],
  });

  return tx;
}

export function saveMemoryOnRegistry(params: RegistrySaveMemoryParams) {
  const config = getRegistryConfig();

  if (!config.packageId) {
    throw new Error('NEXT_PUBLIC_ECHOMAP_PACKAGE_ID is not configured.');
  }

  const tx = new Transaction();
  tx.moveCall({
    target: `${config.packageId}::registry::save_memory`,
    arguments: [
      tx.pure.string(params.metadataWalrusBlobId),
      tx.pure.address(params.memoryCreator),
      tx.pure.u64(params.timestampMs || Date.now()),
    ],
  });

  return tx;
}

export function unsaveMemoryOnRegistry(params: RegistryUnsaveMemoryParams) {
  const config = getRegistryConfig();

  if (!config.packageId) {
    throw new Error('NEXT_PUBLIC_ECHOMAP_PACKAGE_ID is not configured.');
  }

  const tx = new Transaction();
  tx.moveCall({
    target: `${config.packageId}::registry::unsave_memory`,
    arguments: [
      tx.pure.string(params.metadataWalrusBlobId),
      tx.pure.u64(params.timestampMs || Date.now()),
    ],
  });

  return tx;
}

async function callSuiRpc<T>(method: string, params: unknown[]): Promise<T> {
  const response = await fetch(suiRpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  });

  const payload = await response.json() as { result?: T; error?: { message?: string } };

  if (!response.ok || payload.error || !payload.result) {
    throw new Error(payload.error?.message || `Sui RPC ${method} failed.`);
  }

  return payload.result;
}

function stringField(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function numberField(value: unknown) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function timestampField(value: unknown) {
  const parsed = numberField(value);
  return parsed > 0 ? parsed : Date.now();
}

function isSameAddress(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function eventToMemory(event: RegistryEvent): MemoryDetail | null {
  const parsed = event.parsedJson;
  if (!parsed) return null;

  const mediaWalrusBlobId = stringField(parsed.media_walrus_blob_id);
  const metadataWalrusBlobId = stringField(parsed.metadata_walrus_blob_id);
  const title = stringField(parsed.title) || 'Untitled memory';
  const timestampMs = stringField(event.timestampMs) || stringField(parsed.timestamp_ms);
  const timestampNumber = Number(timestampMs);
  const timestamp = Number.isFinite(timestampNumber)
    ? new Date(timestampNumber).toISOString()
    : new Date().toISOString();
  const visibility = stringField(parsed.visibility) === 'unlisted' ? 'unlisted' : 'public';

  if (!mediaWalrusBlobId || !metadataWalrusBlobId) {
    return null;
  }

  return {
    id: `registry-${event.id?.txDigest || mediaWalrusBlobId}-${event.id?.eventSeq || '0'}`,
    title,
    location: stringField(parsed.location_name) || 'Unknown location',
    year: numberField(parsed.year) || new Date(timestamp).getFullYear(),
    image: getWalrusBlobUrl(mediaWalrusBlobId),
    source: 'uploaded',
    mediaUrl: getWalrusBlobUrl(mediaWalrusBlobId),
    mediaWalrusBlobId,
    metadataWalrusBlobId,
    suiTxDigest: stringField(parsed.proof_tx_digest) || event.id?.txDigest,
    proofStatus: stringField(parsed.proof_tx_digest) ? 'verified' : 'walrus-only',
    visibility,
    lat: numberField(parsed.lat),
    lng: numberField(parsed.lng),
    creator: 'EchoMap Contributor',
    creatorWallet: stringField(parsed.creator),
    story: 'Metadata is stored on Walrus.',
    verified: Boolean(stringField(parsed.proof_tx_digest)),
    engagements: {
      views: 0,
      saves: 0,
      shares: 0,
    },
    timestamp,
    categories: [stringField(parsed.category) || 'Uncategorized'],
  };
}

export async function fetchPublicRegistryMemories(limit = 50): Promise<MemoryDetail[]> {
  const memories = await fetchAllRegistryMemories(limit);
  return memories.filter((memory) => (memory.visibility || 'public') === 'public');
}

async function fetchAllRegistryMemories(limit = 50): Promise<MemoryDetail[]> {
  const config = getRegistryConfig();
  if (!config.configured) return [];

  const result = await fetchRegistryEvents(config.eventType, limit);

  return result.map(eventToMemory).filter((memory): memory is MemoryDetail => Boolean(memory));
}

export async function fetchRegistryMemoriesByWallet(walletAddress: string, limit = 50) {
  const memories = await fetchAllRegistryMemories(limit);
  return memories.filter(
    (memory) => isSameAddress(memory.creatorWallet, walletAddress)
  );
}

async function fetchRegistryEvents(eventType: string, limit = 50) {
  const result = await callSuiRpc<{ data: RegistryEvent[] }>('suix_queryEvents', [
    { MoveEventType: eventType },
    null,
    limit,
    true,
  ]);

  return result.data || [];
}

async function fetchWalrusJson(blobId: string) {
  const response = await fetch(getWalrusBlobUrl(blobId));
  if (!response.ok) {
    throw new Error(`Unable to fetch Walrus JSON blob ${blobId}.`);
  }
  return response.json() as Promise<Record<string, unknown>>;
}

export async function fetchLatestProfileForWallet(walletAddress: string): Promise<RegistryProfile | null> {
  const config = getRegistryConfig();
  if (!config.configured || !walletAddress) return null;

  const events = await fetchRegistryEvents(config.profileEventType, 100);
  const walletEvents = events
    .filter((event) => isSameAddress(stringField(event.parsedJson?.owner), walletAddress))
    .sort((a, b) => timestampField(b.parsedJson?.timestamp_ms || b.timestampMs) - timestampField(a.parsedJson?.timestamp_ms || a.timestampMs));
  const latest = walletEvents[0];
  if (!latest?.parsedJson) return null;

  const profileMetadataBlobId = stringField(latest.parsedJson.profile_metadata_blob_id);
  if (!profileMetadataBlobId) return null;

  const metadata = await fetchWalrusJson(profileMetadataBlobId);
  const displayName = stringField(metadata.displayName) || stringField(latest.parsedJson.display_name);
  const bio = stringField(metadata.bio);
  const avatarWalrusBlobId = stringField(metadata.avatarWalrusBlobId) || stringField(latest.parsedJson.avatar_walrus_blob_id);
  const avatar = stringField(metadata.avatarUrl) || (avatarWalrusBlobId ? getWalrusBlobUrl(avatarWalrusBlobId) : '');

  return {
    walletAddress,
    displayName,
    bio,
    avatar,
    avatarWalrusBlobId,
    profileMetadataBlobId,
    profileTxDigest: latest.id?.txDigest,
    timestampMs: timestampField(latest.parsedJson.timestamp_ms || latest.timestampMs),
    syncStatus: 'synced',
    isSet: displayName.trim().length > 0,
  };
}

type SavedState = {
  saved: boolean;
  timestampMs: number;
};

export async function fetchSavedMemoryIdsForWallet(walletAddress: string): Promise<string[]> {
  const config = getRegistryConfig();
  if (!config.configured || !walletAddress) return [];

  const [savedEvents, unsavedEvents] = await Promise.all([
    fetchRegistryEvents(config.savedEventType, 200),
    fetchRegistryEvents(config.unsavedEventType, 200),
  ]);
  const stateByBlob = new Map<string, SavedState>();

  for (const event of savedEvents) {
    const parsed = event.parsedJson;
    const owner = stringField(parsed?.owner);
    const metadataWalrusBlobId = stringField(parsed?.metadata_walrus_blob_id);
    if (!metadataWalrusBlobId || !isSameAddress(owner, walletAddress)) continue;
    const timestampMs = timestampField(parsed?.timestamp_ms || event.timestampMs);
    const current = stateByBlob.get(metadataWalrusBlobId);
    if (!current || timestampMs >= current.timestampMs) {
      stateByBlob.set(metadataWalrusBlobId, { saved: true, timestampMs });
    }
  }

  for (const event of unsavedEvents) {
    const parsed = event.parsedJson;
    const owner = stringField(parsed?.owner);
    const metadataWalrusBlobId = stringField(parsed?.metadata_walrus_blob_id);
    if (!metadataWalrusBlobId || !isSameAddress(owner, walletAddress)) continue;
    const timestampMs = timestampField(parsed?.timestamp_ms || event.timestampMs);
    const current = stateByBlob.get(metadataWalrusBlobId);
    if (!current || timestampMs >= current.timestampMs) {
      stateByBlob.set(metadataWalrusBlobId, { saved: false, timestampMs });
    }
  }

  return Array.from(stateByBlob.entries())
    .filter(([, state]) => state.saved)
    .map(([metadataWalrusBlobId]) => metadataWalrusBlobId);
}
