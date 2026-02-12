'use client';

import { useState } from 'react';
import type { PlanVersion } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PlanVersionTabsProps {
  plans: PlanVersion[];
  activePlanId: string;
  tripId: string;
  onPlansChanged: () => void;
}

export function PlanVersionTabs({ plans, activePlanId, tripId, onPlansChanged }: PlanVersionTabsProps) {
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');

  async function setActivePlan(planId: string) {
    if (planId === activePlanId || loading) return;
    setLoading(true);
    try {
      const currentActive = plans.find((plan) => plan.is_active);
      if (currentActive && currentActive.id !== planId) {
        await fetch(`/api/plan-versions/${currentActive.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: false })
        });
      }

      await fetch(`/api/plan-versions/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: true })
      });
      onPlansChanged();
    } finally {
      setLoading(false);
    }
  }

  async function addPlan() {
    if (!newPlanName.trim()) return;
    setLoading(true);
    try {
      await fetch('/api/plan-versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: tripId,
          name: newPlanName.trim(),
          is_active: false,
          currency: 'GBP',
          color: '#10B981'
        })
      });
      setNewPlanName('');
      setShowAdd(false);
      onPlansChanged();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-2">
        {plans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setActivePlan(plan.id)}
            className={cn(
              'rounded-full px-4 py-2 text-sm border transition',
              plan.id === activePlanId
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'
            )}
          >
            {plan.name}
          </button>
        ))}
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="rounded-full px-4 py-2 text-sm border border-dashed border-gray-300 text-gray-600 hover:border-purple-300"
        >
          + Add Plan
        </button>
      </div>

      {showAdd && (
        <div className="mt-3 flex gap-2">
          <input
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Plan B"
            value={newPlanName}
            onChange={(e) => setNewPlanName(e.target.value)}
          />
          <button
            className="rounded-lg bg-purple-600 text-white px-4 py-2 text-sm"
            disabled={loading}
            onClick={addPlan}
          >
            Create
          </button>
        </div>
      )}
    </div>
  );
}
