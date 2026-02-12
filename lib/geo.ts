export type LatLng = { lat: number; lng: number };

export function parseLatLng(input: unknown): LatLng | null {
  if (!input) return null;

  if (typeof input === 'string') {
    try {
      return parseLatLng(JSON.parse(input));
    } catch {
      return null;
    }
  }

  if (typeof input !== 'object') return null;
  const anyObj = input as any;

  const lat = anyObj.lat;
  const lng = anyObj.lng;
  if (typeof lat === 'number' && Number.isFinite(lat) && typeof lng === 'number' && Number.isFinite(lng)) {
    return { lat, lng };
  }

  // Allow { coordinates: { lat, lng } } shapes.
  if (anyObj.coordinates) return parseLatLng(anyObj.coordinates);

  return null;
}

