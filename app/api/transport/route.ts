import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const planVersionId = searchParams.get('plan_version_id');
  if (!planVersionId) {
    return NextResponse.json({ error: 'plan_version_id is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('transport')
    .select('*')
    .eq('plan_version_id', planVersionId);

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
  if (!body.plan_version_id || !body.type) {
    return NextResponse.json({ error: 'plan_version_id and type are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('transport')
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
