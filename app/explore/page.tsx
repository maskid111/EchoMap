'use client';

import { Suspense } from 'react';
import { useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { GlassCard } from '@/components/GlassCard';
import { useSearchParams } from 'next/navigation';
import { TopSearchBar } from './components/TopSearchBar';
import { GlobeVisualization } from './components/GlobeVisualization';
import { TimelineSlider } from './components/TimelineSlider';
import { MemoryDetailPanel } from './components/MemoryDetailPanel';
import { useMemoryStore } from '@/store/memory-store';

function ExplorePageContent() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view');
  const yearParam = searchParams.get('year');
  const categoryParam = searchParams.get('category');
  const {
    activeMemory,
    closeActiveMemory,
    filteredMemories,
    memories,
    savedMemoryIds,
    memoryCountByYear,
    selectedYear,
    selectedCategories,
    setActiveMemoryById,
    setSelectedCategories,
    setSelectedYear,
  } = useMemoryStore();

  useEffect(() => {
    if (yearParam || memories.length === 0 || memoryCountByYear[selectedYear]) return;
    const latestYear = Math.max(...Object.keys(memoryCountByYear).map(Number).filter(Number.isFinite));
    if (Number.isFinite(latestYear)) {
      setSelectedYear(latestYear);
    }
  }, [memories.length, memoryCountByYear, selectedYear, setSelectedYear, yearParam]);

  useEffect(() => {
    const parsedYear = yearParam ? Number.parseInt(yearParam, 10) : null;
    if (parsedYear && Number.isFinite(parsedYear) && parsedYear !== selectedYear) {
      setSelectedYear(parsedYear);
    }
  }, [selectedYear, setSelectedYear, yearParam]);

  useEffect(() => {
    if (!categoryParam) return;
    const category = categoryParam.trim();
    if (category && (selectedCategories.length !== 1 || selectedCategories[0] !== category)) {
      setSelectedCategories([category]);
    }
  }, [categoryParam, selectedCategories, setSelectedCategories]);
  const visibleMemories = view === 'saved'
    ? filteredMemories.filter((memory) => savedMemoryIds.includes(memory.id))
    : filteredMemories;

  return (
    <AppShell>
      <div className="flex min-h-screen flex-col lg:h-screen lg:overflow-hidden">
        {/* Search bar */}
        <TopSearchBar />

        {/* Globe visualization */}
        <GlobeVisualization
          memories={visibleMemories}
          selectedYear={selectedYear}
          onSelectMemory={(memory) => setActiveMemoryById(memory.id)}
        />

        {/* Timeline slider */}
        <TimelineSlider
          activeYear={selectedYear}
          onYearChange={setSelectedYear}
          memoryCount={memoryCountByYear}
        />
      </div>

      {view === 'saved' && visibleMemories.length === 0 && (
        <div className="fixed bottom-24 left-4 right-4 z-30 mx-auto max-w-sm lg:bottom-32 lg:left-[17rem]">
          <GlassCard strong className="p-4 text-center">
            <p className="text-sm font-semibold text-cyan-200">No saved memories yet</p>
            <p className="mt-1 text-xs text-gray-400">Save a memory from a card or detail panel to see it here.</p>
          </GlassCard>
        </div>
      )}

      {view !== 'saved' && memories.length === 0 && (
        <div className="fixed bottom-24 left-4 right-4 z-30 mx-auto max-w-sm lg:bottom-32 lg:left-[17rem]">
          <GlassCard strong className="p-4 text-center">
            <p className="text-sm font-semibold text-cyan-200">No memories preserved yet.</p>
            <p className="mt-1 text-xs text-gray-400">Be the first to add one.</p>
          </GlassCard>
        </div>
      )}

      {/* Memory detail panel */}
      <MemoryDetailPanel
        memory={activeMemory}
        onClose={closeActiveMemory}
      />
    </AppShell>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={null}>
      <ExplorePageContent />
    </Suspense>
  );
}
