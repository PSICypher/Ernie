import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { TripSharePanel } from '@/components/trip/TripSharePanel';

export const dynamic = 'force-dynamic';

export default async function TripSharePage({ params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: trip } = await supabase
    .from('trips')
    .select('id,name')
    .eq('id', params.id)
    .maybeSingle();

  if (!trip) {
    redirect('/');
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div className="min-w-0">
            <Link href={`/trips/${trip.id}`} className="text-sm text-purple-600 hover:underline">
              ← Back to trip
            </Link>
            <h1 className="mt-2 text-2xl font-semibold text-gray-900 truncate">Share: {trip.name}</h1>
            <p className="mt-1 text-sm text-gray-600">Invite family members to view or edit this trip.</p>
          </div>
        </header>

        <TripSharePanel tripId={trip.id} />
      </div>
    </main>
  );
}

