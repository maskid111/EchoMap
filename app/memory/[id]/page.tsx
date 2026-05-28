'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { ArrowLeft, Share2, Heart, Copy, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { GlowButton } from '@/components/GlowButton';
import { AppShell } from '@/components/layout/AppShell';
import { MemoryMedia } from '@/components/MemoryMedia';
import { TatumVerificationButton } from '@/components/TatumVerificationButton';
import { cn } from '@/lib/utils';
import { defaultSuiNetwork } from '@/lib/sui-client';
import { formatSuiExplorerTxUrl } from '@/lib/sui-proof';
import { getWalrusBlobUrl } from '@/lib/walrus';
import { fetchLatestProfileForWallet, type RegistryProfile } from '@/lib/registry';
import { useMemoryStore } from '@/store/memory-store';
import { useRegistrySavedMemory } from '@/hooks/useRegistrySavedMemory';

interface MemoryDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

function safeWalrusBlobUrl(blobId: string | undefined) {
  if (!blobId) return null;
  try {
    return getWalrusBlobUrl(blobId);
  } catch {
    return null;
  }
}

function isSuiAddress(value: string | undefined) {
  return Boolean(value && /^0x[a-fA-F0-9]+$/.test(value.trim()));
}

function shortenAddress(address: string) {
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

export default function MemoryDetailPage({ params }: MemoryDetailPageProps) {
  const { id } = use(params);
  const account = useCurrentAccount();
  const { memoryDetails } = useMemoryStore();
  const memory = memoryDetails[id];
  const [copied, setCopied] = useState(false);
  const [creatorProfile, setCreatorProfile] = useState<RegistryProfile | null>(null);
  const [creatorProfileLoading, setCreatorProfileLoading] = useState(false);
  const { saved: isSaved, isSaving, saveError, toggleSave } = useRegistrySavedMemory(memory);

  useEffect(() => {
    let cancelled = false;

    async function loadCreatorProfile() {
      setCreatorProfile(null);
      if (!isSuiAddress(memory?.creatorWallet)) return;

      setCreatorProfileLoading(true);
      try {
        const profile = await fetchLatestProfileForWallet(memory!.creatorWallet);
        if (!cancelled) setCreatorProfile(profile);
      } catch {
        if (!cancelled) setCreatorProfile(null);
      } finally {
        if (!cancelled) setCreatorProfileLoading(false);
      }
    }

    void loadCreatorProfile();

    return () => {
      cancelled = true;
    };
  }, [memory?.creatorWallet]);
  if (!memory) {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 text-center">
          <GlassCard strong className="p-8">
            <h1 className="text-2xl font-bold text-white">Memory not found</h1>
            <p className="mt-3 text-sm text-gray-400">This memory is not available from the public registry or your local uploads.</p>
            <Link href="/explore" className="mt-6 inline-flex rounded-lg bg-cyan-500 px-5 py-3 text-sm font-semibold text-black hover:bg-cyan-400">
              Back to Explore
            </Link>
          </GlassCard>
        </div>
      </AppShell>
    );
  }
  const mediaBlobId = memory.mediaWalrusBlobId || memory.walrusBlobId;
  const metadataBlobId = memory.metadataWalrusBlobId;
  const walrusSuiObjectId = memory.walrusSuiObjectId || memory.metadataWalrusSuiObjectId || memory.mediaWalrusSuiObjectId;
  const proofStatusLabel = memory.suiTxDigest || memory.proofStatus === 'verified'
    ? 'Fully Verified'
    : memory.proofStatus === 'failed'
      ? 'Verification Failed'
      : mediaBlobId || metadataBlobId
        ? 'Walrus Only'
        : 'Unverified';
  const suiExplorerUrl = memory.suiTxDigest
    ? formatSuiExplorerTxUrl(memory.suiTxDigest, defaultSuiNetwork)
    : null;
  const mediaBlobUrl = safeWalrusBlobUrl(mediaBlobId);
  const metadataBlobUrl = safeWalrusBlobUrl(metadataBlobId);
  const walrusObjectUrl = walrusSuiObjectId
    ? `https://suiscan.xyz/${defaultSuiNetwork}/object/${walrusSuiObjectId}`
    : null;
  const creatorDisplayName = creatorProfile?.displayName || 'Wallet Creator';
  const publicMemoryDetails = Object.values(memoryDetails).filter((item) => (item.visibility || 'public') === 'public');
  const creatorPublicMemoryCount = publicMemoryDetails.filter(
    (item) => isSuiAddress(item.creatorWallet) && item.creatorWallet.toLowerCase() === memory.creatorWallet.toLowerCase()
  ).length;
  const relatedMemories = publicMemoryDetails.filter(
    (item) =>
      item.id !== memory.id &&
      isSuiAddress(item.creatorWallet) &&
      item.creatorWallet.toLowerCase() === memory.creatorWallet.toLowerCase()
  ).slice(0, 3);

  const copyProofValue = (value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.href}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppShell>
      {/* Page actions */}
      <div className="border-b border-cyan-500/20 bg-black/30 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition"
          >
            <ArrowLeft className="h-5 w-5 flex-shrink-0" />
            <span className="hidden sm:inline">Back to Explore</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={() => void toggleSave()}
              disabled={isSaving || !account}
              className={cn(
                'p-2 rounded-lg transition disabled:cursor-wait disabled:opacity-70',
                isSaved
                  ? 'bg-pink-500/20 text-pink-400'
                  : 'hover:bg-cyan-500/10 text-gray-400 hover:text-cyan-400'
              )}
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Heart className={cn('w-5 h-5', isSaved && 'fill-current')} />}
            </button>
            <button
              onClick={handleCopyLink}
              className="p-2 rounded-lg hover:bg-cyan-500/10 text-gray-400 hover:text-cyan-400 transition"
            >
              {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {saveError && (
          <p className="mx-auto max-w-7xl px-4 pb-3 text-right text-xs font-semibold text-yellow-200 sm:px-6">
            {saveError}
          </p>
        )}
        {!account && (
          <p className="mx-auto max-w-7xl px-4 pb-3 text-right text-xs font-semibold text-gray-400 sm:px-6">
            Connect wallet to save this memory.
          </p>
        )}
      </div>

      {/* Main Content */}
      <div className="pb-12">
        {/* Hero Image Section */}
        <div className="relative h-[82vh] min-h-[34rem] overflow-hidden bg-black sm:h-screen">
          <MemoryMedia
            image={memory.image}
            title={memory.title}
            mediaType={memory.mediaType}
            mimeType={memory.mimeType}
            controls={memory.mediaType === 'video' || memory.mediaType === 'audio'}
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

          {/* Floating Info Card */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
            <div className="mx-auto max-w-4xl">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
                <div className="min-w-0 flex-1">
                  <h1 className="mb-4 text-4xl font-bold leading-tight text-white text-balance md:text-6xl">
                    {memory.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-lg text-gray-300 sm:text-xl">
                    <span>{memory.location} - {memory.year}</span>
                    <span className={cn(
                      'rounded-full px-3 py-1 text-xs font-semibold sm:text-sm',
                      (memory.visibility || 'public') === 'unlisted'
                        ? 'bg-yellow-500/15 text-yellow-200'
                        : 'bg-emerald-500/15 text-emerald-200'
                    )}>
                      {(memory.visibility || 'public') === 'unlisted' ? 'Unlisted' : 'Public'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <GlowButton variant="primary" size="lg" onClick={handleCopyLink}>
                    <Share2 className="w-5 h-5" />
                    {copied ? 'Copied' : 'Share'}
                  </GlowButton>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
          {/* Story */}
          <GlassCard strong className="mb-8 p-5 sm:mb-12 sm:p-12">
            <h2 className="text-2xl font-bold text-white mb-6">The Story</h2>
            <p className="mb-8 text-base leading-relaxed text-gray-300 sm:text-lg">{memory.story}</p>
            
            {/* Categories */}
            <div className="flex flex-wrap gap-3">
              {memory.categories.map((category: string) => (
                <span
                  key={category}
                  className="px-4 py-2 bg-cyan-500/20 text-cyan-300 rounded-full text-sm font-medium"
                >
                  {category}
                </span>
              ))}
            </div>
          </GlassCard>

          {/* Creator Info */}
          <GlassCard strong className="mb-8 p-5 sm:mb-12 sm:p-8">
            <h3 className="text-lg font-bold text-white mb-6">About the Creator</h3>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-cyan-400 to-purple-500">
                {creatorProfile?.avatar && (
                  <img src={creatorProfile.avatar} alt={creatorDisplayName} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-white font-bold mb-1">
                  {creatorProfileLoading ? 'Loading creator...' : creatorDisplayName}
                </h4>
                <div className="flex items-center gap-2 mb-3">
                  <p className="min-w-0 truncate font-mono text-sm text-gray-400">
                    {isSuiAddress(memory.creatorWallet) ? shortenAddress(memory.creatorWallet) : memory.creatorWallet}
                  </p>
                  {memory.verified && <CheckCircle className="w-4 h-4 text-cyan-400" />}
                </div>
                {creatorProfile?.bio && <p className="mb-3 text-sm leading-relaxed text-gray-300">{creatorProfile.bio}</p>}
                {creatorPublicMemoryCount > 0 && (
                  <p className="text-sm text-gray-400">
                    {creatorPublicMemoryCount} public {creatorPublicMemoryCount === 1 ? 'memory' : 'memories'} preserved
                  </p>
                )}
              </div>
            </div>
          </GlassCard>

          {/* Verification Badges */}
          <div className="mb-8 grid grid-cols-1 gap-6 sm:mb-12 sm:grid-cols-2">
            <GlassCard strong className="p-5 sm:p-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                </div>
                <h4 className="font-bold text-white">Stored on Walrus</h4>
              </div>
              <p className="text-sm text-gray-400">
                Permanently stored on Walrus blob storage with content-addressed access
              </p>
            </GlassCard>

            <GlassCard strong className="p-5 sm:p-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <div className="w-2 h-2 bg-purple-400 rounded-full" />
                </div>
                <h4 className="font-bold text-white">Registered on Sui</h4>
              </div>
              <p className="text-sm text-gray-400">
                {memory.suiTxDigest
                  ? 'Cryptographically verified with a Sui transaction proof'
                  : 'Sui registry integration is pending for this memory'}
              </p>
            </GlassCard>
          </div>

          {(mediaBlobId || metadataBlobId || walrusSuiObjectId || memory.suiRef || memory.suiTxDigest) && (
            <GlassCard strong className="mb-8 p-5 sm:mb-12 sm:p-8">
              <h3 className="text-lg font-bold text-white mb-5">Verification Proof</h3>
              <div className="mb-5 rounded-lg border border-cyan-500/20 bg-black/25 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Proof Status</p>
                <p className="font-bold text-cyan-300">{proofStatusLabel}</p>
              </div>
              {mediaBlobId && (
                <div className="mb-5">
                  <p className="text-xs uppercase tracking-wide text-cyan-400 mb-2">Media Walrus Blob ID</p>
                  <p className="break-all font-mono text-sm text-gray-300">{mediaBlobId}</p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <button onClick={() => copyProofValue(mediaBlobId)} className="text-sm font-semibold text-cyan-300 hover:text-cyan-200"><Copy className="mr-1 inline h-4 w-4" />Copy</button>
                    {mediaBlobUrl && <a href={mediaBlobUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200"><ExternalLink className="mr-1 inline h-4 w-4" />Open media blob</a>}
                  </div>
                </div>
              )}
              {metadataBlobId && (
                <div className="mb-5">
                  <p className="text-xs uppercase tracking-wide text-cyan-400 mb-2">Metadata Walrus Blob ID</p>
                  <p className="break-all font-mono text-sm text-gray-300">{metadataBlobId}</p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <button onClick={() => copyProofValue(metadataBlobId)} className="text-sm font-semibold text-cyan-300 hover:text-cyan-200"><Copy className="mr-1 inline h-4 w-4" />Copy</button>
                    {metadataBlobUrl && <a href={metadataBlobUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200"><ExternalLink className="mr-1 inline h-4 w-4" />Open metadata blob</a>}
                  </div>
                </div>
              )}
              {walrusSuiObjectId && (
                <div className="mb-5">
                  <p className="text-xs uppercase tracking-wide text-emerald-300 mb-2">Walrus Sui Object</p>
                  <p className="break-all font-mono text-sm text-gray-300">{walrusSuiObjectId}</p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <button onClick={() => copyProofValue(walrusSuiObjectId)} className="text-sm font-semibold text-cyan-300 hover:text-cyan-200"><Copy className="mr-1 inline h-4 w-4" />Copy</button>
                    {walrusObjectUrl && <a href={walrusObjectUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200"><ExternalLink className="mr-1 inline h-4 w-4" />View object on SuiScan</a>}
                  </div>
                </div>
              )}
              {memory.suiRef && (
                <div className="mb-5">
                  <p className="text-xs uppercase tracking-wide text-emerald-300 mb-2">Walrus Sui Reference</p>
                  <p className="break-all font-mono text-sm text-gray-300">{memory.suiRef}</p>
                </div>
              )}
              {memory.suiTxDigest && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-purple-400 mb-2">Sui Transaction Digest</p>
                  <p className="break-all font-mono text-sm text-gray-300 mb-3">{memory.suiTxDigest}</p>
                  <button onClick={() => copyProofValue(memory.suiTxDigest!)} className="mr-4 font-semibold text-cyan-300 hover:text-cyan-200"><Copy className="mr-1 inline h-4 w-4" />Copy</button>
                  {suiExplorerUrl && (
                    <a
                      href={suiExplorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-cyan-300 hover:text-cyan-200"
                    >
                      <ExternalLink className="mr-1 inline h-4 w-4" />View Sui transaction on SuiScan
                    </a>
                  )}
                  <div className="mt-3">
                    <TatumVerificationButton digest={memory.suiTxDigest} />
                  </div>
                </div>
              )}
              <p className="mt-5 text-sm leading-relaxed text-gray-500">
                Media and metadata are stored on Walrus. Sui proof is created after upload through wallet execution.
              </p>
            </GlassCard>
          )}

          {/* Engagement Stats */}
          <GlassCard strong className="mb-8 p-5 sm:mb-12 sm:p-8">
            <h3 className="text-lg font-bold text-white mb-6">Community Engagement</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="text-center">
                <p className="text-3xl font-bold text-cyan-400 mb-1">{memory.engagements.views}</p>
                <p className="text-sm text-gray-400">Views</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-pink-400 mb-1">{memory.engagements.saves}</p>
                <p className="text-sm text-gray-400">Saved</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-400 mb-1">{memory.engagements.shares}</p>
                <p className="text-sm text-gray-400">Shares</p>
              </div>
            </div>
          </GlassCard>

          {relatedMemories.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">More from {creatorDisplayName}</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {relatedMemories.map((item) => (
                  <Link key={item.id} href={`/memory/${item.id}`}>
                    <GlassCard className="relative h-48 overflow-hidden group cursor-pointer hover:border-cyan-400/50 transition">
                      <MemoryMedia
                        image={item.image}
                        title={item.title}
                        mediaType={item.mediaType}
                        mimeType={item.mimeType}
                      />
                      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent p-4">
                        <p className="font-semibold text-white group-hover:text-cyan-300">{item.title}</p>
                        <p className="mt-1 text-sm text-gray-300">{item.location}</p>
                      </div>
                    </GlassCard>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

