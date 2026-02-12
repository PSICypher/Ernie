import { createRouteHandlerClient } from '@/lib/supabase-server';

export async function getCachedResult({
  tripId,
  query,
  queryType
}: {
  tripId: string;
  query: string;
  queryType: string;
}) {
  const supabase = createRouteHandlerClient();
  const { data } = await supabase
    .from('ai_research_cache')
    .select('*')
    .eq('trip_id', tripId)
    .eq('query', query)
    .eq('query_type', queryType)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  return data || null;
}

export async function setCachedResult({
  tripId,
  query,
  queryType,
  results,
  expiresAt,
  model,
  tokensUsed
}: {
  tripId: string;
  query: string;
  queryType: string;
  results: any;
  expiresAt: string;
  model?: string | null;
  tokensUsed?: number | null;
}) {
  const supabase = createRouteHandlerClient();
  await supabase.from('ai_research_cache').insert({
    trip_id: tripId,
    query,
    query_type: queryType,
    results,
    model,
    tokens_used: tokensUsed,
    expires_at: expiresAt
  });
}
