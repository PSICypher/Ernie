import type { Trip, PlanVersion, ItineraryDay, Accommodation, Cost, Decision, ChecklistItem } from '@/lib/types';
import { daysUntil, formatMoney } from '@/lib/format';

interface TripDashboardHeaderProps {
  trip: Trip;
  plan: PlanVersion | null;
  days: ItineraryDay[];
  accommodations: Accommodation[];
  costs: Cost[];
  decisions: Decision[];
  checklist: ChecklistItem[];
}

export function TripDashboardHeader({
  trip,
  plan,
  days,
  accommodations,
  costs,
  decisions,
  checklist
}: TripDashboardHeaderProps) {
  const countdown = daysUntil(trip.start_date);
  const totalChecklist = checklist.reduce((sum, item) => sum + (item.total_cost || 0), 0);
  const paidChecklist = checklist.reduce((sum, item) => sum + (item.amount_paid || 0), 0);
  const bookedCount = checklist.filter((item) => item.booking_status !== 'not_booked').length;

  return (
    <section className="mt-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <p className="text-sm opacity-80">Countdown</p>
          <p className="text-2xl font-semibold">
            {countdown === null ? 'TBD' : `${countdown} days`}
          </p>
        </div>
        <div>
          <p className="text-sm opacity-80">Plan Cost</p>
          <p className="text-2xl font-semibold">
            {formatMoney(plan?.total_cost || 0, plan?.currency)}
          </p>
        </div>
        <div>
          <p className="text-sm opacity-80">Bookings</p>
          <p className="text-2xl font-semibold">
            {bookedCount}/{checklist.length}
          </p>
        </div>
        <div>
          <p className="text-sm opacity-80">Paid</p>
          <p className="text-2xl font-semibold">
            {formatMoney(paidChecklist, plan?.currency)} / {formatMoney(totalChecklist, plan?.currency)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div className="rounded-lg bg-white/10 p-3">
          <p className="opacity-80">Days</p>
          <p className="text-lg font-medium">{days.length}</p>
        </div>
        <div className="rounded-lg bg-white/10 p-3">
          <p className="opacity-80">Stays</p>
          <p className="text-lg font-medium">{accommodations.length}</p>
        </div>
        <div className="rounded-lg bg-white/10 p-3">
          <p className="opacity-80">Costs</p>
          <p className="text-lg font-medium">{costs.length}</p>
        </div>
        <div className="rounded-lg bg-white/10 p-3">
          <p className="opacity-80">Decisions</p>
          <p className="text-lg font-medium">
            {decisions.filter((d) => d.status === 'pending').length}
          </p>
        </div>
      </div>
    </section>
  );
}
