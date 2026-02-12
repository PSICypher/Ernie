'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ItineraryDay } from '@/lib/types';
import { parseLatLng } from '@/lib/geo';
import { formatDate } from '@/lib/format';

type RoutePoint = {
  id: string;
  day_number: number;
  date?: string | null;
  location: string;
  lat: number;
  lng: number;
};

export function RouteMap({ days }: { days: ItineraryDay[] }) {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const [leafletError, setLeafletError] = useState<string | null>(null);

  const points = useMemo<RoutePoint[]>(() => {
    const sorted = [...(days || [])].sort((a, b) => (a.day_number || 0) - (b.day_number || 0));
    const out: RoutePoint[] = [];
    for (const d of sorted) {
      const ll = parseLatLng((d as any).location_coordinates);
      if (!ll) continue;
      out.push({
        id: d.id,
        day_number: d.day_number,
        date: d.date,
        location: d.location,
        lat: ll.lat,
        lng: ll.lng
      });
    }
    return out;
  }, [days]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await import('leaflet'); // verify module can be resolved
        if (cancelled) return;
        setLeafletReady(true);
      } catch (e) {
        if (cancelled) return;
        setLeafletError(e instanceof Error ? e.message : 'Leaflet failed to load');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!leafletReady) return;
    if (!mapEl.current) return;

    let disposed = false;

    (async () => {
      const mod: any = await import('leaflet');
      const L: any = mod?.default || mod;
      if (disposed) return;

      // Init map once.
      if (!mapRef.current) {
        const map = L.map(mapEl.current, {
          zoomControl: true,
          attributionControl: true,
          scrollWheelZoom: false,
          dragging: true,
          tap: true
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        mapRef.current = map;
      }

      const map = mapRef.current;

      // Clear previous layers.
      if (layerRef.current) {
        try {
          layerRef.current.remove();
        } catch {
          // ignore
        }
        layerRef.current = null;
      }

      const group = L.layerGroup();
      layerRef.current = group;
      group.addTo(map);

      if (points.length === 0) {
        map.setView([27.6648, -81.5158], 6); // Florida-ish default
        return;
      }

      const latlngs = points.map((p) => [p.lat, p.lng]);
      const bounds = L.latLngBounds(latlngs as any);

      // Polyline route.
      if (points.length >= 2) {
        L.polyline(latlngs as any, {
          color: '#7c3aed',
          weight: 4,
          opacity: 0.9
        }).addTo(group);
      }

      // Markers.
      points.forEach((p, idx) => {
        const isStart = idx === 0;
        const isEnd = idx === points.length - 1;
        const cls = `route-marker${isStart ? ' is-start' : ''}${isEnd ? ' is-end' : ''}`;
        const icon = L.divIcon({
          className: '',
          html: `<span class="${cls}">${p.day_number}</span>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const marker = L.marker([p.lat, p.lng], { icon }).addTo(group);
        const when = p.date ? formatDate(p.date) : 'Date TBD';
        marker.bindPopup(`<b>Day ${p.day_number}</b><br/>${escapeHtml(p.location)}<br/>${escapeHtml(when)}`);
      });

      map.fitBounds(bounds.pad(0.2));
    })();

    return () => {
      disposed = true;
    };
  }, [leafletReady, points]);

  useEffect(() => {
    return () => {
      try {
        layerRef.current?.remove();
      } catch {
        // ignore
      }
      try {
        mapRef.current?.remove();
      } catch {
        // ignore
      }
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  const summary = `${points.length}/${days.length} days have coordinates`;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-soft">
      <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Route Map</h2>
          <p className="text-sm text-gray-600">Where you are each day, in order.</p>
        </div>
        <p className="text-xs text-gray-500">{summary}</p>
      </div>

      {leafletError ? (
        <p className="mt-4 text-sm text-red-600">Map failed to load: {leafletError}</p>
      ) : (
        <div
          ref={mapEl}
          className="mt-4 w-full rounded-xl border border-gray-100 overflow-hidden"
          style={{ height: 360 }}
        />
      )}

      {points.length === 0 && !leafletError && (
        <p className="mt-3 text-sm text-gray-500">
          No coordinates found for this plan yet. Add coordinates to itinerary days to enable the map.
        </p>
      )}
    </section>
  );
}

function escapeHtml(input: string) {
  return String(input)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
