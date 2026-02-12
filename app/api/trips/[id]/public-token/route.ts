import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';

export async function POST(
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
    .select('public_share_token')
    .eq('id', params.id)
    .single();

  if (error || !trip) {
    return NextResponse.json({ error: error?.message || 'Trip not found' }, { status: 404 });
  }

  if (trip.public_share_token) {
    return NextResponse.json({ token: trip.public_share_token });
  }

  const token = crypto.randomUUID();
  const { error: updateError } = await supabase
    .from('trips')
    .update({ public_share_token: token })
    .eq('id', params.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ token });
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

  const { error } = await supabase
    .from('trips')
    .update({ public_share_token: null })
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
