import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: trip, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  const { count: planCount } = await supabase
    .from('plan_versions')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', params.id);

  const { count: decisionCount } = await supabase
    .from('decisions')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', params.id)
    .eq('status', 'pending');

  return NextResponse.json({
    ...trip,
    plan_versions_count: planCount ?? 0,
    pending_decisions_count: decisionCount ?? 0
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const allowed = ['name', 'description', 'destination', 'start_date', 'end_date', 'cover_image_url', 'is_archived'];
  const updates = Object.fromEntries(
    Object.entries(body).filter(([key]) => allowed.includes(key))
  );

  const { data, error } = await supabase
    .from('trips')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase.from('trips').delete().eq('id', params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
