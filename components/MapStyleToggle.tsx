'use client';

import { echoMapStyles, type EchoMapStyleId } from '@/lib/map-style';
import { cn } from '@/lib/utils';

interface MapStyleToggleProps {
  value: EchoMapStyleId;
  onChange: (style: EchoMapStyleId) => void;
  className?: string;
}

const styleOrder: EchoMapStyleId[] = ['bright', 'positron', 'liberty', 'dark'];

export function MapStyleToggle({ value, onChange, className }: MapStyleToggleProps) {
  return (
    <div className={cn('inline-flex flex-wrap gap-1 rounded-lg border border-cyan-500/25 bg-black/55 p-1 backdrop-blur-md', className)}>
      {styleOrder.map((styleId) => (
        <button
          key={styleId}
          type="button"
          onClick={() => onChange(styleId)}
          className={cn(
            'rounded-md px-3 py-1.5 text-xs font-semibold transition',
            value === styleId
              ? 'bg-cyan-500 text-black shadow-[0_0_18px_rgba(0,217,255,.35)]'
              : 'text-cyan-200 hover:bg-cyan-500/10'
          )}
        >
          {echoMapStyles[styleId].label}
        </button>
      ))}
    </div>
  );
}
