import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { planChangeResearch } from '@/lib/openai';
import { getCachedResult, setCachedResult } from '@/lib/ai-cache';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { trip_id, plan_version_id, item_type, current_item, change_request, destination } = body;

  if (!trip_id || !plan_version_id || !item_type || !current_item || !change_request) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const cacheKey = JSON.stringify({ trip_id, plan_version_id, item_type, change_request });
  const cached = await getCachedResult({ tripId: trip_id, query: cacheKey, queryType: 'plan-change' });
  if (cached) {
    return NextResponse.json({ result: cached.results, cached: true });
  }

  const prompt = `Change request: ${change_request}\nDestination: ${destination || ''}\nItem type: ${item_type}\nCurrent item: ${JSON.stringify(current_item, null, 2)}`;

  const text = await planChangeResearch(prompt);
  let parsed: any = text;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { text, options: [] };
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await setCachedResult({ tripId: trip_id, query: cacheKey, queryType: 'plan-change', results: parsed, expiresAt });

  return NextResponse.json({ result: parsed, cached: false });
}
