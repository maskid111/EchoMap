'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { MemorySummary } from '@/lib/types';

interface MemoryMediaProps {
  image: string;
  title?: string;
  className?: string;
  mediaType?: MemorySummary['mediaType'];
  mimeType?: string;
  controls?: boolean;
}

function isMediaUrl(value: string) {
  return /^(https?:|blob:|data:)/.test(value);
}

function inferType(value: string, mediaType?: MemorySummary['mediaType'], mimeType?: string) {
  if (mediaType && mediaType !== 'unknown') return mediaType;
  if (mimeType?.startsWith('video/')) return 'video';
  if (mimeType?.startsWith('audio/')) return 'audio';
  if (mimeType?.startsWith('image/')) return 'image';
  const normalized = value.toLowerCase();
  if (/^data:video|^blob:|\.((mp4)|(webm)|(mov)|(m4v)|(ogg))(\?|$)/.test(normalized)) return 'video';
  if (/^data:audio|\.((mp3)|(wav)|(m4a)|(aac))(\?|$)/.test(normalized)) return 'audio';
  return 'image';
}

export function MemoryMedia({
  image,
  title = 'Memory media',
  className,
  mediaType,
  mimeType,
  controls = false,
}: MemoryMediaProps) {
  const [failed, setFailed] = useState(false);

  if (isMediaUrl(image)) {
    const resolvedType = inferType(image, mediaType, mimeType);

    if (!failed && resolvedType === 'video') {
      return (
        <video
          src={image}
          title={title}
          className={cn('h-full w-full object-cover', className)}
          controls={controls}
          muted
          playsInline
          preload="metadata"
          onError={() => setFailed(true)}
        />
      );
    }

    if (!failed && resolvedType === 'audio') {
      return (
        <div className={cn('flex h-full w-full items-center justify-center bg-black/40 p-4', className)}>
          <audio src={image} controls className="w-full" onError={() => setFailed(true)} />
        </div>
      );
    }

    return (
      <img
        src={image}
        alt={title}
        className={cn('h-full w-full object-cover', className)}
        onError={() => setFailed(true)}
      />
    );
  }

  return <div className={cn('h-full w-full', image, className)} />;
}
