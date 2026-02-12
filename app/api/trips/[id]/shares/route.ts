import { NextResponse } from 'next/server';
import { createRouteHandlerClient, createAdminSupabaseClient } from '@/lib/supabase-server';

const ALLOWED_EMAILS = ['schalk.vdmerwe@gmail.com', 'vdmkelz@gmail.com'];

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('trip_shares')
    .select('*')
    .eq('trip_id', params.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient();
  const admin = createAdminSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const email = body.email?.toLowerCase?.();
  const permission = body.permission || 'view';

  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 });
  }

  if (email === user.email?.toLowerCase()) {
    return NextResponse.json({ error: 'Cannot share with yourself' }, { status: 400 });
  }

  if (!ALLOWED_EMAILS.includes(email)) {
    return NextResponse.json({ error: 'Can only share with approved users' }, { status: 403 });
  }

  const { data: existing } = await supabase
    .from('trip_shares')
    .select('id')
    .eq('trip_id', params.id)
    .eq('shared_with_email', email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'Share already exists' }, { status: 409 });
  }

  // Link the invite to a concrete user_id when possible so RLS can resolve shares.
  let sharedWithUserId: string | null = null;
  try {
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (!error && data?.users) {
      const match = data.users.find((u) => (u.email || '').toLowerCase() === email);
      sharedWithUserId = match?.id || null;
    }
  } catch {
    // ignore
  }

  const { data, error } = await supabase
    .from('trip_shares')
    .insert({
      trip_id: params.id,
      shared_with_email: email,
      shared_with_user_id: sharedWithUserId,
      permission
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
