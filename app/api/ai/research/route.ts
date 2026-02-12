import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { conductResearch } from '@/lib/openai';
import { getCachedResult, setCachedResult } from '@/lib/ai-cache';
import { parseStructuredSuggestions } from '@/lib/ai-parse';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { query, type, trip_id, location, date_range, budget, preferences } = body;

  if (!query || !trip_id) {
    return NextResponse.json({ error: 'query and trip_id are required' }, { status: 400 });
  }

  const cacheKey = JSON.stringify({ query, type, location, date_range, budget, preferences });
  const cached = await getCachedResult({ tripId: trip_id, query: cacheKey, queryType: 'research' });
  if (cached) {
    return NextResponse.json({ result: cached.results, cached: true });
  }

  const prompt = `Research request:\nType: ${type || 'general'}\nQuery: ${query}\nLocation: ${location || 'n/a'}\nDates: ${date_range?.start || ''} to ${date_range?.end || ''}\nBudget: ${budget?.min || ''}-${budget?.max || ''} ${budget?.currency || ''}\nPreferences: ${(preferences || []).join(', ')}`;

  const text = await conductResearch(prompt);
  const suggestions = parseStructuredSuggestions(text);
  const result = { text, suggestions };

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await setCachedResult({
    tripId: trip_id,
    query: cacheKey,
    queryType: 'research',
    results: result,
    expiresAt
  });

  return NextResponse.json({ result, cached: false });
}
