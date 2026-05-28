'use client';

import { useEffect, useRef } from 'react';
import { useState } from 'react';
import maplibregl, { type LngLatBoundsLike, type Map, type Marker } from 'maplibre-gl';
import { echoMapStyles, loadEchoMapStyle, type EchoMapStyleId } from '@/lib/map-style';
import type { MemoryPin } from '@/lib/types';

interface InteractiveWorldMapProps {
  memories: MemoryPin[];
  mapStyle: EchoMapStyleId;
  onHoverMemory: (id: string | null) => void;
  onSelectMemory: (memory: MemoryPin) => void;
}

function createMarkerElement(memory: MemoryPin) {
  const marker = document.createElement('button');
  marker.type = 'button';
  marker.className = 'echomap-memory-marker';
  marker.setAttribute('aria-label', memory.title);

  const pulse = document.createElement('span');
  pulse.className = 'echomap-memory-marker-pulse';
  marker.appendChild(pulse);

  const dot = document.createElement('span');
  dot.className = 'echomap-memory-marker-dot';
  marker.appendChild(dot);

  const label = document.createElement('span');
  label.className = 'echomap-memory-marker-label';
  label.textContent = `${memory.title} - ${memory.location}`;
  marker.appendChild(label);

  return marker;
}

export function InteractiveWorldMap({
  memories,
  mapStyle,
  onHoverMemory,
  onSelectMemory,
}: InteractiveWorldMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const onHoverRef = useRef(onHoverMemory);
  const onSelectRef = useRef(onSelectMemory);
  const initialMapStyleRef = useRef(mapStyle);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapTone = echoMapStyles[mapStyle].tone;

  useEffect(() => {
    onHoverRef.current = onHoverMemory;
    onSelectRef.current = onSelectMemory;
  }, [onHoverMemory, onSelectMemory]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    let isCancelled = false;

    async function initializeMap() {
      setIsLoaded(false);
      setMapError(null);

      try {
        const style = await loadEchoMapStyle(initialMapStyleRef.current);
        if (isCancelled || !containerRef.current || mapRef.current) {
          return;
        }

        const map = new maplibregl.Map({
          container: containerRef.current,
          style,
          center: [15, 18],
          zoom: 1.55,
          minZoom: 1,
          maxZoom: 12,
          pitch: 0,
          attributionControl: false,
        });

        map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), 'top-right');
        map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
        map.on('load', () => {
          setIsLoaded(true);
          setMapError(null);
          map.resize();
        });
        map.on('error', (event) => {
          const message = event.error?.message ?? '';
          console.warn('MapLibre Explore map error', event.error);
          if (!/glyph|font/i.test(message)) {
            setMapError('Map tiles could not be loaded. Check your network connection.');
          }
        });
        mapRef.current = map;
        window.setTimeout(() => map.resize(), 0);
      } catch (error) {
        if (!isCancelled) {
          console.warn('MapLibre Explore style error', error);
          setMapError('Map style could not be loaded. Check your network connection.');
        }
      }
    }

    initializeMap();

    return () => {
      isCancelled = true;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    setIsLoaded(false);
    setMapError(null);

    let isCancelled = false;

    loadEchoMapStyle(mapStyle)
      .then((style) => {
        if (isCancelled || mapRef.current !== map) {
          return;
        }

        map.setStyle(style);
        map.once('styledata', () => {
          setIsLoaded(true);
          map.resize();
        });
      })
      .catch((error) => {
        if (!isCancelled) {
          console.warn('MapLibre Explore style switch error', error);
          setMapError('Map style could not be loaded. Check your network connection.');
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [mapStyle]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = memories.map((memory) => {
      const element = createMarkerElement(memory);

      element.addEventListener('mouseenter', () => onHoverRef.current(memory.id));
      element.addEventListener('mouseleave', () => onHoverRef.current(null));
      element.addEventListener('click', (event) => {
        event.stopPropagation();
        onSelectRef.current(memory);
      });

      return new maplibregl.Marker({ element, anchor: 'center' })
        .setLngLat([memory.lng, memory.lat])
        .addTo(map);
    });

    if (memories.length > 0) {
      const bounds = memories.reduce(
        (currentBounds, memory) => currentBounds.extend([memory.lng, memory.lat]),
        new maplibregl.LngLatBounds([memories[0].lng, memories[0].lat], [memories[0].lng, memories[0].lat])
      );

      map.fitBounds(bounds as LngLatBoundsLike, {
        padding: { top: 80, right: 80, bottom: 80, left: 80 },
        maxZoom: memories.length === 1 ? 6 : 4,
        duration: 700,
      });
    }
  }, [memories]);

  return (
    <>
      <div
        ref={containerRef}
        className={`echomap-map echomap-map-${mapTone} absolute inset-0 h-full w-full overflow-hidden rounded-2xl`}
      />
      {!isLoaded && !mapError && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="rounded-lg border border-cyan-500/30 bg-black/60 px-4 py-3 text-sm font-semibold text-cyan-300">
            Loading world map...
          </div>
        </div>
      )}
      {mapError && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="max-w-xs rounded-lg border border-pink-500/30 bg-black/70 px-4 py-3 text-center text-sm font-semibold text-pink-300">
            {mapError}
          </div>
        </div>
      )}
    </>
  );
}
