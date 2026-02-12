import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DayCardGrid } from '@/components/trip/DayCardGrid';

describe('DayCardGrid', () => {
  it('renders embedded itinerary_days.activities when present (no API fetch needed)', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch' as any)
      .mockImplementation(() => Promise.reject(new Error('should not fetch')));

    render(
      <DayCardGrid
        days={[
          {
            id: 'day-1',
            plan_version_id: 'pv-1',
            day_number: 1,
            date: '2026-07-09',
            location: 'Key Largo',
            icon: '🐟',
            activities: [{ name: 'John Pennekamp Coral Reef State Park' }]
          } as any
        ]}
        accommodations={[]}
        costs={[]}
        currency="USD"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /day 1/i }));

    expect(screen.getByText('Activities')).toBeInTheDocument();
    expect(screen.getByText('John Pennekamp Coral Reef State Park')).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
