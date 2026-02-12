import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';

export async function GET(
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
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !trip) {
    return NextResponse.json({ error: error?.message || 'Trip not found' }, { status: 404 });
  }

  const { data: plans } = await supabase
    .from('plan_versions')
    .select('*')
    .eq('trip_id', params.id)
    .order('created_at', { ascending: true });

  const activePlan = (plans || []).find((p) => p.is_active) || (plans || [])[0];

  const { data: days } = activePlan
    ? await supabase
        .from('itinerary_days')
        .select('*')
        .eq('plan_version_id', activePlan.id)
        .order('day_number', { ascending: true })
    : { data: [] as any[] };

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${trip.name} - Export</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 32px; color: #111; }
    h1 { margin-bottom: 4px; }
    .muted { color: #666; }
    .day { border-bottom: 1px solid #eee; padding: 12px 0; }
  </style>
</head>
<body>
  <h1>${trip.name}</h1>
  <p class="muted">${trip.destination || ''} ${trip.start_date || ''} ${trip.end_date ? `- ${trip.end_date}` : ''}</p>
  <h2>Active Plan: ${activePlan?.name || 'Plan'}</h2>
  <section>
    ${(days || [])
      .map(
        (day: any) => `
          <div class="day">
            <strong>Day ${day.day_number}:</strong> ${day.location}<br />
            <span class="muted">${day.date || ''} ${day.drive_time ? `· Drive ${day.drive_time}` : ''}</span>
          </div>
        `
      )
      .join('')}
  </section>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }
  });
}
