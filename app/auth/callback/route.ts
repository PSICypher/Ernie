import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/database.types';
import type { CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const next = searchParams.get('next') ?? '/';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cookieHeader = request.headers.get('cookie') ?? '';
  let hasCodeVerifierCookie = false;
  if (supabaseUrl) {
    try {
      const hostname = new URL(supabaseUrl).hostname.split('.')[0];
      const prefix = `sb-${hostname}-auth-token-code-verifier`;
      hasCodeVerifierCookie = cookieHeader.split(';').some((cookie) =>
        cookie.trim().startsWith(prefix)
      );
    } catch {
      hasCodeVerifierCookie = false;
    }
  }

  console.log('OAuth callback hit', {
    hasCode: Boolean(code),
    hasError: Boolean(error),
    error: error ?? null,
    hasCodeVerifierCookie
  });

  if (error) {
    console.error('OAuth callback error', { error, errorDescription });
    const params = new URLSearchParams();
    params.set('error', error);
    if (errorDescription) {
      params.set('error_description', errorDescription);
    }
    return NextResponse.redirect(`${origin}/login?${params.toString()}`);
  }

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options });
          }
        }
      }
    ) as unknown as SupabaseClient<any>;

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('OAuth code exchange failed', { message: exchangeError.message });
      const params = new URLSearchParams();
      params.set('error', 'auth');
      params.set('error_description', exchangeError.message);
      if (code) {
        params.set('code', code);
      }
      return NextResponse.redirect(`${origin}/login?${params.toString()}`);
    }

    if (!exchangeError) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user?.email) {
        const admin = createClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { autoRefreshToken: false, persistSession: false } }
        ) as unknown as SupabaseClient<any>;

        await admin
          .from('trip_shares')
          .update({
            shared_with_user_id: user.id,
            accepted_at: new Date().toISOString()
          })
          .eq('shared_with_email', user.email.toLowerCase())
          .is('shared_with_user_id', null);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
