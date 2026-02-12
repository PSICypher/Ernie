import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { comparePlans } from '@/lib/openai';
import { getCachedResult, setCachedResult } from '@/lib/ai-cache';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const tripId = body.trip_id;
  if (!tripId) {
    return NextResponse.json({ error: 'trip_id is required' }, { status: 400 });
  }

  const { data: plans } = await supabase
    .from('plan_versions')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true });

  if (!plans || plans.length < 2) {
    return NextResponse.json({ error: 'At least two plans are required' }, { status: 400 });
  }

  const cacheKey = JSON.stringify({ tripId, planIds: plans.map((p) => p.id) });
  const cached = await getCachedResult({ tripId, query: cacheKey, queryType: 'compare' });
  if (cached) {
    return NextResponse.json({ result: cached.results, cached: true });
  }

  const planSummaries = [] as string[];

  for (const plan of plans) {
    const [days, accommodations, transport, costs] = await Promise.all([
      supabase.from('itinerary_days').select('location, date').eq('plan_version_id', plan.id),
      supabase.from('accommodations').select('name, cost').eq('plan_version_id', plan.id),
      supabase.from('transport').select('type, cost').eq('plan_version_id', plan.id),
      supabase.from('costs').select('amount, category').eq('plan_version_id', plan.id)
    ]);

    const totalCost = (costs.data || []).reduce((sum, c: any) => sum + (c.amount || 0), 0);

    planSummaries.push(
      `Plan: ${plan.name}\nLocations: ${(days.data || []).map((d: any) => d.location).join(', ')}\n` +
        `Accommodations: ${(accommodations.data || []).map((a: any) => `${a.name} (£${a.cost || 0})`).join('; ')}\n` +
        `Transport: ${(transport.data || []).map((t: any) => `${t.type} (£${t.cost || 0})`).join('; ')}\n` +
        `Total costs: £${totalCost.toFixed(2)}\n`
    );
  }

  const prompt = `Compare these holiday plans:\n\n${planSummaries.join('\n---\n')}`;
  const text = await comparePlans(prompt);

  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  await setCachedResult({ tripId, query: cacheKey, queryType: 'compare', results: text, expiresAt });

  return NextResponse.json({ result: text, cached: false });
}
