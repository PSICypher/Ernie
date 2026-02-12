import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';

const cache = new Map<string, { expires: number; data: any }>();

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from') || 'GBP';
  const to = searchParams.get('to') || 'USD';

  const key = `${from}:${to}`;
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(cached.data);
  }

  const url = `https://api.frankfurter.app/latest?from=${from}&to=${to}`;
  const response = await fetch(url);
  const data = await response.json();

  const rate = data.rates?.[to];
  const result = { from, to, rate, date: data.date };

  cache.set(key, { expires: Date.now() + 24 * 60 * 60 * 1000, data: result });
  return NextResponse.json(result);
}
