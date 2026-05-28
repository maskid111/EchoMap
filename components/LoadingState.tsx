import { GlassCard } from './GlassCard';

interface LoadingStateProps {
  variant?: 'card' | 'skeleton' | 'spinner';
  className?: string;
}

export function LoadingState({ variant = 'spinner', className }: LoadingStateProps) {
  if (variant === 'card') {
    return (
      <GlassCard strong className="p-6 space-y-4">
        <div className="h-4 bg-cyan-500/20 rounded-lg animate-pulse w-3/4" />
        <div className="h-4 bg-cyan-500/20 rounded-lg animate-pulse" />
        <div className="h-4 bg-cyan-500/20 rounded-lg animate-pulse w-2/3" />
      </GlassCard>
    );
  }

  if (variant === 'skeleton') {
    return (
      <div className={className}>
        <div className="h-64 bg-cyan-500/20 rounded-lg animate-pulse mb-4" />
        <div className="space-y-3">
          <div className="h-4 bg-cyan-500/20 rounded-lg animate-pulse w-3/4" />
          <div className="h-4 bg-cyan-500/20 rounded-lg animate-pulse" />
          <div className="h-4 bg-cyan-500/20 rounded-lg animate-pulse w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 animate-spin" />
        <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-cyan-500 border-r-purple-500 animate-spin" style={{ animationDuration: '1.5s' }} />
      </div>
    </div>
  );
}
