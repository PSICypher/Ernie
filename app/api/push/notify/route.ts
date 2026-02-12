import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { sendPushNotification } from '@/lib/push-utils';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { title, message, excludeUserId } = body;

  if (!title || !message) {
    return NextResponse.json({ error: 'title and message are required' }, { status: 400 });
  }

  const sent = await sendPushNotification({ title, message, excludeUserId });
  return NextResponse.json({ sent });
}
