import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { plan_version_id, trip_id, suggestion_type, data } = body;

  if (!plan_version_id || !trip_id || !suggestion_type || !data) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  switch (suggestion_type) {
    case 'accommodation': {
      const { error } = await supabase.from('accommodations').insert({
        plan_version_id,
        name: data.name,
        location: data.location || null,
        cost: data.cost || null,
        currency: data.currency || 'GBP',
        notes: data.description || null
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      break;
    }
    case 'activity': {
      if (!data.itinerary_day_id) {
        return NextResponse.json({ error: 'itinerary_day_id is required for activities' }, { status: 400 });
      }
      const { error } = await supabase.from('activities').insert({
        plan_version_id,
        itinerary_day_id: data.itinerary_day_id,
        name: data.name,
        location: data.location || null,
        cost: data.cost || null,
        notes: data.description || null
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      break;
    }
    case 'cost': {
      const { error } = await supabase.from('costs').insert({
        plan_version_id,
        category: data.category || 'misc',
        item: data.name,
        amount: data.cost || 0,
        currency: data.currency || 'GBP',
        notes: data.description || null
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      break;
    }
    case 'decision': {
      const { error } = await supabase.from('decisions').insert({
        trip_id,
        plan_version_id,
        title: data.name,
        description: data.description || null,
        options: data.options || []
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      break;
    }
    default:
      return NextResponse.json({ error: 'Unsupported suggestion_type' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
