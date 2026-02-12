import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';

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
  const allowed = ['name', 'description', 'is_active', 'currency', 'color'];
  const updates = Object.fromEntries(
    Object.entries(body).filter(([key]) => allowed.includes(key))
  );

  const { data, error } = await supabase
    .from('plan_versions')
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

  const { data: plan, error: planError } = await supabase
    .from('plan_versions')
    .select('trip_id')
    .eq('id', params.id)
    .single();

  if (planError || !plan) {
    return NextResponse.json({ error: planError?.message || 'Plan not found' }, { status: 404 });
  }

  const { count, error: countError } = await supabase
    .from('plan_versions')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', plan.trip_id);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  if ((count ?? 0) <= 1) {
    return NextResponse.json({ error: 'Cannot delete the last plan version' }, { status: 400 });
  }

  const { error } = await supabase.from('plan_versions').delete().eq('id', params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
