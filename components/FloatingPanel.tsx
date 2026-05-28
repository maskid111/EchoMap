'use client';

import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { cn } from '@/lib/utils';

interface FloatingPanelProps {
  title?: string;
  children: ReactNode;
  onClose?: () => void;
  className?: string;
  isOpen?: boolean;
  position?: 'right' | 'left' | 'bottom';
}

export function FloatingPanel({
  title,
  children,
  onClose,
  className,
  isOpen = true,
  position = 'right',
}: FloatingPanelProps) {
  if (!isOpen) return null;

  const positionClasses = {
    right: 'fixed inset-x-0 bottom-0 h-[82vh] animate-slide-in-up sm:inset-y-0 sm:left-auto sm:right-0 sm:h-auto sm:w-96 sm:animate-slide-in-right',
    left: 'fixed inset-x-0 bottom-0 h-[82vh] animate-slide-in-up sm:inset-y-0 sm:right-auto sm:left-0 sm:h-auto sm:w-96 sm:animate-slide-in-left',
    bottom: 'fixed bottom-0 left-0 right-0 h-[82vh] max-h-[32rem] animate-slide-in-up',
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className={cn(positionClasses[position], 'z-[60]', className)}>
        <GlassCard strong className="flex h-full flex-col overflow-hidden rounded-t-2xl sm:m-4 sm:rounded-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-cyan-500/20">
            {title && <h2 className="text-lg font-bold text-white">{title}</h2>}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-cyan-500/20 rounded-lg transition"
              >
                <X className="w-5 h-5 text-cyan-400" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
        </GlassCard>
      </div>
    </>
  );
}
