import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  const { data: plan, error: planError } = await supabase
    .from('plan_versions')
    .select('*')
    .eq('id', params.id)
    .single();

  if (planError || !plan) {
    return NextResponse.json({ error: planError?.message || 'Plan not found' }, { status: 404 });
  }

  const newPlanName = body.name || `${plan.name} (Copy)`;

  const { data: newPlan, error: newPlanError } = await supabase
    .from('plan_versions')
    .insert({
      trip_id: plan.trip_id,
      name: newPlanName,
      description: plan.description,
      is_active: false,
      currency: plan.currency,
      color: plan.color
    })
    .select()
    .single();

  if (newPlanError || !newPlan) {
    return NextResponse.json({ error: newPlanError?.message || 'Failed to create plan' }, { status: 500 });
  }

  const { data: days } = await supabase
    .from('itinerary_days')
    .select('*')
    .eq('plan_version_id', plan.id)
    .order('day_number', { ascending: true });

  const dayMap = new Map<string, string>();
  if (days && days.length > 0) {
    const { data: newDays, error: dayError } = await supabase
      .from('itinerary_days')
      .insert(
        days.map((day) => ({
          plan_version_id: newPlan.id,
          day_number: day.day_number,
          date: day.date,
          location: day.location,
          location_coordinates: day.location_coordinates,
          icon: day.icon,
          color: day.color,
          activities: day.activities,
          notes: day.notes,
          drive_time: day.drive_time,
          drive_distance: day.drive_distance
        }))
      )
      .select();

    if (dayError) {
      return NextResponse.json({ error: dayError.message }, { status: 500 });
    }

    newDays?.forEach((newDay, index) => {
      const oldDay = days[index];
      if (oldDay) dayMap.set(oldDay.id, newDay.id);
    });
  }

  const cloneSimple = async (table: string, rows: any[], mapFn: (row: any) => any) => {
    if (!rows || rows.length === 0) return;
    const { error } = await supabase.from(table).insert(rows.map(mapFn));
    if (error) throw new Error(error.message);
  };

  try {
    const { data: accommodations } = await supabase
      .from('accommodations')
      .select('*')
      .eq('plan_version_id', plan.id);

    await cloneSimple('accommodations', accommodations || [], (row) => {
      const { id, created_at, updated_at, nights, ...rest } = row;
      return { ...rest, plan_version_id: newPlan.id };
    });

    const { data: transport } = await supabase
      .from('transport')
      .select('*')
      .eq('plan_version_id', plan.id);

    await cloneSimple('transport', transport || [], (row) => {
      const { id, created_at, updated_at, ...rest } = row;
      return { ...rest, plan_version_id: newPlan.id };
    });

    const { data: costs } = await supabase
      .from('costs')
      .select('*')
      .eq('plan_version_id', plan.id);

    await cloneSimple('costs', costs || [], (row) => {
      const { id, created_at, ...rest } = row;
      return {
        ...rest,
        plan_version_id: newPlan.id,
        itinerary_day_id: row.itinerary_day_id ? dayMap.get(row.itinerary_day_id) : null
      };
    });

    const { data: activities } = await supabase
      .from('activities')
      .select('*')
      .eq('plan_version_id', plan.id);

    await cloneSimple('activities', activities || [], (row) => {
      const { id, created_at, updated_at, ...rest } = row;
      return {
        ...rest,
        plan_version_id: newPlan.id,
        itinerary_day_id: row.itinerary_day_id ? dayMap.get(row.itinerary_day_id) : null
      };
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to clone plan' },
      { status: 500 }
    );
  }

  return NextResponse.json(newPlan, { status: 201 });
}
