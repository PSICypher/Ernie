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
  activities: string[];
  drive_time?: string | null;
  lat: number;
  lng: number;
};

function coerceActivities(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .map((a: any) => (a && typeof a === 'object' ? a.name : null))
      .filter((x: any) => typeof x === 'string' && x.trim().length > 0)
      .map((x: string) => x.trim());
  }
  if (typeof raw === 'string') {
    try {
      return coerceActivities(JSON.parse(raw));
    } catch {
      return [];
    }
  }
  if (raw && typeof raw === 'object' && Array.isArray((raw as any).activities)) {
    return coerceActivities((raw as any).activities);
  }
  return [];
}

export function RouteMap({
  days,
  height = 360,
  showMissingDays = false
}: {
  days: ItineraryDay[];
  height?: number | string;
  showMissingDays?: boolean;
}) {
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
        activities: coerceActivities((d as any).activities),
        drive_time: (d as any).drive_time ?? null,
        lat: ll.lat,
        lng: ll.lng
      });
    }
    return out;
  }, [days]);

  const missing = useMemo(() => {
    const sorted = [...(days || [])].sort((a, b) => (a.day_number || 0) - (b.day_number || 0));
    return sorted
      .filter((d) => !parseLatLng((d as any).location_coordinates))
      .map((d) => ({
        id: d.id,
        day_number: d.day_number,
        date: d.date,
        location: d.location
      }));
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
        const activities = (p.activities || []).slice(0, 6);
        const extra = (p.activities || []).length - activities.length;
        const actsHtml =
          activities.length > 0
            ? `<div style="margin-top:6px"><div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#6b7280">Activities</div>${activities
                .map((a) => `<div style="margin-top:2px">${escapeHtml(a)}</div>`)
                .join('')}${extra > 0 ? `<div style="margin-top:2px;color:#6b7280">+${extra} more</div>` : ''}</div>`
            : '';
        const driveHtml = p.drive_time
          ? `<div style="margin-top:6px;color:#6b7280">Travel: ${escapeHtml(p.drive_time)}</div>`
          : '';
        marker.bindPopup(
          `<b>Day ${p.day_number}</b><br/>${escapeHtml(p.location)}<br/>${escapeHtml(when)}${driveHtml}${actsHtml}`
        );
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
          style={{ height }}
        />
      )}

      {points.length === 0 && !leafletError && (
        <p className="mt-3 text-sm text-gray-500">
          No coordinates found for this plan yet. Add coordinates to itinerary days to enable the map.
        </p>
      )}

      {showMissingDays && missing.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">Missing map coordinates</p>
          <p className="mt-1 text-sm text-amber-800">
            These days will not render on the map until we add `location_coordinates`.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            {missing.map((d) => (
              <div key={d.id} className="rounded-lg border border-amber-100 bg-white px-3 py-2">
                <p className="text-sm font-medium text-gray-900">
                  Day {d.day_number}: {d.location}
                </p>
                <p className="text-xs text-gray-600">{d.date ? formatDate(d.date) : 'Date TBD'}</p>
              </div>
            ))}
          </div>
        </div>
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
