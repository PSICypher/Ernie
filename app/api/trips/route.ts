import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const archived = searchParams.get('archived');

  let query = supabase.from('trips').select('*').order('created_at', { ascending: false });
  if (archived === 'true') query = query.eq('is_archived', true);
  if (archived === 'false') query = query.eq('is_archived', false);

  const { data, error } = await query;
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
  const payload = {
    user_id: user.id,
    name: body.name,
    description: body.description ?? null,
    destination: body.destination ?? null,
    start_date: body.start_date ?? null,
    end_date: body.end_date ?? null,
    cover_image_url: body.cover_image_url ?? null
  };

  if (!payload.name) {
    return NextResponse.json({ error: 'Trip name is required' }, { status: 400 });
  }

  const { data, error } = await supabase.from('trips').insert(payload).select().single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
