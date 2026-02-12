'use client';

import { useEffect, useMemo, useState } from 'react';

type ShareRow = {
  id: string;
  trip_id: string;
  shared_with_email: string;
  permission: string;
  invited_at?: string | null;
  accepted_at?: string | null;
  created_at?: string | null;
};

const DEFAULT_EMAILS = ['vdmkelz@gmail.com'];

export function TripSharePanel({ tripId }: { tripId: string }) {
  const [shares, setShares] = useState<ShareRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'edit'>('edit');

  const defaultButtons = useMemo(() => DEFAULT_EMAILS, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/shares`, { cache: 'no-store' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || 'Failed to load shares');
      setShares(Array.isArray(body) ? (body as ShareRow[]) : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load shares');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  async function invite(inviteEmail: string, invitePermission: 'view' | 'edit') {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/shares`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, permission: invitePermission })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || 'Failed to invite');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to invite');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-soft space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Shares</h2>
          <p className="mt-1 text-sm text-gray-600">
            For now this is allowlist-based. Add an email and it will immediately appear for that user.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={busy}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
        >
          Refresh
        </button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-700">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@gmail.com"
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300"
            inputMode="email"
            autoComplete="email"
          />
        </div>
        <div className="w-full md:w-40">
          <label className="block text-xs font-medium text-gray-700">Permission</label>
          <select
            value={permission}
            onChange={(e) => setPermission(e.target.value as any)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300"
          >
            <option value="view">View</option>
            <option value="edit">Edit</option>
          </select>
        </div>
        <button
          type="button"
          onClick={() => invite(email.trim().toLowerCase(), permission)}
          disabled={busy || !email.trim()}
          className="rounded-lg bg-brand-purple px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          Invite
        </button>
      </div>

      {defaultButtons.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {defaultButtons.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => invite(e, 'edit')}
              disabled={busy}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
            >
              Invite {e}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : shares.length === 0 ? (
        <p className="text-sm text-gray-500">No shares yet.</p>
      ) : (
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-100">
          {shares.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{s.shared_with_email}</p>
                <p className="text-xs text-gray-500">Permission: {s.permission}</p>
              </div>
              <span className="text-xs text-gray-500">{s.accepted_at ? 'Accepted' : 'Invited'}</span>
            </div>
          ))}
        </div>
      )}

      {busy && <p className="text-sm text-gray-500">Working…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}

