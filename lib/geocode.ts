import type { LatLng } from '@/lib/geo';

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function knownCoordsForLocation(location: string): LatLng | null {
  const n = norm(location);
  if (!n) return null;

  // Cruise stops in the Florida seed that are missing `location_coordinates`.
  if (n.includes('cococay') || n.includes('coco cay')) return { lat: 25.817425, lng: -77.9385247 };
  if (n.includes('falmouth') && n.includes('jamaica')) return { lat: 18.4929078, lng: -77.6574376 };
  if (n.includes('nassau') && n.includes('bahamas')) return { lat: 25.0782266, lng: -77.3383438 };

  return null;
}

export async function geocodeWithNominatim(query: string): Promise<LatLng | null> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('q', query);

  const res = await fetch(url.toString(), {
    headers: {
      // Nominatim usage policy requests a valid UA.
      'User-Agent': 'holiday-app-ernie/1.0'
    },
    // Avoid caching: we want a fresh lookup when used.
    cache: 'no-store'
  });

  if (!res.ok) return null;
  const data = (await res.json().catch(() => null)) as any;
  if (!Array.isArray(data) || data.length === 0) return null;

  const lat = Number(data[0]?.lat);
  const lon = Number(data[0]?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  return { lat, lng: lon };
}

