import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { sendPushNotification } from '@/lib/push-utils';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const title = body.title || 'Ernie';
  const message = body.message || 'Test notification';

  const sent = await sendPushNotification({ title, message, includeUserId: user.id });
  return NextResponse.json({ sent });
}

