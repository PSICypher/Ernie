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
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
  }

  const key = `${lat},${lng}`;
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(cached.data);
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=auto`;
  const response = await fetch(url);
  const data = await response.json();

  const forecast = (data.daily?.time || []).map((date: string, index: number) => ({
    date,
    tempMax: data.daily.temperature_2m_max?.[index],
    tempMin: data.daily.temperature_2m_min?.[index],
    precipChance: data.daily.precipitation_probability_max?.[index],
    weatherCode: data.daily.weathercode?.[index]
  }));

  const result = { forecast };
  cache.set(key, { expires: Date.now() + 60 * 60 * 1000, data: result });

  return NextResponse.json(result);
}
