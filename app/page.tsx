'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { MapPin, Upload } from 'lucide-react';
import { memoryCategories } from '@/lib/mock-data';
import { WalletConnectButton } from '@/components/WalletConnectButton';
import { MemoryMedia } from '@/components/MemoryMedia';
import { useMemoryStore } from '@/store/memory-store';

export default function Home() {
  const [activeYear, setActiveYear] = useState(2023);
  const { memories } = useMemoryStore();
  const years = useMemo(
    () => Array.from(new Set(memories.map((memory) => memory.year))).sort((a, b) => a - b),
    [memories]
  );
  const categories = memoryCategories;
  const activeYearCount = memories.filter((memory) => memory.year === activeYear).length;
  const timelineYears = years.length > 0 ? years : [new Date().getFullYear()];

  useEffect(() => {
    if (years.length > 0 && !years.includes(activeYear)) {
      setActiveYear(years[years.length - 1]);
    }
  }, [activeYear, years]);

  return (
    <main className="min-h-screen overflow-hidden">
      {/* Ambient Background Effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              EM
            </div>
            <span className="text-xl font-bold text-white">EchoMap</span>
          </div>
          <div className="flex items-center gap-8">
            <a href="#explore" className="hidden sm:inline text-sm text-gray-300 hover:text-cyan-400 transition">
              Explore
            </a>
            <a href="#features" className="hidden sm:inline text-sm text-gray-300 hover:text-cyan-400 transition">
              Features
            </a>
            <Link href="/upload" className="hidden sm:inline text-sm text-gray-300 hover:text-cyan-400 transition">
              Upload
            </Link>
            <WalletConnectButton />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-between px-6 pt-24">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-12">
          {/* Left Content */}
          <div className="flex-1 z-10">
            <h1 className="text-6xl md:text-7xl font-bold leading-tight mb-6 text-white">
              The World Never{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500">
                Forgets
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-lg">
              Preserve memories, culture, and history permanently on Walrus and Sui. Build the world&apos;s decentralized memory archive.
            </p>
            <div className="flex gap-4">
              <Link href="/explore" className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 text-black font-semibold rounded-lg hover:from-cyan-400 hover:to-cyan-500 transition shadow-lg glow-cyan inline-block">
                Explore Memories
              </Link>
              <Link href="/upload" className="px-8 py-4 border border-purple-500/50 text-purple-300 font-semibold rounded-lg hover:bg-purple-500/10 transition glass-effect inline-block">
                Preserve a Moment
              </Link>
            </div>
          </div>

          {/* Right visual preview */}
          <div className="flex-1 relative h-96">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full h-full">
                <svg
                  className="w-full h-full animate-spin"
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

                <div className="absolute top-12 left-10 w-4 h-4 bg-cyan-400 rounded-full glow-cyan animate-pulse" />
                <div className="absolute top-1/3 right-16 w-3 h-3 bg-pink-500 rounded-full glow-pink animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="absolute bottom-20 left-1/4 w-3 h-3 bg-purple-400 rounded-full glow-purple animate-pulse" style={{ animationDelay: '0.4s' }} />
                <div className="absolute bottom-1/3 right-1/4 w-4 h-4 bg-cyan-400 rounded-full glow-cyan animate-pulse" style={{ animationDelay: '0.6s' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Globe Section */}
      <section id="explore" className="relative py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-white mb-4">Explore the Memory Map</h2>
            <p className="text-gray-400 text-lg">Open the live world map to search, filter, and inspect preserved memories</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <Link href="/explore" className="relative h-96 glass-effect-strong rounded-2xl flex items-center justify-center overflow-hidden group hover:border-cyan-400/50 transition">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-48 h-48 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                    <MapPin className="w-24 h-24 text-cyan-400 group-hover:glow-cyan transition" />
                  </div>
                  <p className="text-gray-300 font-semibold">Launch Explore</p>
                  <p className="mt-2 text-sm text-gray-500">View the interactive MapLibre world map</p>
                </div>
              </div>
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-1/4 left-1/4 w-16 h-16 border border-cyan-400 rounded-full" style={{ animation: 'pulse 2s infinite' }} />
                <div className="absolute top-1/3 right-1/4 w-12 h-12 border border-purple-400 rounded-full" style={{ animation: 'pulse 2s 0.3s infinite' }} />
                <div className="absolute bottom-1/4 left-1/3 w-14 h-14 border border-pink-400 rounded-full" style={{ animation: 'pulse 2s 0.6s infinite' }} />
              </div>
            </Link>

            <div className="space-y-4">
              {memories.length > 0 ? memories.slice(0, 3).map((memory) => (
                <Link
                  key={memory.id}
                  href={`/memory/${memory.id}`}
                  className="group glass-effect-strong rounded-xl p-4 cursor-pointer hover:border-cyan-400/50 transition block"
                >
                  <div className="flex items-start gap-4">
                    <MemoryMedia
                      image={memory.image}
                      title={memory.title}
                      mediaType={memory.mediaType}
                      mimeType={memory.mimeType}
                      className="h-16 w-16 flex-shrink-0 rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold group-hover:text-cyan-400 transition">{memory.title}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-400 mt-1">
                        <MapPin className="w-4 h-4" />
                        {memory.location}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{memory.year}</p>
                    </div>
                  </div>
                </Link>
              )) : (
                <div className="glass-effect-strong rounded-xl p-6 text-center">
                  <p className="font-semibold text-white">No memories preserved yet.</p>
                  <p className="mt-2 text-sm text-gray-400">Be the first to preserve a memory.</p>
                  <Link href="/upload" className="mt-4 inline-flex rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black hover:bg-cyan-400">
                    Preserve a Memory
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Slider */}
      <section className="relative py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-white">Timeline</h3>
            <p className="text-gray-400 mt-2">Explore memories through the years</p>
          </div>

          <div className="glass-effect-strong rounded-xl p-8">
            <div className="flex items-center justify-between mb-8">
              {timelineYears.map((year) => (
                <Link
                  key={year}
                  href={`/explore?year=${year}`}
                  onMouseEnter={() => setActiveYear(year)}
                  onFocus={() => setActiveYear(year)}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    activeYear === year
                      ? 'bg-cyan-500 text-black glow-cyan'
                      : 'text-gray-400 hover:text-cyan-400'
                  }`}
                >
                  {year}
                </Link>
              ))}
            </div>

            {/* Timeline Visualization */}
            <div className="relative h-2 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full glow-cyan transition-all duration-300"
                style={{
                  width: timelineYears.length > 1
                    ? `${((activeYear - Math.min(...timelineYears)) / (Math.max(...timelineYears) - Math.min(...timelineYears))) * 100}%`
                    : '100%',
                }}
              />
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-300">
                {activeYearCount > 0
                  ? `${activeYearCount} ${activeYearCount === 1 ? 'memory' : 'memories'} from ${activeYear}`
                  : 'No memories preserved yet. Be the first to preserve a memory.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Memories */}
      <section id="features" className="relative py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-white mb-4">Featured Memories</h2>
            <p className="text-gray-400 text-lg">Discover stories preserved forever</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {memories.length > 0 ? memories.slice(0, 8).map((memory) => (
              <Link
                key={memory.id}
                href={`/memory/${memory.id}`}
                className="group relative rounded-xl overflow-hidden glass-effect-strong hover:border-cyan-400/50 transition h-64"
              >
                <MemoryMedia
                  image={memory.image}
                  title={memory.title}
                  mediaType={memory.mediaType}
                  mimeType={memory.mimeType}
                  className="h-full w-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
                  <h3 className="text-white font-bold text-lg mb-1">{memory.title}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-300">
                    <MapPin className="w-4 h-4" />
                    {memory.location}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{memory.year}</p>
                </div>
              </Link>
            )) : (
              <div className="col-span-full glass-effect-strong rounded-xl p-8 text-center">
                <p className="font-semibold text-white">No memories preserved yet.</p>
                <p className="mt-2 text-sm text-gray-400">Be the first to preserve a memory.</p>
                <Link href="/upload" className="mt-4 inline-flex rounded-lg bg-cyan-500 px-5 py-3 text-sm font-semibold text-black hover:bg-cyan-400">
                  Preserve a Memory
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="relative py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl font-bold text-white mb-8 text-center">Browse by Category</h3>
          <div className="flex flex-wrap gap-4 justify-center">
            {categories.map((category) => (
              <Link
                key={category}
                href={`/explore?category=${encodeURIComponent(category)}`}
                className="px-6 py-3 glass-effect rounded-full text-white font-semibold hover:border-cyan-400/80 hover:glow-cyan transition"
              >
                {category}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Upload CTA */}
      <section id="upload" className="relative py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="glass-effect-strong rounded-2xl p-12 text-center border border-purple-500/30 hover:border-cyan-400/50 transition">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Upload className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">Preserve Your Memory Forever</h2>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Upload your stories, photos, and moments. They&apos;ll be stored permanently on Walrus and Sui, accessible to the world forever.
            </p>
            <Link href="/upload" className="px-10 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:from-purple-600 hover:to-pink-600 transition glow-purple inline-flex items-center gap-2 mx-auto">
              <Upload className="w-5 h-5" />
              Start Uploading
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-6 border-t border-cyan-500/10 bg-black/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-bold mb-4">EchoMap</h4>
              <p className="text-gray-400 text-sm">The world&apos;s decentralized memory archive.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <Link href="/explore" className="hover:text-cyan-400 transition">
                    Explore
                  </Link>
                </li>
                <li>
                  <Link href="/upload" className="hover:text-cyan-400 transition">
                    Upload
                  </Link>
                </li>
                <li>
                  <Link href="/explore?view=categories" className="hover:text-cyan-400 transition">
                    Collections
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Built With</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="https://sui.io" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition">Sui Network</a></li>
                <li><a href="https://www.walrus.xyz" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition">Walrus Storage</a></li>
                <li>MapLibre + OpenFreeMap</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Connect</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <span className="text-gray-500">
                    Twitter
                  </span>
                </li>
                <li>
                  <span className="text-gray-500">
                    Discord
                  </span>
                </li>
                <li>
                  <span className="text-gray-500">
                    GitHub
                  </span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-cyan-500/10 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">© 2026 EchoMap. All memories preserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <span className="text-gray-500 text-sm">
                Privacy
              </span>
              <span className="text-gray-500 text-sm">
                Terms
              </span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
