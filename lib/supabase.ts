import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export type { Database } from './database.types';

export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) as unknown as SupabaseClient<any>;
}

export type ChecklistItem = Database['public']['Tables']['checklist_items']['Row'];
export type Traveller = Database['public']['Tables']['travellers']['Row'];
export type TravelInsurance = Database['public']['Tables']['travel_insurance']['Row'];
export type Document = Database['public']['Tables']['documents']['Row'];
export type PackingItem = Database['public']['Tables']['packing_items']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];
export type Activity = Database['public']['Tables']['activities']['Row'];
