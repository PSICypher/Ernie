import { NextResponse } from 'next/server';
import { createRouteHandlerClient, createAdminSupabaseClient } from '@/lib/supabase-server';
import fs from 'fs';
import path from 'path';

const ALLOWED_EMAILS = ['schalk.vdmerwe@gmail.com', 'vdmkelz@gmail.com'];

function newUUID() {
  return crypto.randomUUID();
}

export async function POST() {
  const supabase = createRouteHandlerClient();
  const admin = createAdminSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!ALLOWED_EMAILS.includes(user.email?.toLowerCase() || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const seedPath = path.join(process.cwd(), 'SEED_DATA', 'florida-trip-data.json');
  const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

  const idMap = {
    trip: {} as Record<string, string>,
    planVersion: {} as Record<string, string>,
    itineraryDay: {} as Record<string, string>,
    accommodation: {} as Record<string, string>,
    transport: {} as Record<string, string>,
    cost: {} as Record<string, string>
  };

  const newTripId = newUUID();
  idMap.trip[seedData.trip.id] = newTripId;

  const { error: tripError } = await admin.from('trips').insert({
    id: newTripId,
    user_id: user.id,
    name: seedData.trip.name,
    description: seedData.trip.description,
    destination: seedData.trip.destination,
    start_date: seedData.trip.start_date,
    end_date: seedData.trip.end_date,
    cover_image_url: seedData.trip.cover_image_url,
    is_archived: seedData.trip.is_archived
  });

  if (tripError) {
    return NextResponse.json({ error: tripError.message }, { status: 500 });
  }

  for (const pv of seedData.planVersions) {
    const newPvId = newUUID();
    idMap.planVersion[pv.id] = newPvId;
    const { error } = await admin.from('plan_versions').insert({
      id: newPvId,
      trip_id: newTripId,
      name: pv.name,
      description: pv.description,
      is_active: pv.is_active,
      total_cost: pv.total_cost,
      currency: pv.currency,
      color: pv.color
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  for (const day of seedData.itineraryDays) {
    const newDayId = newUUID();
    idMap.itineraryDay[day.id] = newDayId;
    const { error } = await admin.from('itinerary_days').insert({
      id: newDayId,
      plan_version_id: idMap.planVersion[day.plan_version_id],
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
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  for (const acc of seedData.accommodations) {
    const newAccId = newUUID();
    idMap.accommodation[acc.id] = newAccId;
    const { error } = await admin.from('accommodations').insert({
      id: newAccId,
      plan_version_id: idMap.planVersion[acc.plan_version_id],
      name: acc.name,
      type: acc.type,
      location: acc.location,
      address: acc.address,
      coordinates: acc.coordinates,
      check_in: acc.check_in,
      check_out: acc.check_out,
      cost: acc.cost,
      currency: acc.currency,
      booking_reference: acc.booking_reference,
      booking_url: acc.booking_url,
      cancellation_policy: acc.cancellation_policy,
      amenities: acc.amenities,
      notes: acc.notes,
      color: acc.color,
      is_confirmed: acc.is_confirmed
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  for (const t of seedData.transport) {
    const newTransportId = newUUID();
    idMap.transport[t.id] = newTransportId;
    const { error } = await admin.from('transport').insert({
      id: newTransportId,
      plan_version_id: idMap.planVersion[t.plan_version_id],
      type: t.type,
      provider: t.provider,
      vehicle: t.vehicle,
      reference_number: t.reference_number,
      pickup_location: t.pickup_location,
      pickup_date: t.pickup_date,
      pickup_time: t.pickup_time,
      dropoff_location: t.dropoff_location,
      dropoff_date: t.dropoff_date,
      dropoff_time: t.dropoff_time,
      cost: t.cost,
      currency: t.currency,
      includes: t.includes,
      booking_url: t.booking_url,
      notes: t.notes,
      is_confirmed: t.is_confirmed
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  for (const c of seedData.costs) {
    const newCostId = newUUID();
    idMap.cost[c.id] = newCostId;
    const { error } = await admin.from('costs').insert({
      id: newCostId,
      plan_version_id: idMap.planVersion[c.plan_version_id],
      itinerary_day_id: c.itinerary_day_id ? idMap.itineraryDay[c.itinerary_day_id] : null,
      category: c.category,
      item: c.item,
      amount: c.amount,
      currency: c.currency,
      is_paid: c.is_paid,
      is_estimated: c.is_estimated,
      notes: c.notes
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  for (const item of seedData.checklistItems) {
    let newSourceId = null;
    if (item.source_id) {
      if (item.source_type === 'accommodation') newSourceId = idMap.accommodation[item.source_id];
      if (item.source_type === 'transport') newSourceId = idMap.transport[item.source_id];
      if (item.source_type === 'cost') newSourceId = idMap.cost[item.source_id];
    }

    const { error } = await admin.from('checklist_items').insert({
      id: newUUID(),
      plan_version_id: idMap.planVersion[item.plan_version_id],
      category: item.category,
      name: item.name,
      description: item.description,
      source_type: item.source_type,
      source_id: newSourceId,
      booking_status: item.booking_status,
      booking_reference: item.booking_reference,
      booking_url: item.booking_url,
      total_cost: item.total_cost,
      deposit_amount: item.deposit_amount,
      amount_paid: item.amount_paid,
      is_fully_paid: item.is_fully_paid,
      payment_type: item.payment_type,
      payment_due_date: item.payment_due_date,
      payment_due_context: item.payment_due_context,
      notes: item.notes,
      sort_order: item.sort_order
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ tripId: newTripId, planId: Object.values(idMap.planVersion)[0] });
}
