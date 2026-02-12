import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { generateTripPlan } from '@/lib/openai';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { destination, startDate, endDate, travellerCount, preferences } = body;

  if (!destination || !startDate || !endDate) {
    return NextResponse.json({ error: 'destination, startDate, endDate are required' }, { status: 400 });
  }

  const prompt = `Generate a trip plan:\nDestination: ${destination}\nDates: ${startDate} to ${endDate}\nTravellers: ${travellerCount || 'n/a'}\nPreferences: ${preferences || ''}`;

  const text = await generateTripPlan(prompt);

  let parsed: any = text;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { raw: text };
  }

  return NextResponse.json(parsed);
}
