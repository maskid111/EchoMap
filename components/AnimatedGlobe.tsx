'use client';

import { cn } from '@/lib/utils';

interface AnimatedGlobeProps {
  className?: string;
  interactive?: boolean;
}

export function AnimatedGlobe({ className, interactive = false }: AnimatedGlobeProps) {
  return (
    <div className={cn('relative w-full h-full flex items-center justify-center', className)}>
      <svg
        className={cn('w-full h-full animate-spin', !interactive && 'max-w-md max-h-md')}
        style={{ animationDuration: '20s' }}
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="globeGradient">
            <stop offset="0%" stopColor="rgba(0, 217, 255, 0.6)" />
            <stop offset="100%" stopColor="rgba(187, 134, 252, 0.3)" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="95" fill="url(#globeGradient)" opacity="0.4" />
        <circle cx="100" cy="100" r="90" fill="none" stroke="url(#globeGradient)" strokeWidth="0.5" opacity="0.6" />
        <circle cx="100" cy="100" r="80" fill="none" stroke="url(#globeGradient)" strokeWidth="0.5" opacity="0.4" />
      </svg>

      {/* Floating Pins */}
      <div className="absolute top-12 left-10 w-4 h-4 bg-cyan-400 rounded-full glow-cyan animate-pulse" />
      <div
        className="absolute top-1/3 right-16 w-3 h-3 bg-pink-500 rounded-full glow-pink animate-pulse"
        style={{ animationDelay: '0.2s' }}
      />
      <div
        className="absolute bottom-20 left-1/4 w-3 h-3 bg-purple-400 rounded-full glow-purple animate-pulse"
        style={{ animationDelay: '0.4s' }}
      />
      <div
        className="absolute bottom-1/3 right-1/4 w-4 h-4 bg-cyan-400 rounded-full glow-cyan animate-pulse"
        style={{ animationDelay: '0.6s' }}
      />
    </div>
  );
}
