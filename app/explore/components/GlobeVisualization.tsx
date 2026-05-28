'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { GlassCard } from '@/components/GlassCard';
import { MapStyleToggle } from '@/components/MapStyleToggle';
import { MapPin } from 'lucide-react';
import { defaultEchoMapStyle, type EchoMapStyleId } from '@/lib/map-style';
import type { MemoryPin } from '@/lib/types';

const InteractiveWorldMap = dynamic(
  () => import('./InteractiveWorldMap').then((mod) => mod.InteractiveWorldMap),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-full rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 animate-pulse glow-cyan" />
      </div>
    ),
  }
);

interface GlobeVisualizationProps {
  memories: MemoryPin[];
  selectedYear?: number;
  onSelectMemory?: (memory: MemoryPin) => void;
}

export function GlobeVisualization({
  memories,
  selectedYear,
  onSelectMemory,
}: GlobeVisualizationProps) {
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState<EchoMapStyleId>(defaultEchoMapStyle);

  const visibleMemories = selectedYear
    ? memories.filter((m) => m.year === selectedYear)
    : memories;

  return (
    <div className="relative flex flex-col items-stretch px-3 py-4 sm:px-5 sm:py-6 lg:min-h-0 lg:flex-1 lg:items-center lg:justify-center lg:px-8 lg:pb-44 lg:pt-8 xl:pb-48">
      {/* Background ambient effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />
      </div>

      {/* World Map Container */}
      <div className="relative mb-4 h-[clamp(20rem,52vh,34rem)] w-full max-w-none overflow-hidden rounded-2xl border border-cyan-500/20 glass-effect-strong sm:mb-6 sm:h-[58vh] lg:mb-6 lg:h-[min(52vh,36rem)] lg:max-w-6xl xl:h-[min(58vh,40rem)]">
        <div className="absolute inset-0 bg-cyan-500/5 blur-3xl pointer-events-none" />
        <MapStyleToggle
          value={mapStyle}
          onChange={setMapStyle}
          className="absolute left-3 right-3 top-3 z-10 justify-center sm:left-4 sm:right-auto sm:top-4"
        />
        <InteractiveWorldMap
          memories={visibleMemories}
          mapStyle={mapStyle}
          onHoverMemory={setHoveredPin}
          onSelectMemory={(memory) => onSelectMemory?.(memory)}
        />
        {hoveredPin && (
          <GlassCard strong className="pointer-events-none absolute left-1/2 top-20 max-w-[calc(100%-2rem)] -translate-x-1/2 animate-fade-in px-4 py-3 text-center sm:top-6 sm:max-w-xs">
            <div className="flex items-center gap-2 justify-center mb-1">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <p className="text-sm font-semibold text-cyan-300">
                {visibleMemories.find((m) => m.id === hoveredPin)?.title}
              </p>
            </div>
            <p className="text-xs text-gray-400">
              {visibleMemories.find((m) => m.id === hoveredPin)?.location}
            </p>
          </GlassCard>
        )}
      </div>

      {/* Stats or hover info */}
      {!hoveredPin && visibleMemories.length === 0 && (
        <GlassCard strong className="p-4 text-center max-w-xs animate-fade-in">
          <p className="text-sm font-semibold text-cyan-300">No memories match these filters</p>
        </GlassCard>
      )}

      {/* Memory count */}
      <div className="mt-2 text-center lg:mt-8">
        <p className="text-gray-300">
          <span className="text-cyan-400 font-bold">{visibleMemories.length}</span> memories {selectedYear ? `from ${selectedYear}` : 'from around the world'}
        </p>
      </div>
    </div>
  );
}
