import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tripId = searchParams.get('trip_id');
  if (!tripId) {
    return NextResponse.json({ error: 'trip_id is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('plan_versions')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  if (!body.trip_id || !body.name) {
    return NextResponse.json({ error: 'trip_id and name are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('plan_versions')
    .insert({
      trip_id: body.trip_id,
      name: body.name,
      description: body.description ?? null,
      is_active: body.is_active ?? false,
      currency: body.currency ?? 'GBP',
      color: body.color ?? '#8B5CF6'
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
