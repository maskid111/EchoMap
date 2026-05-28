'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Copy, ExternalLink, MapPin, Share2, Eye, CheckCircle, Heart, Loader2 } from 'lucide-react';
import { FloatingPanel } from '@/components/FloatingPanel';
import { GlassCard } from '@/components/GlassCard';
import { GlowButton } from '@/components/GlowButton';
import { MemoryMedia } from '@/components/MemoryMedia';
import { TatumVerificationButton } from '@/components/TatumVerificationButton';
import type { MemoryDetail } from '@/lib/types';
import { defaultSuiNetwork } from '@/lib/sui-client';
import { formatSuiExplorerTxUrl } from '@/lib/sui-proof';
import { getWalrusBlobUrl } from '@/lib/walrus';
import { useRegistrySavedMemory } from '@/hooks/useRegistrySavedMemory';

interface MemoryDetailPanelProps {
  memory: MemoryDetail | null;
  onClose?: () => void;
}

function safeWalrusBlobUrl(blobId: string | undefined) {
  if (!blobId) return null;
  try {
    return getWalrusBlobUrl(blobId);
  } catch {
    return null;
  }
}

export function MemoryDetailPanel({ memory, onClose }: MemoryDetailPanelProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const { saved, isSaving, saveError, toggleSave } = useRegistrySavedMemory(memory);

  if (!memory) return null;

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
  const walrusObjectUrl = walrusSuiObjectId
    ? `https://suiscan.xyz/${defaultSuiNetwork}/object/${walrusSuiObjectId}`
    : null;
  const mediaBlobUrl = safeWalrusBlobUrl(mediaBlobId);
  const metadataBlobUrl = safeWalrusBlobUrl(metadataBlobId);
  const copyValue = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(null), 1600);
  };

  return (
    <FloatingPanel
      title="Memory Details"
      onClose={onClose}
      isOpen={!!memory}
      position="right"
    >
      {/* Image */}
      <MemoryMedia
        image={memory.image}
        title={memory.title}
        mediaType={memory.mediaType}
        mimeType={memory.mimeType}
        controls={memory.mediaType === 'video' || memory.mediaType === 'audio'}
        className="mb-6 h-48 rounded-lg"
      />

      {/* Title and Location */}
      <h3 className="text-2xl font-bold text-white mb-2">{memory.title}</h3>
      <div className="flex items-center gap-2 text-gray-300 mb-4">
        <MapPin className="w-5 h-5 text-cyan-400" />
        <span>{memory.location}</span>
      </div>

      {/* Year */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <p className="text-sm text-gray-400">Year: {memory.year}</p>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
          (memory.visibility || 'public') === 'unlisted'
            ? 'bg-yellow-500/15 text-yellow-200'
            : 'bg-emerald-500/15 text-emerald-200'
        }`}>
          {(memory.visibility || 'public') === 'unlisted' ? 'Unlisted' : 'Public'}
        </span>
      </div>

      {/* Creator Info */}
      <GlassCard strong className="p-4 mb-6">
        <p className="text-xs text-gray-400 mb-2">Creator</p>
        <p className="text-white font-semibold mb-1">{memory.creator}</p>
        <div className="flex items-center gap-2">
          <p className="text-xs text-gray-500 font-mono truncate">{memory.creatorWallet}</p>
          {memory.verified && <CheckCircle className="w-4 h-4 text-cyan-400" />}
        </div>
      </GlassCard>

      {/* Story */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-white mb-2">Story</h4>
        <p className="text-sm text-gray-300 leading-relaxed">{memory.story}</p>
      </div>

      {/* Verification Badges */}
      <div className="flex gap-2 mb-4">
        <GlassCard className="flex-1 p-3 text-center">
          <p className="text-xs text-gray-400">Stored on</p>
          <p className="text-sm font-bold text-cyan-400">Walrus</p>
        </GlassCard>
        <GlassCard className="flex-1 p-3 text-center">
          <p className="text-xs text-gray-400">Registered on</p>
          <p className="text-sm font-bold text-purple-400">
            {memory.suiTxDigest ? 'Sui' : memory.proofStatus === 'walrus-only' ? 'Pending' : 'Unverified'}
          </p>
        </GlassCard>
      </div>

      {(mediaBlobId || metadataBlobId || walrusSuiObjectId || memory.suiRef || memory.suiTxDigest) && (
        <GlassCard strong className="p-4 mb-6">
          <p className="text-xs text-gray-400 mb-2">Verification Proof</p>
          <div className="mb-3 rounded-lg border border-cyan-500/20 bg-black/25 p-3">
            <p className="text-[11px] uppercase tracking-wide text-gray-500">Proof Status</p>
            <p className="text-sm font-bold text-cyan-300">{proofStatusLabel}</p>
          </div>
          {mediaBlobId && (
            <div className="mb-3">
              <p className="text-[11px] uppercase tracking-wide text-cyan-400 mb-1">Media Walrus Blob ID</p>
              <p className="text-xs text-gray-300 font-mono break-all">{mediaBlobId}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button onClick={() => copyValue('media', mediaBlobId)} className="text-xs font-semibold text-cyan-300 hover:text-cyan-200"><Copy className="mr-1 inline h-3 w-3" />{copied === 'media' ? 'Copied' : 'Copy'}</button>
                {mediaBlobUrl && <a href={mediaBlobUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-cyan-300 hover:text-cyan-200"><ExternalLink className="mr-1 inline h-3 w-3" />Open media blob</a>}
              </div>
            </div>
          )}
          {metadataBlobId && (
            <div className="mb-3">
              <p className="text-[11px] uppercase tracking-wide text-cyan-400 mb-1">Metadata Walrus Blob ID</p>
              <p className="text-xs text-gray-300 font-mono break-all">{metadataBlobId}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button onClick={() => copyValue('metadata', metadataBlobId)} className="text-xs font-semibold text-cyan-300 hover:text-cyan-200"><Copy className="mr-1 inline h-3 w-3" />{copied === 'metadata' ? 'Copied' : 'Copy'}</button>
                {metadataBlobUrl && <a href={metadataBlobUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-cyan-300 hover:text-cyan-200"><ExternalLink className="mr-1 inline h-3 w-3" />Open metadata blob</a>}
              </div>
            </div>
          )}
          {walrusSuiObjectId && (
            <div className="mb-3">
              <p className="text-[11px] uppercase tracking-wide text-emerald-300 mb-1">Walrus Sui Object</p>
              <p className="text-xs text-gray-300 font-mono break-all">{walrusSuiObjectId}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button onClick={() => copyValue('object', walrusSuiObjectId)} className="text-xs font-semibold text-cyan-300 hover:text-cyan-200"><Copy className="mr-1 inline h-3 w-3" />{copied === 'object' ? 'Copied' : 'Copy'}</button>
                {walrusObjectUrl && <a href={walrusObjectUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-cyan-300 hover:text-cyan-200"><ExternalLink className="mr-1 inline h-3 w-3" />View object</a>}
              </div>
            </div>
          )}
          {memory.suiRef && (
            <div className="mb-3">
              <p className="text-[11px] uppercase tracking-wide text-emerald-300 mb-1">Walrus Sui Reference</p>
              <p className="text-xs text-gray-300 font-mono break-all">{memory.suiRef}</p>
            </div>
          )}
          {memory.suiTxDigest && (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-purple-400 mb-1">Sui Transaction</p>
              <p className="text-xs text-gray-300 font-mono break-all mb-2">{memory.suiTxDigest}</p>
              <button onClick={() => copyValue('tx', memory.suiTxDigest!)} className="mr-3 text-xs font-semibold text-cyan-300 hover:text-cyan-200"><Copy className="mr-1 inline h-3 w-3" />{copied === 'tx' ? 'Copied' : 'Copy'}</button>
              {suiExplorerUrl && (
                <a
                  href={suiExplorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-cyan-300 hover:text-cyan-200"
                >
                  <ExternalLink className="mr-1 inline h-3 w-3" />View on SuiScan
                </a>
              )}
              <div className="mt-3">
                <TatumVerificationButton digest={memory.suiTxDigest} compact />
              </div>
            </div>
          )}
          <p className="mt-3 text-xs leading-relaxed text-gray-500">
            Media and metadata are stored on Walrus. Sui proof is created after upload through wallet execution.
          </p>
        </GlassCard>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Link href={`/memory/${memory.id}`} className="flex-1">
          <GlowButton variant="primary" size="md" className="w-full flex items-center justify-center gap-2">
            <Eye className="w-4 h-4" />
            View Full
          </GlowButton>
        </Link>
        <GlowButton
          variant="ghost"
          size="md"
          onClick={() => copyValue('share', `${window.location.origin}/memory/${memory.id}`)}
          className="flex-1 flex items-center justify-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          {copied === 'share' ? 'Copied' : 'Share'}
        </GlowButton>
      </div>
      <button
        type="button"
        onClick={() => void toggleSave()}
        disabled={isSaving}
        className="mt-4 w-full px-4 py-3 rounded-lg border border-pink-500/30 text-pink-300 hover:bg-pink-500/10 transition flex items-center justify-center gap-2 disabled:cursor-wait disabled:opacity-70"
      >
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />}
        {isSaving ? 'Syncing...' : saved ? 'Saved' : 'Save Memory'}
      </button>
      {saveError && <p className="mt-2 text-center text-xs font-semibold text-yellow-200">{saveError}</p>}
    </FloatingPanel>
  );
}
