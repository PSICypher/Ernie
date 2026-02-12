import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { getItinerarySuggestions } from '@/lib/openai';
import { getCachedResult, setCachedResult } from '@/lib/ai-cache';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const tripId = body.trip_id;
  const planVersionId = body.plan_version_id;
  const requestText = body.request || '';

  if (!tripId || !planVersionId) {
    return NextResponse.json({ error: 'trip_id and plan_version_id are required' }, { status: 400 });
  }

  const cacheKey = JSON.stringify({ tripId, planVersionId, requestText });
  const cached = await getCachedResult({ tripId, query: cacheKey, queryType: 'suggestions' });
  if (cached) {
    return NextResponse.json({ result: cached.results, cached: true });
  }

  const { data: days } = await supabase
    .from('itinerary_days')
    .select('*')
    .eq('plan_version_id', planVersionId)
    .order('day_number', { ascending: true });

  const prompt = `Current itinerary:\n${(days || [])
    .map((d: any) => `Day ${d.day_number}: ${d.location} (${d.date || ''})`)
    .join('\n')}\n\nRequest: ${requestText}`;

  const text = await getItinerarySuggestions(prompt);

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await setCachedResult({ tripId, query: cacheKey, queryType: 'suggestions', results: text, expiresAt });

  return NextResponse.json({ result: text, cached: false });
}
