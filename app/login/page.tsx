'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase';

const ALLOWED_EMAILS = ['schalk.vdmerwe@gmail.com', 'vdmkelz@gmail.com'];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const hasExchangedRef = useRef(false);
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(
      window.location.hash.startsWith('#')
        ? window.location.hash.slice(1)
        : window.location.hash
    );
    const code = params.get('code');
    const error = params.get('error') ?? hashParams.get('error');
    const description =
      params.get('error_description') ?? hashParams.get('error_description');

    if (!hasExchangedRef.current && code) {
      hasExchangedRef.current = true;
      supabase.auth
        .exchangeCodeForSession(code)
        .then(({ error: exchangeError }) => {
          if (exchangeError) {
            setOauthError(exchangeError.message);
            return;
          }
          window.history.replaceState({}, document.title, '/login');
          window.location.href = '/';
        })
        .catch((err) => {
          setOauthError(err instanceof Error ? err.message : 'Authentication failed.');
        });
      return;
    }

    if (error) {
      if (description) {
        setOauthError(decodeURIComponent(description));
        return;
      }
      if (error === 'access_denied') {
        setOauthError('Access denied. Check Google OAuth test users.');
        return;
      }
      setOauthError('Authentication failed. Please try again.');
    }
  }, [supabase]);
  const displayError = errorMessage ?? oauthError;

  async function handleGoogleSignIn() {
    setStatus('loading');
    setErrorMessage(null);

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      setStatus('error');
      setErrorMessage(error.message);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!ALLOWED_EMAILS.includes(email.toLowerCase().trim())) {
      setStatus('error');
      setErrorMessage('Access restricted. This app is invite-only.');
      return;
    }

    setStatus('loading');
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      setStatus('error');
      setErrorMessage(error.message);
      return;
    }

    setStatus('sent');
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-soft border border-gray-200 p-8">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="text-sm text-gray-600 mt-2">
          Access is invite-only. Sign in with Google or request a magic link.
        </p>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="mt-6 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50"
          disabled={status === 'loading'}
        >
          Continue with Google
        </button>

        <div className="my-6 border-t border-gray-200" />

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Email address
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-purple"
              placeholder="you@example.com"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-lg bg-brand-purple px-4 py-2 text-white font-medium"
            disabled={status === 'loading'}
          >
            Email me a magic link
          </button>
        </form>

        {status === 'sent' && (
          <p className="mt-4 text-sm text-green-700">Check your inbox for a sign-in link.</p>
        )}

        {displayError && (
          <p className="mt-4 text-sm text-red-600">{displayError}</p>
        )}
      </div>
    </main>
  );
}
