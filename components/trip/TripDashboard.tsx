'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  Trip,
  PlanVersion,
  ItineraryDay,
  Accommodation,
  Transport,
  Cost,
  Decision,
  ChecklistItem
} from '@/lib/types';
import { TripHeader } from '@/components/trip/TripHeader';
import { TripDashboardHeader } from '@/components/trip/TripDashboardHeader';
import { PlanVersionTabs } from '@/components/trip/PlanVersionTabs';
import { DayCardGrid } from '@/components/trip/DayCardGrid';
import { BookingChecklist } from '@/components/trip/BookingChecklist';
import { DayEditSheet } from '@/components/trip/DayEditSheet';
import { RouteMap } from '@/components/trip/RouteMap';
import { currencySymbol } from '@/lib/format';

interface TripDashboardProps {
  trip: Trip;
  plans: PlanVersion[];
  activePlan: PlanVersion | null;
  days: ItineraryDay[];
  accommodations: Accommodation[];
  transport: Transport[];
  costs: Cost[];
  decisions: Decision[];
  checklist: ChecklistItem[];
}

const TABS = ['overview', 'checklist', 'research', 'documents', 'packing', 'insights'] as const;

export function TripDashboard({
  trip,
  plans,
  activePlan,
  days,
  accommodations,
  transport,
  costs,
  decisions,
  checklist
}: TripDashboardProps) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]>('overview');
  const [checklistState, setChecklistState] = useState<ChecklistItem[]>(checklist);
  const [editingDay, setEditingDay] = useState<ItineraryDay | null>(null);

  useEffect(() => {
    setChecklistState(checklist);
  }, [checklist]);

  const plan = activePlan || plans[0] || null;
  const symbol = currencySymbol(plan?.currency);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <TripHeader trip={trip} plan={plan} />
        <TripDashboardHeader
          trip={trip}
          plan={plan}
          days={days}
          accommodations={accommodations}
          costs={costs}
          decisions={decisions}
          checklist={checklistState}
        />
        <PlanVersionTabs
          plans={plans}
          activePlanId={plan?.id || ''}
          tripId={trip.id}
          onPlansChanged={() => router.refresh()}
        />

        <div className="flex flex-wrap gap-4 border-b border-gray-200">
          {TABS.map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`px-2 pb-3 text-sm font-medium ${
                tab === item
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="space-y-6">
            <RouteMap days={days} />
            <DayCardGrid
              days={days}
              accommodations={accommodations}
              costs={costs}
              currency={plan?.currency}
              onChangeDay={(day) => setEditingDay(day)}
            />
          </div>
        )}

        {tab === 'checklist' && plan && (
          <BookingChecklist
            planVersionId={plan.id}
            planName={plan.name}
            currencySymbol={symbol}
            accommodations={accommodations}
            transport={transport}
            costs={costs}
            initialItems={checklistState}
            onItemsChange={setChecklistState}
          />
        )}

        {tab !== 'overview' && tab !== 'checklist' && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-gray-500">
            {tab.charAt(0).toUpperCase() + tab.slice(1)} tab coming next.
          </div>
        )}
      </div>

      {editingDay && plan && (
        <DayEditSheet
          isOpen={Boolean(editingDay)}
          day={editingDay}
          planVersionId={plan.id}
          currency={plan.currency}
          onClose={() => setEditingDay(null)}
          onSaved={() => router.refresh()}
        />
      )}
    </main>
  );
}
