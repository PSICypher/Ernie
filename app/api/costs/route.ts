import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const planVersionId = searchParams.get('plan_version_id');
  const dayId = searchParams.get('itinerary_day_id');

  if (!planVersionId && !dayId) {
    return NextResponse.json(
      { error: 'plan_version_id or itinerary_day_id is required' },
      { status: 400 }
    );
  }

  let query = supabase.from('costs').select('*');
  if (planVersionId) query = query.eq('plan_version_id', planVersionId);
  if (dayId) query = query.eq('itinerary_day_id', dayId);

  const { data, error } = await query.order('created_at', { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const payload = Array.isArray(body) ? body : [body];

  if (payload.some((item) => !item.plan_version_id || !item.item || item.amount === undefined)) {
    return NextResponse.json(
      { error: 'plan_version_id, item, and amount are required' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase.from('costs').insert(payload).select();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

