'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Accommodation, Transport, Cost, ChecklistItem } from '@/lib/types';
import { createBrowserSupabaseClient } from '@/lib/supabase';

interface BookingChecklistProps {
  planVersionId: string;
  planName: string;
  currencySymbol: string;
  accommodations: Accommodation[];
  transport: Transport[];
  costs: Cost[];
  initialItems?: ChecklistItem[];
  onItemsChange?: (items: ChecklistItem[]) => void;
}

const STATUS_ORDER = ['not_booked', 'booked', 'confirmed'] as const;

export function BookingChecklist({
  planVersionId,
  planName,
  currencySymbol,
  accommodations,
  transport,
  costs,
  initialItems = [],
  onItemsChange
}: BookingChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'other', total_cost: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cleaning, setCleaning] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    category: 'other',
    total_cost: '',
    amount_paid: '',
    booking_status: 'not_booked',
    payment_type: 'full',
    booking_reference: '',
    booking_url: '',
    payment_due_date: '',
    notes: ''
  });

  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const loadItems = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('plan_version_id', planVersionId)
      .order('sort_order', { ascending: true });
    const nextItems = (data || []) as ChecklistItem[];
    setItems(nextItems);
    onItemsChange?.(nextItems);
    setLoading(false);
  }, [planVersionId, supabase, onItemsChange]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  function norm(value: unknown) {
    return typeof value === 'string' ? value.toLowerCase().trim() : '';
  }

  const cleanupInfo = useMemo(() => {
    const hasAccommodationBooking = items.some(
      (i) => norm(i.category) === 'accommodation' && i.source_type === 'accommodation'
    );
    const hasTransportBooking = items.some(
      (i) => norm(i.category) === 'transport' && i.source_type === 'transport'
    );

    const accommodationTotals = new Set(
      items
        .filter((i) => norm(i.category) === 'accommodation' && i.source_type === 'accommodation')
        .map((i) => Number(i.total_cost || 0))
    );
    const transportTotals = new Set(
      items
        .filter((i) => norm(i.category) === 'transport' && i.source_type === 'transport')
        .map((i) => Number(i.total_cost || 0))
    );

    const candidates = items.filter((i) => {
      if (i.source_type !== 'cost') return false;
      const category = norm(i.category);
      if (category !== 'accommodation' && category !== 'transport') return false;

      const totalCost = Number(i.total_cost || 0);
      if (category === 'accommodation') {
        if (!hasAccommodationBooking) return false;
        if (!accommodationTotals.has(totalCost)) return false;
      }
      if (category === 'transport') {
        if (!hasTransportBooking) return false;
        if (!transportTotals.has(totalCost)) return false;
      }

      return true;
    });

    const safe = candidates.filter((i) => {
      if (Number(i.amount_paid || 0) !== 0) return false;
      if (i.booking_reference || i.booking_url || i.notes) return false;
      return true;
    });

    const unsafe = candidates.filter((i) => !safe.some((s) => s.id === i.id));

    return {
      candidates,
      safe,
      unsafe,
      safeTotal: safe.reduce((sum, i) => sum + Number(i.total_cost || 0), 0)
    };
  }, [items]);

  async function seedFromPlan() {
    setLoading(true);

    // Reload linked keys from DB to be resilient to stale client state and double-clicks.
    const { data: existingRows } = await supabase
      .from('checklist_items')
      .select('source_type,source_id')
      .eq('plan_version_id', planVersionId)
      .not('source_id', 'is', null);

    const existing = new Set(
      (existingRows || [])
        .filter((r: any) => r.source_type && r.source_id)
        .map((r: any) => `${r.source_type}:${r.source_id}`)
    );

    const seeds: Partial<ChecklistItem>[] = [];

    accommodations.forEach((acc) => {
      const key = `accommodation:${acc.id}`;
      if (existing.has(key)) return;
      seeds.push({
        plan_version_id: planVersionId,
        category: 'accommodation',
        name: acc.name,
        source_type: 'accommodation',
        source_id: acc.id,
        total_cost: acc.cost || 0,
        booking_status: 'not_booked',
        payment_type: 'full'
      });
    });

    transport.forEach((t) => {
      const key = `transport:${t.id}`;
      if (existing.has(key)) return;
      seeds.push({
        plan_version_id: planVersionId,
        category: 'transport',
        name: t.vehicle || t.provider || t.type,
        source_type: 'transport',
        source_id: t.id,
        total_cost: t.cost || 0,
        booking_status: 'not_booked',
        payment_type: 'full'
      });
    });

    costs.forEach((c) => {
      const category = (c.category || '').toLowerCase();
      // Prevent double counting: accommodation/transport exist both as dedicated tables and as costs rows.
      if (category === 'accommodation' || category === 'transport') return;
      const key = `cost:${c.id}`;
      if (existing.has(key)) return;
      seeds.push({
        plan_version_id: planVersionId,
        category: c.category || 'other',
        name: c.item,
        source_type: 'cost',
        source_id: c.id,
        total_cost: c.amount || 0,
        booking_status: 'not_booked',
        payment_type: 'full'
      });
    });

    if (seeds.length > 0) {
      // Idempotent seed: ignoreDuplicates relies on a DB unique index across
      // (plan_version_id, source_type, source_id). Manual items have null source_id.
      await supabase
        .from('checklist_items')
        .upsert(seeds, {
          onConflict: 'plan_version_id,source_type,source_id',
          ignoreDuplicates: true
        });
    }

    await loadItems();
  }

  async function cleanupSeedDuplicates() {
    if (cleaning || loading) return;
    if (cleanupInfo.safe.length === 0) return;

    const sampleNames = cleanupInfo.safe
      .slice(0, 5)
      .map((i) => i.name)
      .filter(Boolean)
      .join(', ');

    const messageLines = [
      `Cleanup will delete ${cleanupInfo.safe.length} duplicate checklist items (seed artifacts).`,
      `This removes double-counted cost lines for accommodation/transport only when a matching booking item exists.`,
      `Total removed: ${currencySymbol}${cleanupInfo.safeTotal.toFixed(2)}.`,
      sampleNames ? `Examples: ${sampleNames}${cleanupInfo.safe.length > 5 ? ', …' : ''}` : '',
      cleanupInfo.unsafe.length
        ? `Note: ${cleanupInfo.unsafe.length} similar items were NOT selected because they have payments/notes/refs.`
        : '',
      '',
      'Continue?'
    ]
      .filter(Boolean)
      .join('\n');

    if (!window.confirm(messageLines)) return;

    setCleaning(true);
    try {
      const { error } = await supabase
        .from('checklist_items')
        .delete()
        .in('id', cleanupInfo.safe.map((i) => i.id));
      if (error) throw error;
      await loadItems();
    } catch (e) {
      // Surface error via console for now; UI will refresh on success.
      console.error(e);
      alert(e instanceof Error ? e.message : 'Cleanup failed');
    } finally {
      setCleaning(false);
    }
  }

  async function resetAndReseedChecklist() {
    if (cleaning || loading) return;
    const typed = window.prompt(
      'This will delete ALL checklist items for this plan, including manual edits (payments, refs, notes).\\n\\nType RESET to continue.'
    );
    if (typed !== 'RESET') return;

    setCleaning(true);
    try {
      const { error } = await supabase.from('checklist_items').delete().eq('plan_version_id', planVersionId);
      if (error) throw error;
      await seedFromPlan();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Reset failed');
    } finally {
      setCleaning(false);
    }
  }

  async function addManualItem() {
    if (!form.name.trim()) return;
    setLoading(true);

    await supabase.from('checklist_items').insert({
      plan_version_id: planVersionId,
      category: form.category,
      name: form.name.trim(),
      total_cost: form.total_cost ? Number(form.total_cost) : 0,
      booking_status: 'not_booked',
      payment_type: 'full'
    });

    setForm({ name: '', category: 'other', total_cost: '' });
    setShowForm(false);
    await loadItems();
  }

  async function cycleStatus(item: ChecklistItem) {
    const currentIndex = STATUS_ORDER.indexOf(item.booking_status as any);
    const nextStatus = STATUS_ORDER[(currentIndex + 1) % STATUS_ORDER.length];
    await supabase
      .from('checklist_items')
      .update({ booking_status: nextStatus })
      .eq('id', item.id);
    await loadItems();
  }

  function startEdit(item: ChecklistItem) {
    setEditingId(item.id);
    setEditForm({
      name: item.name || '',
      category: item.category || 'other',
      total_cost: item.total_cost ? String(item.total_cost) : '',
      amount_paid: item.amount_paid ? String(item.amount_paid) : '',
      booking_status: item.booking_status || 'not_booked',
      payment_type: item.payment_type || 'full',
      booking_reference: item.booking_reference || '',
      booking_url: item.booking_url || '',
      payment_due_date: item.payment_due_date || '',
      notes: item.notes || ''
    });
  }

  async function saveEdit(item: ChecklistItem) {
    setLoading(true);
    const payload = {
      name: editForm.name.trim(),
      category: editForm.category,
      total_cost: editForm.total_cost ? Number(editForm.total_cost) : 0,
      amount_paid: editForm.amount_paid ? Number(editForm.amount_paid) : 0,
      booking_status: editForm.booking_status,
      payment_type: editForm.payment_type,
      booking_reference: editForm.booking_reference || null,
      booking_url: editForm.booking_url || null,
      payment_due_date: editForm.payment_due_date || null,
      notes: editForm.notes || null
    };

    await supabase.from('checklist_items').update(payload).eq('id', item.id);
    setEditingId(null);
    await loadItems();
  }

  function cancelEdit() {
    setEditingId(null);
  }

  const total = items.reduce((sum, item) => sum + (item.total_cost || 0), 0);
  const paid = items.reduce((sum, item) => sum + (item.amount_paid || 0), 0);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Booking Checklist</h3>
          <p className="text-sm text-gray-600">{planName}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
          >
            Add item
          </button>
          <button
            onClick={seedFromPlan}
            className="rounded-lg bg-purple-600 px-3 py-2 text-sm text-white"
          >
            Seed from plan
          </button>
          {cleanupInfo.safe.length > 0 && (
            <button
              onClick={cleanupSeedDuplicates}
              className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 hover:bg-amber-100"
              disabled={cleaning || loading}
              title="Deletes duplicate seed artifacts that double-count totals"
            >
              Cleanup duplicates
            </button>
          )}
          <button
            onClick={resetAndReseedChecklist}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            disabled={cleaning || loading}
            title="Deletes all checklist items for this plan and re-seeds from plan"
          >
            Reset + reseed
          </button>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Total: {currencySymbol}{total.toFixed(2)} · Paid: {currencySymbol}{paid.toFixed(2)}
      </div>

      {showForm && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-2">
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Item name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="accommodation">Accommodation</option>
            <option value="transport">Transport</option>
            <option value="activity">Activity</option>
            <option value="tickets">Tickets</option>
            <option value="other">Other</option>
          </select>
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Total cost"
            value={form.total_cost}
            onChange={(e) => setForm({ ...form, total_cost: e.target.value })}
          />
          <button
            className="rounded-lg bg-purple-600 px-3 py-2 text-sm text-white"
            onClick={addManualItem}
          >
            Save
          </button>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {loading && <p className="text-sm text-gray-500">Loading…</p>}
        {!loading && items.length === 0 && (
          <p className="text-sm text-gray-500">No checklist items yet.</p>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3"
          >
            {editingId === item.id ? (
              <div className="w-full space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <input
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Name"
                  />
                  <select
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  >
                    <option value="accommodation">Accommodation</option>
                    <option value="transport">Transport</option>
                    <option value="activity">Activity</option>
                    <option value="tickets">Tickets</option>
                    <option value="other">Other</option>
                  </select>
                  <input
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={editForm.total_cost}
                    onChange={(e) => setEditForm({ ...editForm, total_cost: e.target.value })}
                    placeholder="Total cost"
                  />
                  <input
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={editForm.amount_paid}
                    onChange={(e) => setEditForm({ ...editForm, amount_paid: e.target.value })}
                    placeholder="Amount paid"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <select
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={editForm.booking_status}
                    onChange={(e) => setEditForm({ ...editForm, booking_status: e.target.value })}
                  >
                    <option value="not_booked">Not booked</option>
                    <option value="booked">Booked</option>
                    <option value="confirmed">Confirmed</option>
                  </select>
                  <select
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={editForm.payment_type}
                    onChange={(e) => setEditForm({ ...editForm, payment_type: e.target.value })}
                  >
                    <option value="full">Full</option>
                    <option value="deposit">Deposit</option>
                    <option value="on_arrival">On arrival</option>
                    <option value="free">Free</option>
                  </select>
                  <input
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={editForm.booking_reference}
                    onChange={(e) =>
                      setEditForm({ ...editForm, booking_reference: e.target.value })
                    }
                    placeholder="Booking reference"
                  />
                  <input
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={editForm.payment_due_date}
                    onChange={(e) =>
                      setEditForm({ ...editForm, payment_due_date: e.target.value })
                    }
                    placeholder="Payment due date"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={editForm.booking_url}
                    onChange={(e) => setEditForm({ ...editForm, booking_url: e.target.value })}
                    placeholder="Booking URL"
                  />
                  <input
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    placeholder="Notes"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => saveEdit(item)}
                    className="rounded-lg bg-purple-600 px-3 py-1 text-xs text-white"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="rounded-lg border border-gray-200 px-3 py-1 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.category}</p>
                  {(item.booking_reference || item.booking_url) && (
                    <p className="text-xs text-gray-500 mt-1">
                      {item.booking_reference ? `Ref: ${item.booking_reference}` : ''}
                      {item.booking_reference && item.booking_url ? ' · ' : ''}
                      {item.booking_url ? 'URL set' : ''}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-700">
                    {currencySymbol}{(item.total_cost || 0).toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-500">
                    Paid {currencySymbol}{(item.amount_paid || 0).toFixed(2)}
                  </span>
                  <button
                    onClick={() => cycleStatus(item)}
                    className="rounded-full border border-gray-200 px-3 py-1 text-xs"
                  >
                    {item.booking_status}
                  </button>
                  <button
                    onClick={() => startEdit(item)}
                    className="rounded-lg border border-gray-200 px-3 py-1 text-xs"
                  >
                    Edit
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
