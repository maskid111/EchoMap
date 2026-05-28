'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Camera, CheckCircle, Copy, Download, Edit2, ExternalLink, Heart, Loader2, Share2, Sparkles, User } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { GlowButton } from '@/components/GlowButton';
import { AppShell } from '@/components/layout/AppShell';
import { MemoryCard } from '@/components/MemoryCard';
import { cn } from '@/lib/utils';
import { defaultSuiNetwork } from '@/lib/sui-client';
import { fetchLatestProfileForWallet, getRegistryConfig, registerProfileUpdate } from '@/lib/registry';
import { getWalrusBlobUrl, uploadFileToWalrus, uploadJsonToWalrus } from '@/lib/walrus';
import { useMemoryStore } from '@/store/memory-store';

interface LocalProfile {
  displayName: string;
  bio: string;
  avatar: string;
  isSet: boolean;
  avatarWalrusBlobId?: string;
  profileMetadataBlobId?: string;
  profileTxDigest?: string;
  syncStatus?: 'local' | 'synced' | 'failed';
  updatedAt?: string;
}

const defaultProfile: LocalProfile = {
  displayName: '',
  bio: '',
  avatar: '',
  isSet: false,
};

function profileStorageKey(address: string) {
  return `echomap-profile-${address.toLowerCase()}`;
}

function shortenAddress(address: string) {
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

function addressUrl(address: string) {
  return `https://suiscan.xyz/${defaultSuiNetwork}/account/${address}`;
}

function writeProfile(address: string, profile: LocalProfile) {
  window.localStorage.setItem(profileStorageKey(address), JSON.stringify(profile));
}

function isLocalCanvasSafeImage(src: string) {
  return src.startsWith('data:') || src.startsWith('blob:');
}

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return initials || 'E';
}

async function loadImage(src: string, useAnonymousCors = false) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    if (useAnonymousCors) {
      image.crossOrigin = 'anonymous';
    }
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function drawFallbackAvatar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  displayName: string
) {
  const avatarGradient = ctx.createLinearGradient(x, y, x + size, y + size);
  avatarGradient.addColorStop(0, '#00d9ff');
  avatarGradient.addColorStop(0.55, '#4f46e5');
  avatarGradient.addColorStop(1, '#bb86fc');
  ctx.fillStyle = avatarGradient;
  ctx.fillRect(x, y, size, size);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.beginPath();
  ctx.arc(x + size * 0.82, y + size * 0.18, size * 0.34, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 52px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(getInitials(displayName), x + size / 2, y + size / 2 + 2);
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';
}

export default function ProfilePage() {
  const account = useCurrentAccount();
  const signAndExecuteTransaction = useSignAndExecuteTransaction();
  const [activeTab, setActiveTab] = useState<'uploaded' | 'saved'>('uploaded');
  const [copied, setCopied] = useState<string | null>(null);
  const [profile, setProfile] = useState<LocalProfile>(defaultProfile);
  const [draft, setDraft] = useState<LocalProfile>(defaultProfile);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [editing, setEditing] = useState(false);
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [cardReady, setCardReady] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const {
    uploadedMemories,
    walletRegistryMemories,
    savedMemories,
    savedMemoryIds,
    refreshRegistryMemories,
    refreshSavedMemoriesFromRegistry,
  } = useMemoryStore();
  const registryConfigured = getRegistryConfig().configured;
  const walletMemories = useMemo(() => {
    if (!account) return [];
    if (!registryConfigured) {
      return uploadedMemories.filter((memory) => memory.creatorWallet.toLowerCase() === account.address.toLowerCase());
    }
    const registryIds = new Set(walletRegistryMemories.map((memory) => memory.metadataWalrusBlobId || memory.id));
    const localOnlyUploads = uploadedMemories.filter(
      (memory) =>
        memory.creatorWallet.toLowerCase() === account.address.toLowerCase() &&
        !registryIds.has(memory.metadataWalrusBlobId || memory.id)
    );
    return [
      ...walletRegistryMemories.filter((memory) => memory.creatorWallet.toLowerCase() === account.address.toLowerCase()),
      ...localOnlyUploads,
    ];
  }, [account, registryConfigured, uploadedMemories, walletRegistryMemories]);

  useEffect(() => {
    if (account && registryConfigured) {
      void refreshRegistryMemories(account.address);
      void refreshSavedMemoriesFromRegistry(account.address);
    }
  }, [account, refreshRegistryMemories, refreshSavedMemoriesFromRegistry, registryConfigured]);

  useEffect(() => {
    if (account && registryConfigured && walletRegistryMemories.length > 0) {
      void refreshSavedMemoriesFromRegistry(account.address);
    }
  }, [account, registryConfigured, walletRegistryMemories.length, refreshSavedMemoriesFromRegistry]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setProfile(defaultProfile);
      setDraft(defaultProfile);
      setAvatarFile(null);
      setEditing(false);
      setCardUrl(null);
      setCardReady(false);
      setProfileMessage(null);
      setProfileError(null);

      if (!account) {
        setIsProfileLoading(false);
        return;
      }

      setIsProfileLoading(true);
      let next = defaultProfile;

      if (registryConfigured) {
        try {
          const registryProfile = await fetchLatestProfileForWallet(account.address);
          if (registryProfile) {
            next = {
              displayName: registryProfile.displayName,
              bio: registryProfile.bio,
              avatar: registryProfile.avatar,
              avatarWalrusBlobId: registryProfile.avatarWalrusBlobId,
              profileMetadataBlobId: registryProfile.profileMetadataBlobId,
              profileTxDigest: registryProfile.profileTxDigest,
              syncStatus: 'synced',
              updatedAt: new Date(registryProfile.timestampMs).toISOString(),
              isSet: registryProfile.isSet,
            };
            writeProfile(account.address, next);
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.info('Unable to load Sui registry profile.', error);
          }
        }
      } else {
        setProfileError('EchoMap registry package is not configured. Profile sync is unavailable.');
      }

      if (!cancelled) {
        setProfile(next);
        setDraft(next);
        setEditing(!next.isSet);
        setIsProfileLoading(false);
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [account, registryConfigured]);

  const stats = useMemo(() => ({
    preserved: walletMemories.length,
    verified: walletMemories.filter((memory) => memory.suiTxDigest || memory.proofStatus === 'verified').length,
    saved: savedMemoryIds.length,
  }), [savedMemoryIds.length, walletMemories]);

  const achievements = useMemo(() => {
    const storyCount = walletMemories.filter((memory) => memory.story.trim().length > 0).length;
    const locationCount = new Set(walletMemories.map((memory) => memory.location.trim()).filter(Boolean)).size;
    return [
      { title: 'First Memory', icon: '01', unlocked: walletMemories.length >= 1 },
      { title: 'Walrus Preserver', icon: 'W', unlocked: walletMemories.some((memory) => memory.mediaWalrusBlobId || memory.walrusBlobId) },
      { title: 'Metadata Archivist', icon: 'M', unlocked: walletMemories.some((memory) => memory.metadataWalrusBlobId) },
      { title: 'Verified Explorer', icon: 'S', unlocked: walletMemories.some((memory) => memory.suiTxDigest) },
      { title: 'World Archivist', icon: 'G', unlocked: locationCount >= 3 },
      { title: 'Storyteller', icon: 'T', unlocked: storyCount >= 3 },
    ];
  }, [walletMemories]);

  const displayName = !account
    ? 'Wallet not connected'
    : isProfileLoading
      ? 'Loading profile...'
      : (profile.isSet && profile.displayName.trim())
        ? profile.displayName.trim()
        : 'Set up your EchoMap profile';
  const bio = !account
    ? 'Connect a Sui wallet to load or create your EchoMap profile.'
    : isProfileLoading
      ? 'Fetching the active wallet profile from the Sui registry.'
      : (profile.isSet && profile.bio.trim())
        ? profile.bio.trim()
        : 'Preserve memories with Walrus storage and Sui proof receipts.';
  const shareText = `${displayName} is preserving memories on EchoMap. Powered by Sui, Walrus, and Tatum.`;
  const memoriesToShow = !account ? [] : activeTab === 'uploaded' ? walletMemories : savedMemories;

  const copyText = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(null), 1800);
  };

  const handleAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setDraft((current) => ({ ...current, avatar: String(reader.result || '') }));
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    if (!account) {
      setProfileError('Connect wallet to save profile.');
      return;
    }

    if (!registryConfigured) {
      setProfileError('EchoMap registry package is not configured. Profile was not saved.');
      return;
    }

    const trimmedDisplayName = draft.displayName.trim();
    const timestamp = new Date().toISOString();
    let next: LocalProfile = {
      ...draft,
      displayName: trimmedDisplayName,
      bio: draft.bio.trim(),
      isSet: trimmedDisplayName.length > 0,
      updatedAt: timestamp,
    };

    setIsSavingProfile(true);
    setProfileError(null);
    setProfileMessage(null);

    try {
      let avatarWalrusBlobId = next.avatarWalrusBlobId || '';
      let avatarUrl = next.avatar;

      if (avatarFile) {
        const avatarUpload = await uploadFileToWalrus(avatarFile);
        avatarWalrusBlobId = avatarUpload.blobId;
        avatarUrl = getWalrusBlobUrl(avatarUpload.blobId);
      }

      const profileMetadata = await uploadJsonToWalrus({
        schema: 'echomap.profile.metadata.v1',
        walletAddress: account.address,
        displayName: next.displayName,
        bio: next.bio,
        avatarWalrusBlobId,
        avatarUrl,
        timestamp,
      });
      const transaction = registerProfileUpdate({
        profileMetadataBlobId: profileMetadata.blobId,
        avatarWalrusBlobId,
        displayName: next.displayName,
        timestampMs: new Date(timestamp).getTime(),
      });
      const result = await signAndExecuteTransaction.mutateAsync({
        transaction,
        account,
      });

      next = {
        ...next,
        avatar: avatarUrl,
        avatarWalrusBlobId,
        profileMetadataBlobId: profileMetadata.blobId,
        profileTxDigest: 'digest' in result ? result.digest : undefined,
        syncStatus: 'synced',
      };
      writeProfile(account.address, next);
      setProfile(next);
      setDraft(next);
      setAvatarFile(null);
      setEditing(false);
      setCardReady(true);
      setProfileMessage('Synced to Sui');
      void generateCard(next);
    } catch {
      setProfileError('Profile was not saved. Your wallet needs SUI for gas to sync profile on-chain.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const cancelEdit = () => {
    setDraft(profile);
    setAvatarFile(null);
    setEditing(false);
  };

  const generateCard = async (
    sourceProfile = profile,
    options: { allowExternalAvatar?: boolean } = { allowExternalAvatar: true }
  ) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
    gradient.addColorStop(0, '#06121f');
    gradient.addColorStop(0.5, '#101032');
    gradient.addColorStop(1, '#1f0926');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 630);

    ctx.fillStyle = 'rgba(0, 217, 255, 0.14)';
    ctx.beginPath();
    ctx.arc(1060, 95, 220, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(187, 134, 252, 0.16)';
    ctx.beginPath();
    ctx.arc(100, 610, 260, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 217, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(54, 54, 1092, 522);

    const avatarX = 120;
    const avatarY = 128;
    const avatarSize = 144;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(avatarX, avatarY, avatarSize, avatarSize, 28);
    ctx.clip();
    if (sourceProfile.avatar) {
      const canDrawDirectly = isLocalCanvasSafeImage(sourceProfile.avatar);
      const canTryExternal = options.allowExternalAvatar !== false;
      try {
        if (canDrawDirectly || canTryExternal) {
          const image = await loadImage(sourceProfile.avatar, !canDrawDirectly);
          ctx.drawImage(image, avatarX, avatarY, avatarSize, avatarSize);
        } else {
          drawFallbackAvatar(ctx, avatarX, avatarY, avatarSize, sourceProfile.displayName);
        }
      } catch {
        drawFallbackAvatar(ctx, avatarX, avatarY, avatarSize, sourceProfile.displayName);
      }
    } else {
      drawFallbackAvatar(ctx, avatarX, avatarY, avatarSize, sourceProfile.displayName);
    }
    ctx.restore();

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 64px Arial';
    ctx.fillText(sourceProfile.displayName || 'EchoMap Contributor', 300, 170);
    ctx.fillStyle = '#8eeeff';
    ctx.font = '28px monospace';
    ctx.fillText(account?.address ? shortenAddress(account.address) : 'Wallet not connected', 302, 218);
    ctx.fillStyle = '#cfd8e3';
    ctx.font = '30px Arial';
    const cleanBio = (sourceProfile.bio || bio).slice(0, 110);
    ctx.fillText(cleanBio, 120, 340);

    const statItems = [
      ['Memories', stats.preserved],
      ['Verified', stats.verified],
      ['Saved', stats.saved],
    ];
    statItems.forEach(([label, value], index) => {
      const x = 120 + index * 210;
      ctx.fillStyle = '#00d9ff';
      ctx.font = '700 46px Arial';
      ctx.fillText(String(value), x, 450);
      ctx.fillStyle = '#9aa7b7';
      ctx.font = '22px Arial';
      ctx.fillText(String(label), x, 486);
    });

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 30px Arial';
    ctx.fillText('Preserving memories on EchoMap', 120, 555);
    ctx.fillStyle = '#bb86fc';
    ctx.font = '24px Arial';
    ctx.fillText('Powered by Sui + Walrus + Tatum', 760, 555);

    try {
      const nextUrl = canvas.toDataURL('image/png');
      setCardUrl(nextUrl);
      return nextUrl;
    } catch (error) {
      const blockedByCanvasSecurity =
        error instanceof DOMException && error.name === 'SecurityError';

      if (blockedByCanvasSecurity && sourceProfile.avatar && options.allowExternalAvatar !== false) {
        return generateCard(sourceProfile, { allowExternalAvatar: false });
      }

      if (process.env.NODE_ENV === 'development') {
        console.info('Unable to export EchoMap profile card.', error);
      }
      return null;
    }
  };

  const downloadCard = async () => {
    const url = cardUrl || await generateCard();
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = 'echomap-profile-card.png';
    link.click();
  };

  return (
    <AppShell>
      <div className="pb-8 lg:pb-10">
        <div className="relative bg-gradient-to-br from-cyan-900/30 to-purple-900/30">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-cyan-500 opacity-10 blur-3xl" />
            <div className="absolute -bottom-8 left-20 h-72 w-72 rounded-full bg-purple-500 opacity-10 blur-3xl" />
          </div>

          <div className="relative z-10 mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[1fr_20rem] lg:items-end lg:py-7">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-400 to-purple-500 sm:h-24 sm:w-24">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  <User className="absolute inset-0 m-auto h-9 w-9 text-white" />
                )}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-3xl font-bold text-white sm:text-4xl">{displayName}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-300 sm:text-base">{bio}</p>
                <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2 text-sm">
                  {account ? (
                    <>
                      <span className="min-w-0 truncate rounded-lg border border-cyan-500/30 bg-black/30 px-3 py-2 font-mono text-cyan-200">
                        {shortenAddress(account.address)}
                      </span>
                      <button onClick={() => copyText('wallet', account.address)} className="rounded-lg border border-cyan-500/30 p-2 text-cyan-300 hover:bg-cyan-500/10" aria-label="Copy wallet address">
                        <Copy className="h-4 w-4" />
                      </button>
                      <a href={addressUrl(account.address)} target="_blank" rel="noreferrer" className="rounded-lg border border-purple-500/30 p-2 text-purple-300 hover:bg-purple-500/10" aria-label="View address on SuiScan">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </>
                  ) : (
                    <span className="rounded-lg border border-gray-700 bg-black/30 px-3 py-2 text-gray-400">Wallet not connected</span>
                  )}
                  {copied && <span className="text-xs font-semibold text-cyan-300">Copied</span>}
                  {profile.syncStatus === 'synced' && <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">Synced to Sui</span>}
                </div>
                {profile.profileTxDigest && (
                  <p className="mt-2 truncate font-mono text-xs text-purple-200">
                    Profile tx: {profile.profileTxDigest}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <GlowButton variant="primary" onClick={() => void copyText('profile', window.location.href)}>
                <Share2 className="h-4 w-4" />
                Share
              </GlowButton>
              <GlowButton variant="ghost" onClick={() => setEditing(true)} disabled={!account || isProfileLoading}>
                <Edit2 className="h-4 w-4" />
                Edit Profile
              </GlowButton>
              <GlowButton variant="secondary" onClick={() => void generateCard()} disabled={!account || isProfileLoading || !profile.isSet}>
                <Sparkles className="h-4 w-4" />
                Generate X Card
              </GlowButton>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6">
          {!account && (
            <GlassCard strong className="mb-5 border-cyan-500/20 p-4">
              <p className="font-semibold text-white">Connect a wallet to load your profile.</p>
              <p className="mt-1 text-sm text-gray-400">EchoMap profiles are scoped to wallet addresses and sync through the Sui registry when configured.</p>
            </GlassCard>
          )}

          {account && isProfileLoading && (
            <GlassCard strong className="mb-5 border-cyan-500/20 p-4">
              <div className="flex items-center gap-3 text-cyan-200">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p className="text-sm font-semibold">Loading wallet profile...</p>
              </div>
            </GlassCard>
          )}

          {account && !isProfileLoading && !profile.isSet && !editing && (
            <GlassCard strong className="mb-5 border-cyan-500/30 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-white">Start by setting your EchoMap profile.</p>
                  <p className="text-sm text-gray-400">Add a name, bio, and avatar before sharing your archive.</p>
                </div>
                <GlowButton variant="primary" onClick={() => setEditing(true)}>Set Profile</GlowButton>
              </div>
            </GlassCard>
          )}

          {(profileMessage || profileError) && !editing && (
            <GlassCard strong className="mb-5 border-cyan-500/20 p-4">
              <p className={cn('text-sm font-semibold', profileError ? 'text-yellow-200' : 'text-cyan-300')}>
                {profileError || profileMessage}
              </p>
            </GlassCard>
          )}

          {editing && (
            <GlassCard strong className="mb-5 p-4 sm:p-5">
              <div className="grid gap-4 lg:grid-cols-[8rem_1fr_auto] lg:items-end">
                <label className="group flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-cyan-500/30 bg-black/30 text-cyan-300">
                  {draft.avatar ? <img src={draft.avatar} alt="Profile preview" className="h-full w-full object-cover" /> : <Camera className="h-7 w-7" />}
                  <input type="file" accept="image/*" className="sr-only" onChange={handleAvatar} />
                </label>
                <div className="grid gap-3">
                  <input
                    value={draft.displayName}
                    onChange={(event) => setDraft((current) => ({ ...current, displayName: event.target.value }))}
                    className="w-full rounded-lg border border-cyan-500/30 bg-black/30 px-4 py-3 text-white outline-none focus:border-cyan-300"
                    placeholder="Display name"
                  />
                  <textarea
                    value={draft.bio}
                    onChange={(event) => setDraft((current) => ({ ...current, bio: event.target.value.slice(0, 160) }))}
                    className="h-24 w-full resize-none rounded-lg border border-cyan-500/30 bg-black/30 px-4 py-3 text-white outline-none focus:border-cyan-300"
                    placeholder="Short bio"
                  />
                </div>
                <div className="flex gap-2 lg:flex-col">
                  <GlowButton variant="primary" onClick={() => void saveProfile()} disabled={!account || !registryConfigured || draft.displayName.trim().length === 0 || isSavingProfile}>
                    {isSavingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save
                  </GlowButton>
                  <GlowButton variant="ghost" onClick={cancelEdit} disabled={isSavingProfile}>Cancel</GlowButton>
                </div>
              </div>
              {(profileMessage || profileError) && (
                <p className={cn('mt-4 text-sm font-semibold', profileError ? 'text-yellow-200' : 'text-cyan-300')}>
                  {profileError || profileMessage}
                </p>
              )}
            </GlassCard>
          )}

          {cardReady && (
            <GlassCard strong className="mb-5 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-white">Your EchoMap profile is ready.</p>
                  <p className="text-sm text-gray-400">Download your profile card or share your archive on X.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <GlowButton variant="secondary" onClick={downloadCard}><Download className="h-4 w-4" />Download card</GlowButton>
                  <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-lg border border-cyan-500/50 px-4 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/10">Share on X</a>
                </div>
              </div>
            </GlassCard>
          )}

          <div className="mb-5 grid grid-cols-3 gap-3">
            {[
              ['Memories', stats.preserved, 'text-cyan-300'],
              ['Verified', stats.verified, 'text-purple-300'],
              ['Saved', stats.saved, 'text-pink-300'],
            ].map(([label, value, color]) => (
              <GlassCard key={label} strong className="p-3 text-center sm:p-4">
                <p className={cn('text-2xl font-bold sm:text-3xl', color as string)}>{value}</p>
                <p className="mt-1 text-xs text-gray-400 sm:text-sm">{label}</p>
              </GlassCard>
            ))}
          </div>

          <div className="mb-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-white">Achievements</h2>
              <span className="text-xs text-gray-500">{achievements.filter((item) => item.unlocked).length}/{achievements.length} unlocked</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {achievements.map((achievement) => (
                <GlassCard key={achievement.title} strong className={cn('p-2.5 transition', achievement.unlocked ? 'border-cyan-400/30' : 'opacity-45 grayscale')}>
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-[11px] font-bold text-cyan-200">
                      {achievement.unlocked ? <CheckCircle className="h-4 w-4" /> : achievement.icon}
                    </div>
                    <p className="min-w-0 truncate text-xs font-semibold text-white">{achievement.title}</p>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>

          {cardUrl && (
            <GlassCard strong className="mb-5 overflow-hidden p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="font-semibold text-white">Profile X Card</p>
                <div className="flex gap-2">
                  <GlowButton variant="ghost" size="sm" onClick={downloadCard}><Download className="h-4 w-4" />PNG</GlowButton>
                  <GlowButton variant="ghost" size="sm" onClick={() => void copyText('x-text', shareText)}>Copy text</GlowButton>
                </div>
              </div>
              <img src={cardUrl} alt="EchoMap profile card preview" className="w-full rounded-lg border border-cyan-500/20" />
            </GlassCard>
          )}

          <div>
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-bold text-white">Your Memories</h2>
              <div className="flex w-full gap-2 overflow-x-auto pb-1 sm:w-auto sm:overflow-visible sm:pb-0">
                {(['uploaded', 'saved'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      'flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium capitalize transition-all',
                      activeTab === tab
                        ? 'bg-cyan-500 text-black glow-cyan'
                        : 'bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20'
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {memoriesToShow.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {memoriesToShow.map((memory) => (
                  <Link key={memory.id} href={`/memory/${memory.id}`}>
                    <MemoryCard
                      id={memory.id}
                      title={memory.title}
                      location={memory.location}
                      year={memory.year}
                      image={memory.image}
                      mediaType={memory.mediaType}
                      mimeType={memory.mimeType}
                      category={memory.categories[0]}
                      proofStatus={memory.proofStatus}
                      visibility={memory.visibility || 'public'}
                    />
                  </Link>
                ))}
              </div>
            ) : (
              <GlassCard strong className="p-6 text-center">
                <Heart className="mx-auto mb-3 h-7 w-7 text-cyan-300" />
                <p className="font-semibold text-white">
                  {activeTab === 'uploaded' ? 'No memories preserved yet' : 'No saved memories yet'}
                </p>
                <p className="mt-2 text-sm text-gray-400">
                  {activeTab === 'uploaded'
                    ? 'Be the first to preserve one.'
                    : 'Save memories from Explore or a memory detail page.'}
                </p>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
