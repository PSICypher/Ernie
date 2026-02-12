import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { getCostOptimisationTips } from '@/lib/openai';
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

  if (!tripId || !planVersionId) {
    return NextResponse.json({ error: 'trip_id and plan_version_id are required' }, { status: 400 });
  }

  const cacheKey = JSON.stringify({ tripId, planVersionId });
  const cached = await getCachedResult({ tripId, query: cacheKey, queryType: 'optimise' });
  if (cached) {
    return NextResponse.json({ result: cached.results, cached: true });
  }

  const { data: costs } = await supabase
    .from('costs')
    .select('*')
    .eq('plan_version_id', planVersionId);

  const total = (costs || []).reduce((sum, c: any) => sum + (c.amount || 0), 0);
  const byCategory = (costs || []).reduce((acc: Record<string, number>, c: any) => {
    acc[c.category] = (acc[c.category] || 0) + (c.amount || 0);
    return acc;
  }, {});

  const prompt = `Cost breakdown (total £${total.toFixed(2)}):\n${Object.entries(byCategory)
    .map(([cat, value]) => `${cat}: £${(value as number).toFixed(2)}`)
    .join('\n')}`;

  const text = await getCostOptimisationTips(prompt);

  const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
  await setCachedResult({ tripId, query: cacheKey, queryType: 'optimise', results: text, expiresAt });

  return NextResponse.json({ result: text, cached: false });
}
