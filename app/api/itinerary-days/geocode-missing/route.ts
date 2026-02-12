import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { parseLatLng } from '@/lib/geo';
import { geocodeWithNominatim, knownCoordsForLocation } from '@/lib/geocode';

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isSeaDay(location: string) {
  return /sea\s*day/i.test(location || '');
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const planVersionId = body.plan_version_id as string | undefined;

  if (!planVersionId) {
    return NextResponse.json({ error: 'plan_version_id is required' }, { status: 400 });
  }

  // RLS gate: user must be able to see this plan_version.
  const { data: plan, error: planError } = await supabase
    .from('plan_versions')
    .select('id')
    .eq('id', planVersionId)
    .maybeSingle();

  if (planError) {
    return NextResponse.json({ error: planError.message }, { status: 500 });
  }
  if (!plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  }

  const { data: days, error: daysError } = await supabase
    .from('itinerary_days')
    .select('id, day_number, location, location_coordinates')
    .eq('plan_version_id', planVersionId)
    .order('day_number', { ascending: true });

  if (daysError) {
    return NextResponse.json({ error: daysError.message }, { status: 500 });
  }

  const sorted = days || [];
  const missing = sorted.filter((d) => !parseLatLng((d as any).location_coordinates));
  if (missing.length === 0) {
    return NextResponse.json({ updated: 0, message: 'No missing coordinates' });
  }

  // Limit work per call to keep serverless latency reasonable.
  const MAX = 10;
  const queue = missing.slice(0, MAX);

  const updated: Array<{ id: string; location: string; lat: number; lng: number }> = [];
  const skipped: Array<{ id: string; location: string; reason: string }> = [];

  // First pass: geocode non-sea days.
  for (const d of queue) {
    const loc = String((d as any).location || '').trim();
    if (!loc) {
      skipped.push({ id: d.id, location: '', reason: 'Missing location' });
      continue;
    }

    if (isSeaDay(loc)) {
      // Defer to midpoint interpolation once neighbors are known.
      skipped.push({ id: d.id, location: loc, reason: 'Sea day (interpolate later)' });
      continue;
    }

    const known = knownCoordsForLocation(loc);
    let coords = known;

    if (!coords) {
      coords = await geocodeWithNominatim(loc);
      // Be polite to Nominatim (and avoid being rate limited).
      await sleep(1100);
    }

    if (!coords) {
      skipped.push({ id: d.id, location: loc, reason: 'Geocode failed' });
      continue;
    }

    const { error: updErr } = await supabase
      .from('itinerary_days')
      .update({ location_coordinates: coords as any })
      .eq('id', d.id);

    if (updErr) {
      skipped.push({ id: d.id, location: loc, reason: updErr.message });
      continue;
    }

    updated.push({ id: d.id, location: loc, lat: coords.lat, lng: coords.lng });
  }

  // Second pass: interpolate sea days between known neighbors.
  // We recompute using the latest known coordinates from the in-memory updates.
  const coordsById = new Map<string, { lat: number; lng: number }>();
  for (const d of sorted) {
    const ll = parseLatLng((d as any).location_coordinates);
    if (ll) coordsById.set(d.id, ll);
  }
  for (const u of updated) {
    coordsById.set(u.id, { lat: u.lat, lng: u.lng });
  }

  for (let i = 0; i < sorted.length; i++) {
    const d = sorted[i] as any;
    const loc = String(d.location || '').trim();
    if (!isSeaDay(loc)) continue;
    if (parseLatLng(d.location_coordinates)) continue;

    // Only interpolate if this sea day is part of the original missing queue.
    if (!queue.some((q) => q.id === d.id)) continue;

    let prev: { lat: number; lng: number } | null = null;
    for (let j = i - 1; j >= 0; j--) {
      const cand = coordsById.get((sorted[j] as any).id);
      if (cand) {
        prev = cand;
        break;
      }
    }
    let next: { lat: number; lng: number } | null = null;
    for (let j = i + 1; j < sorted.length; j++) {
      const cand = coordsById.get((sorted[j] as any).id);
      if (cand) {
        next = cand;
        break;
      }
    }

    if (!prev || !next) {
      skipped.push({ id: d.id, location: loc, reason: 'Cannot interpolate (missing neighbors)' });
      continue;
    }

    const mid = { lat: (prev.lat + next.lat) / 2, lng: (prev.lng + next.lng) / 2 };
    const { error: updErr } = await supabase
      .from('itinerary_days')
      .update({ location_coordinates: mid as any })
      .eq('id', d.id);

    if (updErr) {
      skipped.push({ id: d.id, location: loc, reason: updErr.message });
      continue;
    }

    updated.push({ id: d.id, location: loc, lat: mid.lat, lng: mid.lng });
    coordsById.set(d.id, mid);
  }

  return NextResponse.json({
    updatedCount: updated.length,
    updated,
    skippedCount: skipped.length,
    skipped
  });
}

