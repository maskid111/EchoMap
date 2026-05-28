import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glow?: 'cyan' | 'purple' | 'pink' | 'none';
  strong?: boolean;
  onClick?: () => void;
}

export function GlassCard({
  children,
  className,
  glow = 'none',
  strong = false,
  onClick,
}: GlassCardProps) {
  const glowClasses = {
    cyan: 'glow-cyan',
    purple: 'glow-purple',
    pink: 'glow-pink',
    none: '',
  };

  return (
    <div
      className={cn(
        strong ? 'glass-effect-strong' : 'glass-effect',
        'rounded-xl transition-all duration-300',
        glowClasses[glow],
        onClick && 'cursor-pointer hover:border-cyan-400/50',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
