'use client';

import { useMemo, useState } from 'react';
import type { ItineraryDay, Accommodation, Cost, Activity } from '@/lib/types';
import { formatDate, formatMoney } from '@/lib/format';

function coerceEmbeddedActivities(raw: unknown): any[] {
  if (Array.isArray(raw)) return raw as any[];
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as any[];
      if (parsed && typeof parsed === 'object' && Array.isArray((parsed as any).activities)) {
        return (parsed as any).activities as any[];
      }
    } catch {
      // ignore
    }
  }
  if (raw && typeof raw === 'object' && Array.isArray((raw as any).activities)) {
    return (raw as any).activities as any[];
  }
  return [];
}

interface DayCardGridProps {
  days: ItineraryDay[];
  accommodations: Accommodation[];
  costs: Cost[];
  currency?: string | null;
  onChangeDay?: (day: ItineraryDay) => void;
}

export function DayCardGrid({
  days,
  accommodations,
  costs,
  currency,
  onChangeDay
}: DayCardGridProps) {
  const [expandedDayId, setExpandedDayId] = useState<string | null>(null);
  const [activitiesByDay, setActivitiesByDay] = useState<Record<string, Activity[]>>({});
  const [loadingActivities, setLoadingActivities] = useState<Record<string, boolean>>({});

  const findAccommodation = (day: ItineraryDay) => {
    if (!day.date) return null;
    const date = new Date(day.date);
    return (
      accommodations.find((acc) => {
        if (!acc.check_in || !acc.check_out) return false;
        const start = new Date(acc.check_in);
        const end = new Date(acc.check_out);
        return date >= start && date < end;
      }) || null
    );
  };

  const costsByDay = useMemo(() => {
    const map: Record<string, Cost[]> = {};
    costs.forEach((cost) => {
      if (!cost.itinerary_day_id) return;
      if (!map[cost.itinerary_day_id]) map[cost.itinerary_day_id] = [];
      map[cost.itinerary_day_id].push(cost);
    });
    return map;
  }, [costs]);

  const loadActivities = async (dayId: string) => {
    if (activitiesByDay[dayId]) return;
    setLoadingActivities((prev) => ({ ...prev, [dayId]: true }));
    try {
      const res = await fetch(`/api/activities?itinerary_day_id=${dayId}`);
      if (res.ok) {
        const data = (await res.json()) as Activity[];
        setActivitiesByDay((prev) => ({ ...prev, [dayId]: data || [] }));
      } else {
        setActivitiesByDay((prev) => ({ ...prev, [dayId]: [] }));
      }
    } catch {
      setActivitiesByDay((prev) => ({ ...prev, [dayId]: [] }));
    } finally {
      setLoadingActivities((prev) => ({ ...prev, [dayId]: false }));
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {days.map((day) => {
        const accommodation = findAccommodation(day);
        const dayCosts = costsByDay[day.id] || [];
        const total = dayCosts.reduce((sum, c) => sum + (c.amount || 0), 0);
        const isExpanded = expandedDayId === day.id;
        const embeddedActivities = coerceEmbeddedActivities((day as any).activities);
        const fetchedActivities = activitiesByDay[day.id];
        const activities =
          Array.isArray(fetchedActivities) && fetchedActivities.length > 0
            ? fetchedActivities
            : embeddedActivities;

        return (
          <div
            key={day.id}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-soft transition hover:border-purple-200"
          >
            <button
              type="button"
              onClick={() => {
                const next = isExpanded ? null : day.id;
                setExpandedDayId(next);
                if (!isExpanded) {
                  if (embeddedActivities.length === 0) {
                    void loadActivities(day.id);
                  }
                }
              }}
              aria-expanded={isExpanded}
              className="w-full text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Day {day.day_number}</p>
                  <h3 className="text-lg font-semibold text-gray-900">{day.location}</h3>
                  <p className="text-sm text-gray-600">{formatDate(day.date)}</p>
                </div>
                <div className="text-2xl">{day.icon || '📍'}</div>
              </div>

              {day.drive_time && (
                <p className="mt-2 text-sm text-gray-500">Drive: {day.drive_time}</p>
              )}

              {accommodation && (
                <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm">
                  <p className="font-medium">Stay: {accommodation.name}</p>
                  <p className="text-gray-600">{accommodation.location}</p>
                </div>
              )}

              {total > 0 && (
                <p className="mt-3 text-sm text-gray-700">
                  Day cost: {formatMoney(total, currency)}
                </p>
              )}
            </button>

            {isExpanded && (
              <div className="mt-4 space-y-4 border-t border-gray-100 pt-4 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">Details</p>
                  {onChangeDay && (
                    <button
                      type="button"
                      onClick={() => onChangeDay(day)}
                      className="rounded-lg border border-gray-200 px-3 py-1 text-xs hover:bg-gray-50"
                    >
                      Edit day
                    </button>
                  )}
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Activities</p>
                  {embeddedActivities.length === 0 && loadingActivities[day.id] && (
                    <p className="mt-2 text-xs text-gray-500">Loading activities…</p>
                  )}
                  {!loadingActivities[day.id] && activities.length === 0 && (
                    <p className="mt-2 text-xs text-gray-500">No activities yet.</p>
                  )}
                  <div className="mt-2 space-y-2">
                    {activities.map((activity: any, idx: number) => (
                      <div
                        key={activity.id || `${day.id}-${idx}-${activity.name || 'activity'}`}
                        className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-800">{activity.name}</p>
                          {activity.cost ? (
                            <span className="text-xs text-gray-600">
                              {formatMoney(activity.cost, currency)}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-gray-500">
                          {activity.time_start || 'Anytime'}
                          {activity.time_end ? ` – ${activity.time_end}` : ''}
                          {activity.location ? ` · ${activity.location}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Costs</p>
                  {dayCosts.length === 0 && (
                    <p className="mt-2 text-xs text-gray-500">No costs yet.</p>
                  )}
                  <div className="mt-2 space-y-2">
                    {dayCosts.map((cost) => (
                      <div
                        key={cost.id}
                        className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-800">{cost.item}</p>
                          <p className="text-xs text-gray-500">{cost.category}</p>
                        </div>
                        <span className="text-xs text-gray-700">
                          {formatMoney(cost.amount, currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {accommodation && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Accommodation</p>
                    <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                      <p className="text-sm font-medium text-gray-800">{accommodation.name}</p>
                      <p className="text-xs text-gray-500">
                        {accommodation.location || accommodation.address || 'Location TBD'}
                      </p>
                      {accommodation.check_in && accommodation.check_out && (
                        <p className="text-xs text-gray-500">
                          {formatDate(accommodation.check_in)} → {formatDate(accommodation.check_out)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
