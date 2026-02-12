import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { formatDate } from '@/lib/format';

export default async function DashboardPage() {
  const supabase = createRouteHandlerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: trips } = await supabase.from('trips').select('*').order('created_at', {
    ascending: false
  });

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-semibold">Your Trips</h1>
            <p className="text-gray-600 mt-2">Manage and compare your family plans.</p>
          </div>
          <Link
            href="/trips/new"
            className="inline-flex items-center rounded-lg bg-brand-purple px-4 py-2 text-white"
          >
            New Trip
          </Link>
        </header>

        {trips && trips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trips.map((trip) => (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-soft hover:border-purple-300"
              >
                <h2 className="text-xl font-semibold text-gray-900">{trip.name}</h2>
                <p className="text-sm text-gray-600 mt-1">{trip.destination || 'Destination TBD'}</p>
                <p className="text-xs text-gray-500 mt-3">
                  {formatDate(trip.start_date)} {trip.end_date ? `– ${formatDate(trip.end_date)}` : ''}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <section className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center shadow-soft">
            <h2 className="text-lg font-medium">No trips yet</h2>
            <p className="text-sm text-gray-600 mt-2">Start by creating your first trip.</p>
            <Link
              href="/trips/new"
              className="inline-flex items-center rounded-lg bg-brand-purple px-4 py-2 text-white mt-4"
            >
              Create a trip
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
