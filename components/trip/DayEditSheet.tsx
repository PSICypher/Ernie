'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Activity, Cost, ItineraryDay } from '@/lib/types';
import { formatMoney } from '@/lib/format';

type TabId = 'day' | 'activities' | 'costs';

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

interface DayEditSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  day: ItineraryDay;
  planVersionId: string;
  currency?: string | null;
}

export function DayEditSheet({
  isOpen,
  onClose,
  onSaved,
  day,
  planVersionId,
  currency
}: DayEditSheetProps) {
  const [tab, setTab] = useState<TabId>('day');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dayForm, setDayForm] = useState({
    location: day.location || '',
    date: day.date || '',
    icon: day.icon || '',
    drive_time: day.drive_time || '',
    drive_distance: day.drive_distance || '',
    notes: day.notes || ''
  });

  const embeddedActivities = useMemo(() => {
    return coerceEmbeddedActivities((day as any).activities);
  }, [day]);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activityDraft, setActivityDraft] = useState({
    name: '',
    time_start: '',
    time_end: '',
    location: '',
    cost: ''
  });
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [activityEdit, setActivityEdit] = useState({
    name: '',
    time_start: '',
    time_end: '',
    location: '',
    cost: ''
  });

  const [costs, setCosts] = useState<Cost[]>([]);
  const [loadingCosts, setLoadingCosts] = useState(false);
  const [costDraft, setCostDraft] = useState({ item: '', category: 'other', amount: '' });
  const [editingCostId, setEditingCostId] = useState<string | null>(null);
  const [costEdit, setCostEdit] = useState({ item: '', category: 'other', amount: '' });

  useEffect(() => {
    if (!isOpen) return;
    setTab('day');
    setError(null);
    setDayForm({
      location: day.location || '',
      date: day.date || '',
      icon: day.icon || '',
      drive_time: day.drive_time || '',
      drive_distance: day.drive_distance || '',
      notes: day.notes || ''
    });
    setActivityDraft({ name: '', time_start: '', time_end: '', location: '', cost: '' });
    setCostDraft({ item: '', category: 'other', amount: '' });
    setEditingActivityId(null);
    setEditingCostId(null);
  }, [isOpen, day]);

  useEffect(() => {
    if (!isOpen) return;
    if (tab !== 'activities') return;
    void loadActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tab, day.id]);

  useEffect(() => {
    if (!isOpen) return;
    if (tab !== 'costs') return;
    void loadCosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tab, day.id]);

  async function loadActivities() {
    setLoadingActivities(true);
    try {
      const res = await fetch(`/api/activities?itinerary_day_id=${day.id}`);
      const data = res.ok ? ((await res.json()) as Activity[]) : [];
      setActivities(data || []);
    } finally {
      setLoadingActivities(false);
    }
  }

  async function loadCosts() {
    setLoadingCosts(true);
    try {
      const res = await fetch(`/api/costs?itinerary_day_id=${day.id}`);
      const data = res.ok ? ((await res.json()) as Cost[]) : [];
      setCosts(data || []);
    } finally {
      setLoadingCosts(false);
    }
  }

  async function saveDay() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/itinerary-days/${day.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          location: dayForm.location.trim(),
          date: dayForm.date || null,
          icon: dayForm.icon || null,
          drive_time: dayForm.drive_time || null,
          drive_distance: dayForm.drive_distance || null,
          notes: dayForm.notes || null
        })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Failed to save day');
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save day');
    } finally {
      setSaving(false);
    }
  }

  async function importEmbeddedActivities() {
    if (embeddedActivities.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const payload = embeddedActivities.map((a: any, idx: number) => ({
        plan_version_id: planVersionId,
        itinerary_day_id: day.id,
        name: String(a?.name || '').trim() || `Activity ${idx + 1}`,
        sort_order: idx
      }));
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Failed to import activities');
      }
      await loadActivities();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to import activities');
    } finally {
      setSaving(false);
    }
  }

  async function addActivity() {
    if (!activityDraft.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          plan_version_id: planVersionId,
          itinerary_day_id: day.id,
          name: activityDraft.name.trim(),
          time_start: activityDraft.time_start || null,
          time_end: activityDraft.time_end || null,
          location: activityDraft.location || null,
          cost: activityDraft.cost ? Number(activityDraft.cost) : null
        })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Failed to add activity');
      }
      setActivityDraft({ name: '', time_start: '', time_end: '', location: '', cost: '' });
      await loadActivities();
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add activity');
    } finally {
      setSaving(false);
    }
  }

  function startEditActivity(a: Activity) {
    setEditingActivityId(a.id);
    setActivityEdit({
      name: a.name || '',
      time_start: a.time_start || '',
      time_end: a.time_end || '',
      location: a.location || '',
      cost: a.cost ? String(a.cost) : ''
    });
  }

  async function saveActivity(a: Activity) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/activities', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: a.id,
          name: activityEdit.name.trim(),
          time_start: activityEdit.time_start || null,
          time_end: activityEdit.time_end || null,
          location: activityEdit.location || null,
          cost: activityEdit.cost ? Number(activityEdit.cost) : null
        })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Failed to save activity');
      }
      setEditingActivityId(null);
      await loadActivities();
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save activity');
    } finally {
      setSaving(false);
    }
  }

  async function deleteActivity(a: Activity) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/activities?id=${a.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Failed to delete activity');
      }
      await loadActivities();
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete activity');
    } finally {
      setSaving(false);
    }
  }

  async function addCost() {
    if (!costDraft.item.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/costs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          plan_version_id: planVersionId,
          itinerary_day_id: day.id,
          item: costDraft.item.trim(),
          category: costDraft.category,
          amount: costDraft.amount ? Number(costDraft.amount) : 0
        })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Failed to add cost');
      }
      setCostDraft({ item: '', category: 'other', amount: '' });
      await loadCosts();
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add cost');
    } finally {
      setSaving(false);
    }
  }

  function startEditCost(c: Cost) {
    setEditingCostId(c.id);
    setCostEdit({
      item: c.item || '',
      category: c.category || 'other',
      amount: typeof c.amount === 'number' ? String(c.amount) : ''
    });
  }

  async function saveCost(c: Cost) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/costs/${c.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          item: costEdit.item.trim(),
          category: costEdit.category,
          amount: costEdit.amount ? Number(costEdit.amount) : 0
        })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Failed to save cost');
      }
      setEditingCostId(null);
      await loadCosts();
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save cost');
    } finally {
      setSaving(false);
    }
  }

  async function deleteCost(c: Cost) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/costs/${c.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Failed to delete cost');
      }
      await loadCosts();
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete cost');
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  const tabs: { id: TabId; label: string }[] = [
    { id: 'day', label: 'Day' },
    { id: 'activities', label: 'Activities' },
    { id: 'costs', label: 'Costs' }
  ];

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-xl flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Day {day.day_number}</p>
            <h2 className="text-lg font-semibold text-gray-900">{day.location}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-3 py-1 text-xs"
          >
            Close
          </button>
        </div>

        <div className="px-4 pt-3 flex gap-3 border-b border-gray-100">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`pb-3 text-sm font-medium ${
                tab === t.id ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}

          {tab === 'day' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <label className="text-sm text-gray-700">
                  Location
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={dayForm.location}
                    onChange={(e) => setDayForm({ ...dayForm, location: e.target.value })}
                  />
                </label>
                <label className="text-sm text-gray-700">
                  Date
                  <input
                    type="date"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={dayForm.date ? dayForm.date.slice(0, 10) : ''}
                    onChange={(e) => setDayForm({ ...dayForm, date: e.target.value })}
                  />
                </label>
                <label className="text-sm text-gray-700">
                  Icon
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={dayForm.icon}
                    onChange={(e) => setDayForm({ ...dayForm, icon: e.target.value })}
                    placeholder="e.g. 🏖️"
                  />
                </label>
                <label className="text-sm text-gray-700">
                  Drive time
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={dayForm.drive_time}
                    onChange={(e) => setDayForm({ ...dayForm, drive_time: e.target.value })}
                    placeholder="e.g. 1.5 hrs"
                  />
                </label>
                <label className="text-sm text-gray-700">
                  Drive distance
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={dayForm.drive_distance}
                    onChange={(e) => setDayForm({ ...dayForm, drive_distance: e.target.value })}
                    placeholder="e.g. 80 miles"
                  />
                </label>
                <label className="text-sm text-gray-700 md:col-span-2">
                  Notes
                  <textarea
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={dayForm.notes}
                    onChange={(e) => setDayForm({ ...dayForm, notes: e.target.value })}
                    rows={4}
                  />
                </label>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={saveDay}
                className="rounded-lg bg-purple-600 px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                Save day
              </button>
            </div>
          )}

          {tab === 'activities' && (
            <div className="space-y-4">
              {embeddedActivities.length > 0 && activities.length === 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <p className="font-medium">Seed activities detected</p>
                  <p className="text-xs mt-1">
                    Your seed stores activities on the day record. Import them once to manage/edit them.
                  </p>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={importEmbeddedActivities}
                    className="mt-2 rounded-lg bg-amber-600 px-3 py-1 text-xs text-white disabled:opacity-50"
                  >
                    Import activities
                  </button>
                </div>
              )}

              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-sm font-medium">Add activity</p>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Name"
                    value={activityDraft.name}
                    onChange={(e) => setActivityDraft({ ...activityDraft, name: e.target.value })}
                  />
                  <input
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Location"
                    value={activityDraft.location}
                    onChange={(e) =>
                      setActivityDraft({ ...activityDraft, location: e.target.value })
                    }
                  />
                  <input
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Start time"
                    value={activityDraft.time_start}
                    onChange={(e) =>
                      setActivityDraft({ ...activityDraft, time_start: e.target.value })
                    }
                  />
                  <input
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="End time"
                    value={activityDraft.time_end}
                    onChange={(e) =>
                      setActivityDraft({ ...activityDraft, time_end: e.target.value })
                    }
                  />
                  <input
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Cost"
                    value={activityDraft.cost}
                    onChange={(e) => setActivityDraft({ ...activityDraft, cost: e.target.value })}
                  />
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={addActivity}
                  className="mt-2 rounded-lg bg-purple-600 px-3 py-1 text-xs text-white disabled:opacity-50"
                >
                  Add
                </button>
              </div>

              {loadingActivities && <p className="text-sm text-gray-500">Loading…</p>}
              {!loadingActivities && activities.length === 0 && embeddedActivities.length === 0 && (
                <p className="text-sm text-gray-500">No activities yet.</p>
              )}
              <div className="space-y-2">
                {activities.map((a) => (
                  <div key={a.id} className="rounded-lg border border-gray-200 p-3">
                    {editingActivityId === a.id ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <input
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            value={activityEdit.name}
                            onChange={(e) =>
                              setActivityEdit({ ...activityEdit, name: e.target.value })
                            }
                            placeholder="Name"
                          />
                          <input
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            value={activityEdit.location}
                            onChange={(e) =>
                              setActivityEdit({ ...activityEdit, location: e.target.value })
                            }
                            placeholder="Location"
                          />
                          <input
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            value={activityEdit.time_start}
                            onChange={(e) =>
                              setActivityEdit({ ...activityEdit, time_start: e.target.value })
                            }
                            placeholder="Start time"
                          />
                          <input
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            value={activityEdit.time_end}
                            onChange={(e) =>
                              setActivityEdit({ ...activityEdit, time_end: e.target.value })
                            }
                            placeholder="End time"
                          />
                          <input
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            value={activityEdit.cost}
                            onChange={(e) =>
                              setActivityEdit({ ...activityEdit, cost: e.target.value })
                            }
                            placeholder="Cost"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => saveActivity(a)}
                            className="rounded-lg bg-purple-600 px-3 py-1 text-xs text-white disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingActivityId(null)}
                            className="rounded-lg border border-gray-200 px-3 py-1 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{a.name}</p>
                          <p className="text-xs text-gray-500">
                            {a.time_start || 'Anytime'}
                            {a.time_end ? ` - ${a.time_end}` : ''}
                            {a.location ? ` · ${a.location}` : ''}
                          </p>
                          {a.cost ? (
                            <p className="text-xs text-gray-600 mt-1">
                              {formatMoney(a.cost, currency)}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => startEditActivity(a)}
                            className="rounded-lg border border-gray-200 px-3 py-1 text-xs"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => deleteActivity(a)}
                            className="rounded-lg border border-gray-200 px-3 py-1 text-xs text-red-600 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'costs' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-sm font-medium">Add cost</p>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Item"
                    value={costDraft.item}
                    onChange={(e) => setCostDraft({ ...costDraft, item: e.target.value })}
                  />
                  <select
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={costDraft.category}
                    onChange={(e) => setCostDraft({ ...costDraft, category: e.target.value })}
                  >
                    <option value="other">Other</option>
                    <option value="food">Food</option>
                    <option value="transport">Transport</option>
                    <option value="accommodation">Accommodation</option>
                    <option value="activities">Activities</option>
                    <option value="tickets">Tickets</option>
                  </select>
                  <input
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Amount"
                    value={costDraft.amount}
                    onChange={(e) => setCostDraft({ ...costDraft, amount: e.target.value })}
                  />
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={addCost}
                  className="mt-2 rounded-lg bg-purple-600 px-3 py-1 text-xs text-white disabled:opacity-50"
                >
                  Add
                </button>
              </div>

              {loadingCosts && <p className="text-sm text-gray-500">Loading…</p>}
              {!loadingCosts && costs.length === 0 && (
                <p className="text-sm text-gray-500">No costs yet.</p>
              )}
              <div className="space-y-2">
                {costs.map((c) => (
                  <div key={c.id} className="rounded-lg border border-gray-200 p-3">
                    {editingCostId === c.id ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <input
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            value={costEdit.item}
                            onChange={(e) => setCostEdit({ ...costEdit, item: e.target.value })}
                            placeholder="Item"
                          />
                          <select
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            value={costEdit.category}
                            onChange={(e) =>
                              setCostEdit({ ...costEdit, category: e.target.value })
                            }
                          >
                            <option value="other">Other</option>
                            <option value="food">Food</option>
                            <option value="transport">Transport</option>
                            <option value="accommodation">Accommodation</option>
                            <option value="activities">Activities</option>
                            <option value="tickets">Tickets</option>
                          </select>
                          <input
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            value={costEdit.amount}
                            onChange={(e) =>
                              setCostEdit({ ...costEdit, amount: e.target.value })
                            }
                            placeholder="Amount"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => saveCost(c)}
                            className="rounded-lg bg-purple-600 px-3 py-1 text-xs text-white disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCostId(null)}
                            className="rounded-lg border border-gray-200 px-3 py-1 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{c.item}</p>
                          <p className="text-xs text-gray-500">{c.category}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-700">
                            {formatMoney(c.amount, currency)}
                          </span>
                          <button
                            type="button"
                            onClick={() => startEditCost(c)}
                            className="rounded-lg border border-gray-200 px-3 py-1 text-xs"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => deleteCost(c)}
                            className="rounded-lg border border-gray-200 px-3 py-1 text-xs text-red-600 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
