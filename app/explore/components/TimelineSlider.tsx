'use client';

import { GlassCard } from '@/components/GlassCard';
import { cn } from '@/lib/utils';

interface TimelineSliderProps {
  activeYear: number;
  onYearChange: (year: number) => void;
  memoryCount: Record<number, number>;
}

export function TimelineSlider({
  activeYear,
  onYearChange,
  memoryCount,
}: TimelineSliderProps) {
  const timelineYears = Array.from(
    new Set(Object.keys(memoryCount).map(Number).filter(Number.isFinite))
  ).sort((a, b) => a - b);
  const hasMemories = timelineYears.length > 0;
  const yearsToRender = hasMemories ? timelineYears : [new Date().getFullYear()];
  const minYear = Math.min(...yearsToRender);
  const maxYear = Math.max(...yearsToRender);
  const progress = maxYear === minYear ? 100 : ((activeYear - minYear) / (maxYear - minYear)) * 100;

  return (
    <div className="relative z-20 w-full overflow-hidden border-t border-cyan-500/20 bg-black/40 p-3 backdrop-blur-md lg:fixed lg:bottom-0 lg:left-64 lg:right-0 lg:p-4 xl:p-6">
      <div className="mx-auto max-w-6xl">
        <GlassCard strong className="p-4 sm:p-5 lg:p-6 xl:p-8">
          <div className="mb-4 flex w-full items-center gap-2 overflow-x-auto pb-2 sm:gap-3 lg:mb-8 lg:justify-between lg:overflow-visible lg:pb-0">
            {yearsToRender.map((year) => (
              <button
                key={year}
                onClick={() => onYearChange(year)}
                className={cn(
                  'relative flex-shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 sm:px-4 sm:text-base',
                  activeYear === year
                    ? 'bg-cyan-500 text-black glow-cyan'
                    : 'text-gray-400 hover:text-cyan-400'
                )}
              >
                {year}
                {memoryCount[year] > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center">
                    {memoryCount[year]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Timeline bar */}
          <div className="relative h-2 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full glow-cyan transition-all duration-300"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          {/* Year info */}
          <div className="mt-4 text-center lg:mt-6">
            <p className="text-sm text-gray-300 sm:text-base">
              {hasMemories
                ? <>{memoryCount[activeYear] || 0} memories from <span className="text-cyan-400 font-bold">{activeYear}</span></>
                : 'No memories preserved yet. Be the first to add one.'}
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
