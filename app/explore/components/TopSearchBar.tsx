'use client';

import { Search, X } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { cn } from '@/lib/utils';
import { memoryCategories } from '@/lib/mock-data';
import { useMemoryStore } from '@/store/memory-store';

export function TopSearchBar() {
  const { searchQuery, selectedCategories, setSearchQuery, toggleCategory } = useMemoryStore();

  return (
    <div className="relative z-20 border-b border-cyan-500/20 bg-black/40 p-3 backdrop-blur-md sm:p-5 lg:sticky lg:top-0 lg:z-30 lg:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Search Input */}
        <GlassCard strong className="mb-3 flex items-center gap-3 p-3 focus-within:glow-cyan sm:mb-4 sm:p-4">
          <Search className="h-5 w-5 flex-shrink-0 text-cyan-400" />
          <input
            type="text"
            placeholder="Search memories by location, story, creator..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none sm:text-base"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
              }}
              className="p-1 hover:bg-cyan-500/20 rounded-lg transition"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </GlassCard>

        {/* Filter Chips */}
        <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:-mx-5 sm:px-5 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
          {memoryCategories.map((category) => (
            <button
              key={category}
              onClick={() => toggleCategory(category)}
              className={cn(
                'flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
                selectedCategories.includes(category)
                  ? 'bg-cyan-500 text-black glow-cyan'
                  : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20'
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
