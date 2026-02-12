'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePushSubscription } from '@/lib/push-client';

export function PushToggle() {
  const { isSubscribed, subscribe, unsubscribe } = usePushSubscription();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);

  const vapidConfigured = useMemo(() => {
    return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
  }, []);

  const canUsePush =
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window;

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    setPermission(Notification.permission);
    const ua = navigator.userAgent || '';
    setIsIOS(/iPad|iPhone|iPod/i.test(ua));
    const standalone =
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      // @ts-expect-error - iOS Safari
      Boolean(window.navigator.standalone);
    setIsStandalone(Boolean(standalone));
  }, []);

  async function onToggle(next: boolean) {
    if (busy) return;
    setError(null);
    setTestStatus(null);
    setBusy(true);
    try {
      if (next) {
        await subscribe();
        if (typeof window !== 'undefined' && 'Notification' in window) {
          setPermission(Notification.permission);
        }
      } else {
        await unsubscribe();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Push toggle failed');
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermission(Notification.permission);
      }
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    if (busy) return;
    setError(null);
    setTestStatus(null);
    setBusy(true);
    try {
      const res = await fetch('/api/push/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: 'Ernie',
          message: 'Test notification'
        })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || 'Failed to send test notification');
      }
      setTestStatus(`Sent to ${body.sent} device(s)`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send test');
    } finally {
      setBusy(false);
    }
  }

  if (!vapidConfigured) {
    return (
      <div className="text-xs text-gray-500">
        Push: not configured
      </div>
    );
  }

  if (!canUsePush) {
    return (
      <div className="text-xs text-gray-500">
        Push: unsupported
      </div>
    );
  }

  if (isIOS && !isStandalone) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="text-xs text-gray-700">Notifications</div>
        <div className="text-xs text-gray-500">Install (Add to Home Screen) to enable on iPhone.</div>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="text-xs text-gray-700">Notifications</div>
        <div className="text-xs text-red-600">Blocked in browser settings.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <label className="flex items-center gap-2 text-xs text-gray-700 select-none">
        <span>Notifications</span>
        <button
          type="button"
          onClick={() => onToggle(!isSubscribed)}
          disabled={busy}
          className={`relative inline-flex h-6 w-11 items-center rounded-full border transition ${
            isSubscribed ? 'bg-purple-600 border-purple-600' : 'bg-gray-200 border-gray-200'
          } ${busy ? 'opacity-60' : ''}`}
          aria-pressed={isSubscribed}
          aria-label="Toggle notifications"
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
              isSubscribed ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </button>
      </label>

      {busy && (
        <p className="text-[11px] text-gray-500">Working…</p>
      )}

      {isSubscribed && (
        <button
          type="button"
          onClick={sendTest}
          disabled={busy}
          className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          Send test
        </button>
      )}

      {testStatus && <p className="text-xs text-green-700">{testStatus}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {permission === 'default' && !isSubscribed && !error && (
        <p className="text-[11px] text-gray-500 max-w-[220px] text-right">
          If you dismissed the prompt, click again and choose Allow.
        </p>
      )}
    </div>
  );
}
