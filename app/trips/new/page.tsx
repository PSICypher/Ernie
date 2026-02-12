'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function NewTripPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    destination: '',
    start_date: '',
    end_date: ''
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to create trip');
      }

      const trip = await res.json();

      const planRes = await fetch('/api/plan-versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: trip.id,
          name: 'Plan A',
          description: 'Main plan',
          is_active: true,
          currency: 'GBP',
          color: '#8B5CF6'
        })
      });

      if (!planRes.ok) {
        const body = await planRes.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to create default plan');
      }

      router.push(`/trips/${trip.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-semibold">Create a new trip</h1>
        <p className="text-gray-600 mt-2">Start with the basics. You can refine everything later.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block text-sm font-medium text-gray-700">
            Trip name
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="Florida Family Adventure"
              className="mt-2"
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Description
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Family holiday with beaches and theme parks"
              className="mt-2"
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Destination
            <Input
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
              placeholder="Florida, USA"
              className="mt-2"
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block text-sm font-medium text-gray-700">
              Start date
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="mt-2"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              End date
              <Input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="mt-2"
              />
            </label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={loading}>
            {loading ? 'Creating trip...' : 'Create trip'}
          </Button>
        </form>
      </div>
    </main>
  );
}
