'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useState } from 'react';
import maplibregl, { type Map, type Marker } from 'maplibre-gl';
import { LocateFixed } from 'lucide-react';
import { echoMapStyles, loadEchoMapStyle, type EchoMapStyleId } from '@/lib/map-style';

interface Coordinates {
  lat: number;
  lng: number;
}

interface LocationPickerMapProps {
  selectedLocation?: Coordinates | null;
  mapStyle: EchoMapStyleId;
  onSelectLocation: (coordinates: Coordinates) => void;
}

function isValidCoordinate(value: unknown): value is Coordinates {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<Coordinates>;
  return (
    typeof candidate.lat === 'number' &&
    Number.isFinite(candidate.lat) &&
    candidate.lat >= -90 &&
    candidate.lat <= 90 &&
    typeof candidate.lng === 'number' &&
    Number.isFinite(candidate.lng) &&
    candidate.lng >= -180 &&
    candidate.lng <= 180
  );
}

function createLocationMarkerElement() {
  const marker = document.createElement('div');
  marker.className = 'echomap-location-marker';

  const pulse = document.createElement('span');
  pulse.className = 'echomap-location-marker-pulse';
  marker.appendChild(pulse);

  const dot = document.createElement('span');
  dot.className = 'echomap-location-marker-dot';
  marker.appendChild(dot);

  return marker;
}

export function LocationPickerMap({ selectedLocation, mapStyle, onSelectLocation }: LocationPickerMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const mapLoadedRef = useRef(false);
  const onSelectRef = useRef(onSelectLocation);
  const initialMapStyleRef = useRef(mapStyle);
  const selectedLocationRef = useRef<Coordinates | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapTone = echoMapStyles[mapStyle].tone;
  const validSelectedLocation = isValidCoordinate(selectedLocation) ? selectedLocation : null;

  useEffect(() => {
    onSelectRef.current = onSelectLocation;
  }, [onSelectLocation]);

  useEffect(() => {
    selectedLocationRef.current = validSelectedLocation;
  }, [validSelectedLocation]);

  const syncSelectedMarker = useCallback((location: unknown) => {
    const map = mapRef.current;

    if (!map || typeof map.getCanvas !== 'function' || !mapLoadedRef.current) {
      if (process.env.NODE_ENV === 'development') {
        console.info('Location marker sync skipped: map is not ready.');
      }
      return;
    }

    if (!isValidCoordinate(location)) {
      markerRef.current?.remove();
      markerRef.current = null;
      if (process.env.NODE_ENV === 'development') {
        console.info('Location marker sync skipped: invalid coordinates.', location);
      }
      return;
    }

    try {
      const lngLat: [number, number] = [location.lng, location.lat];

      if (markerRef.current) {
        markerRef.current.setLngLat(lngLat);
      } else {
        markerRef.current = new maplibregl.Marker({
          element: createLocationMarkerElement(),
          anchor: 'center',
        })
          .setLngLat(lngLat)
          .addTo(map);
      }

      map.easeTo({
        center: lngLat,
        zoom: Math.max(map.getZoom(), 8),
        duration: 500,
      });
    } catch (error) {
      console.warn('Unable to place selected location marker', error);
      setMapError('Selected location could not be shown on the map. Please try another place.');
    }
  }, []);

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
          center: validSelectedLocation ? [validSelectedLocation.lng, validSelectedLocation.lat] : [3.3792, 6.5244],
          zoom: validSelectedLocation ? 10 : 3,
          minZoom: 1,
          maxZoom: 16,
          attributionControl: false,
        });

        map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), 'top-right');
        map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
        map.on('load', () => {
          mapLoadedRef.current = true;
          setIsLoaded(true);
          setMapError(null);
          map.resize();
          syncSelectedMarker(selectedLocationRef.current);
        });
        map.on('error', (event) => {
          const message = event.error?.message ?? '';
          console.warn('MapLibre upload picker error', event.error);
          if (!/glyph|font/i.test(message)) {
            setMapError('Map tiles could not be loaded. Check your network connection.');
          }
        });
        map.on('click', (event) => {
          const coordinates = {
            lat: Number(event.lngLat.lat.toFixed(6)),
            lng: Number(event.lngLat.lng.toFixed(6)),
          };

          if (isValidCoordinate(coordinates)) {
            onSelectRef.current(coordinates);
          }
        });

        mapRef.current = map;
        window.setTimeout(() => map.resize(), 0);
      } catch (error) {
        if (!isCancelled) {
          console.warn('MapLibre upload picker style error', error);
          setMapError('Map style could not be loaded. Check your network connection.');
        }
      }
    }

    initializeMap();

    return () => {
      isCancelled = true;
      mapLoadedRef.current = false;
      markerRef.current?.remove();
      markerRef.current = null;
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
    mapLoadedRef.current = false;
    setMapError(null);

    let isCancelled = false;

    loadEchoMapStyle(mapStyle)
      .then((style) => {
        if (isCancelled || mapRef.current !== map) {
          return;
        }

        map.setStyle(style);
        map.once('styledata', () => {
          mapLoadedRef.current = true;
          setIsLoaded(true);
          map.resize();
          syncSelectedMarker(selectedLocationRef.current);
        });
      })
      .catch((error) => {
        if (!isCancelled) {
          console.warn('MapLibre upload picker style switch error', error);
          setMapError('Map style could not be loaded. Check your network connection.');
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [mapStyle, syncSelectedMarker]);

  useEffect(() => {
    syncSelectedMarker(validSelectedLocation);
  }, [syncSelectedMarker, validSelectedLocation]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
      const coordinates = {
        lat: Number(position.coords.latitude.toFixed(6)),
        lng: Number(position.coords.longitude.toFixed(6)),
      };

      if (isValidCoordinate(coordinates)) {
        onSelectLocation(coordinates);
      }
    });
  };

  return (
    <div className="relative h-80 w-full overflow-hidden rounded-lg border border-cyan-500/30 bg-black/30 sm:h-72">
      <div ref={containerRef} className={`echomap-map echomap-map-${mapTone} absolute inset-0 h-full w-full`} />
      <button
        type="button"
        onClick={useCurrentLocation}
        className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-black/60 px-3 py-2 text-xs font-semibold text-cyan-300 backdrop-blur-md transition hover:bg-cyan-500/10"
      >
        <LocateFixed className="h-4 w-4" />
        Current location
      </button>
      <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-10 rounded-lg border border-cyan-500/20 bg-black/60 px-3 py-2 text-xs text-gray-300 backdrop-blur-md">
        {validSelectedLocation
          ? `${validSelectedLocation.lat.toFixed(5)}, ${validSelectedLocation.lng.toFixed(5)}`
          : 'Click the map to pin the exact memory location'}
      </div>
      {!isLoaded && !mapError && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="rounded-lg border border-cyan-500/30 bg-black/60 px-4 py-3 text-sm font-semibold text-cyan-300">
            Loading location map...
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
    </div>
  );
}
