'use client';

import { useEffect, useState } from 'react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

async function getRegistrationOrThrow(timeoutMs = 8000) {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not available in this browser.');
  }

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // Pick the registration that controls the root scope if possible.
  let reg =
    (await navigator.serviceWorker.getRegistration('/')) ||
    (await navigator.serviceWorker.getRegistration()) ||
    null;

  // Some browsers can end up with a "zombie" registration that has no active,
  // waiting, or installing worker (e.g., failed install). Unregister it so we
  // can recover by re-registering.
  if (reg && !reg.active && !reg.waiting && !reg.installing) {
    try {
      await reg.unregister();
    } catch {
      // ignore
    }
    reg = null;
  }

  // next-pwa should auto-register, but on some mobile builds it can be delayed.
  // Register explicitly as a fallback.
  if (!reg) {
    // Surface real network issues early.
    const swRes = await fetch('/sw.js', { cache: 'no-store' }).catch(() => null);
    if (!swRes || !swRes.ok) {
      throw new Error('Service worker script /sw.js could not be loaded.');
    }

    try {
      reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Service worker registration failed.';
      throw new Error(msg);
    }
  }

  if (!reg) {
    throw new Error('Service worker is not registered. Reload and try again.');
  }

  // Ensure we're not looking at a stale registration state.
  try {
    await reg.update();
  } catch {
    // ignore
  }

  // PushManager requires an *active* SW. On first install, a reload might be
  // needed before the SW controls the page, so we wait for activation rather
  // than navigator.serviceWorker.ready (which can hang until controlled).
  const start = Date.now();
  while (!reg.active || reg.active.state !== 'activated') {
    // Recovery path: if the registration has no workers, re-register.
    if (!reg.active && !reg.waiting && !reg.installing) {
      try {
        await reg.unregister();
      } catch {
        // ignore
      }
      try {
        reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      } catch {
        // ignore, we'll time out with a helpful message below
      }
    }

    if (Date.now() - start > timeoutMs) {
      const installing = reg.installing?.state || null;
      const waiting = reg.waiting?.state || null;
      const active = reg.active?.state || null;
      throw new Error(
        `Service worker not active yet (installing=${installing}, waiting=${waiting}, active=${active}). Reload the page and try again.`
      );
    }
    await sleep(250);
    reg = (await navigator.serviceWorker.getRegistration('/')) || (await navigator.serviceWorker.getRegistration()) || reg;
  }

  // Some Android Chrome builds still throw "no active Service Worker" if the SW
  // hasn't claimed a controller yet, even though reg.active is activated.
  const controllerStart = Date.now();
  while (!navigator.serviceWorker.controller) {
    if (Date.now() - controllerStart > timeoutMs) break;
    await sleep(250);
  }

  return reg;
}

export function usePushSubscription() {
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((sub) => setIsSubscribed(!!sub))
      .catch(() => setIsSubscribed(false));
  }, []);

  const subscribe = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      throw new Error('Push notifications are not supported in this browser.');
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission not granted.');
    }

    const registration = await getRegistrationOrThrow();
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      setIsSubscribed(true);
      return;
    }

    const vapidKey = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '').trim();
    if (!vapidKey) {
      throw new Error('Missing VAPID public key.');
    }

    let subscription: PushSubscription | null = null;
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e || '');
      // Retry once after waiting for SW readiness (helps on first install / Android).
      if (msg.toLowerCase().includes('no active service worker')) {
        try {
          await Promise.race([
            navigator.serviceWorker.ready,
            new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000))
          ]);
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey)
          });
        } catch {
          throw new Error('Service worker not ready for push yet. Reload the page and try again.');
        }
      }
      throw e;
    }

    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error || 'Failed to save push subscription.');
    }

    setIsSubscribed(true);
  };

  const unsubscribe = async () => {
    if (!('serviceWorker' in navigator)) return;
    const registration = await getRegistrationOrThrow();
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      // Attempt to remove from DB to avoid stale endpoints.
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      }).catch(() => {});
      await subscription.unsubscribe();
    }
    setIsSubscribed(false);
  };

  return { isSubscribed, subscribe, unsubscribe };
}
