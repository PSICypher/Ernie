'use client';

import { usePWA } from '@/hooks/usePWA';

export function InstallBanner() {
  const { installPrompt, install } = usePWA();

  if (!installPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-purple-600 text-white p-4 rounded-lg shadow-lg flex items-center justify-between">
      <div>
        <p className="font-medium">Install Holiday Planner</p>
        <p className="text-sm opacity-90">Add to your home screen for quick access</p>
      </div>
      <button
        onClick={install}
        className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium"
      >
        Install
      </button>
    </div>
  );
}
