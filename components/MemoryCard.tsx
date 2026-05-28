'use client';

import { Heart, Loader2, MapPin } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { MemoryMedia } from './MemoryMedia';
import { cn } from '@/lib/utils';
import { useMemoryStore } from '@/store/memory-store';
import { useRegistrySavedMemory } from '@/hooks/useRegistrySavedMemory';

interface MemoryCardProps {
  title: string;
  location: string;
  year: number;
  image: string;
  id?: string;
  category?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'unknown';
  mimeType?: string;
  proofStatus?: 'starter' | 'walrus-only' | 'verified' | 'failed';
  visibility?: 'public' | 'unlisted';
  onClick?: () => void;
  variant?: 'grid' | 'compact' | 'horizontal';
  className?: string;
}

export function MemoryCard({
  title,
  location,
  year,
  image,
  id,
  category,
  mediaType,
  mimeType,
  proofStatus,
  visibility = 'public',
  onClick,
  variant = 'grid',
  className,
}: MemoryCardProps) {
  const { memoryDetails } = useMemoryStore();
  const memory = id ? memoryDetails[id] : null;
  const { saved, isSaving, toggleSave } = useRegistrySavedMemory(memory);
  const proofLabel =
    proofStatus === 'verified'
      ? 'Verified'
      : proofStatus === 'walrus-only'
        ? 'Walrus only'
        : proofStatus === 'failed'
          ? 'Proof failed'
          : proofStatus === 'starter'
            ? null
            : null;
  const saveButton = id ? (
    <button
      type="button"
      aria-label={saved ? 'Unsave memory' : 'Save memory'}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void toggleSave();
      }}
      disabled={isSaving}
      className={cn(
        'rounded-lg border p-2 transition disabled:cursor-wait disabled:opacity-70',
        saved
          ? 'border-pink-400/50 bg-pink-500/20 text-pink-300'
          : 'border-white/10 bg-black/30 text-gray-300 hover:border-pink-400/40 hover:text-pink-300'
      )}
    >
      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className={cn('h-4 w-4', saved && 'fill-current')} />}
    </button>
  ) : null;

  if (variant === 'compact') {
    return (
      <GlassCard strong onClick={onClick} className="p-4 hover:border-cyan-400/50">
        <div className="flex items-start gap-4">
          <MemoryMedia image={image} title={title} mediaType={mediaType} mimeType={mimeType} className="h-16 w-16 flex-shrink-0 rounded-lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <h3 className="min-w-0 flex-1 truncate font-semibold text-white">{title}</h3>
              {saveButton}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-400 mt-1">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{location}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{year}{category ? ` - ${category}` : ''}</p>
          </div>
        </div>
      </GlassCard>
    );
  }

  if (variant === 'horizontal') {
    return (
      <GlassCard strong onClick={onClick} className="p-4 cursor-pointer">
        <div className="flex gap-4 items-center">
          <MemoryMedia image={image} title={title} mediaType={mediaType} mimeType={mimeType} className="h-20 w-20 flex-shrink-0 rounded-lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <h3 className="min-w-0 flex-1 text-sm font-bold text-white line-clamp-2 md:text-base">{title}</h3>
              {saveButton}
            </div>
            <div className="flex items-center gap-1 text-xs md:text-sm text-gray-400 mt-1">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{location}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{year}{category ? ` - ${category}` : ''}</p>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard onClick={onClick} className={cn('overflow-hidden h-64 group relative cursor-pointer', className)}>
      <MemoryMedia image={image} title={title} mediaType={mediaType} mimeType={mimeType} />
      <div className="absolute right-3 top-3 z-10">{saveButton}</div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
        <h3 className="text-white font-bold text-lg mb-1 line-clamp-2">{title}</h3>
        <div className="flex items-center gap-1 text-sm text-gray-300">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{location}</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <p className="text-xs text-gray-400">{year}</p>
          {category && <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[11px] font-semibold text-cyan-200">{category}</span>}
          {proofLabel && <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[11px] font-semibold text-purple-200">{proofLabel}</span>}
          <span className={cn(
            'rounded-full px-2 py-0.5 text-[11px] font-semibold',
            visibility === 'unlisted'
              ? 'bg-yellow-500/15 text-yellow-200'
              : 'bg-emerald-500/15 text-emerald-200'
          )}>
            {visibility === 'unlisted' ? 'Unlisted' : 'Public'}
          </span>
        </div>
      </div>
    </GlassCard>
  );
}
