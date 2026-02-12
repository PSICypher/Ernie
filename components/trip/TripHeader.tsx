import Link from 'next/link';
import type { Trip, PlanVersion } from '@/lib/types';
import { formatDate, formatMoney } from '@/lib/format';
import { PushToggle } from '@/components/pwa/PushToggle';

interface TripHeaderProps {
  trip: Trip;
  plan?: PlanVersion | null;
}

export function TripHeader({ trip, plan }: TripHeaderProps) {
  return (
    <header className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-soft border border-gray-200">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <Link href="/" className="text-sm text-purple-600 hover:underline">
            ← Back to trips
          </Link>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900">{trip.name}</h1>
          <p className="text-gray-600 mt-1">{trip.destination || 'Destination TBD'}</p>
          <p className="text-sm text-gray-500 mt-1">
            {formatDate(trip.start_date)} {trip.end_date ? `– ${formatDate(trip.end_date)}` : ''}
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center justify-end gap-2 md:w-auto md:gap-3">
          <PushToggle />
          <button className="rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50">
            Share
          </button>
          <button className="rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50">
            Export
          </button>
        </div>
      </div>

      {plan && (
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span className="rounded-full bg-purple-100 px-3 py-1 text-purple-700">
            Active: {plan.name}
          </span>
          <span>Plan total: {formatMoney(plan.total_cost || 0, plan.currency)}</span>
        </div>
      )}
    </header>
  );
}
