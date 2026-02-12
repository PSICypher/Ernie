export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { TripDashboard } from '@/components/trip/TripDashboard';

export default async function TripPage({ params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('*')
    .eq('id', params.id)
    .single();

  if (tripError || !trip) {
    redirect('/');
  }

  const { data: plans } = await supabase
    .from('plan_versions')
    .select('*')
    .eq('trip_id', params.id)
    .order('created_at', { ascending: true });

  const activePlan = (plans || []).find((p) => p.is_active) || (plans || [])[0] || null;
  const planId = activePlan?.id;

  const [days, accommodations, transport, costs, decisions, checklist] = await Promise.all([
    planId
      ? supabase
          .from('itinerary_days')
          .select('*')
          .eq('plan_version_id', planId)
          .order('day_number', { ascending: true })
      : Promise.resolve({ data: [] }),
    planId
      ? supabase
          .from('accommodations')
          .select('*')
          .eq('plan_version_id', planId)
          .order('check_in', { ascending: true })
      : Promise.resolve({ data: [] }),
    planId
      ? supabase
          .from('transport')
          .select('*')
          .eq('plan_version_id', planId)
      : Promise.resolve({ data: [] }),
    planId
      ? supabase
          .from('costs')
          .select('*')
          .eq('plan_version_id', planId)
      : Promise.resolve({ data: [] }),
    supabase.from('decisions').select('*').eq('trip_id', params.id),
    planId
      ? supabase
          .from('checklist_items')
          .select('*')
          .eq('plan_version_id', planId)
          .order('sort_order', { ascending: true })
      : Promise.resolve({ data: [] })
  ]);

  return (
    <TripDashboard
      trip={trip as any}
      plans={(plans || []) as any}
      activePlan={activePlan as any}
      days={(days.data || []) as any}
      accommodations={(accommodations.data || []) as any}
      transport={(transport.data || []) as any}
      costs={(costs.data || []) as any}
      decisions={(decisions.data || []) as any}
      checklist={(checklist.data || []) as any}
    />
  );
}
