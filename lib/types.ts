export interface Trip {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  destination?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  cover_image_url?: string | null;
  is_archived?: boolean | null;
  public_share_token?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface PlanVersion {
  id: string;
  trip_id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  total_cost?: number | null;
  currency?: string | null;
  color?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ItineraryDay {
  id: string;
  plan_version_id: string;
  day_number: number;
  date?: string | null;
  location: string;
  location_coordinates?: { lat: number; lng: number } | null;
  icon?: string | null;
  color?: string | null;
  activities?: any[] | null;
  notes?: string | null;
  drive_time?: string | null;
  drive_distance?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Accommodation {
  id: string;
  plan_version_id: string;
  name: string;
  type?: string | null;
  location?: string | null;
  address?: string | null;
  coordinates?: { lat: number; lng: number } | null;
  check_in?: string | null;
  check_out?: string | null;
  nights?: number | null;
  cost?: number | null;
  currency?: string | null;
  booking_reference?: string | null;
  booking_url?: string | null;
  cancellation_policy?: string | null;
  amenities?: string[] | null;
  notes?: string | null;
  color?: string | null;
  is_confirmed?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Transport {
  id: string;
  plan_version_id: string;
  type: string;
  provider?: string | null;
  vehicle?: string | null;
  reference_number?: string | null;
  pickup_location?: string | null;
  pickup_date?: string | null;
  pickup_time?: string | null;
  dropoff_location?: string | null;
  dropoff_date?: string | null;
  dropoff_time?: string | null;
  cost?: number | null;
  currency?: string | null;
  includes?: string[] | null;
  booking_url?: string | null;
  notes?: string | null;
  is_confirmed?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Cost {
  id: string;
  plan_version_id: string;
  itinerary_day_id?: string | null;
  category: string;
  item: string;
  amount: number;
  currency?: string | null;
  is_paid?: boolean | null;
  is_estimated?: boolean | null;
  notes?: string | null;
  created_at?: string | null;
}

export interface ChecklistItem {
  id: string;
  plan_version_id: string;
  category: string;
  name: string;
  description?: string | null;
  source_type?: string | null;
  source_id?: string | null;
  booking_status: string;
  booking_reference?: string | null;
  booking_url?: string | null;
  total_cost?: number | null;
  deposit_amount?: number | null;
  amount_paid?: number | null;
  is_fully_paid?: boolean | null;
  payment_type?: string | null;
  payment_due_date?: string | null;
  payment_due_context?: string | null;
  notes?: string | null;
  sort_order?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Decision {
  id: string;
  trip_id: string;
  plan_version_id?: string | null;
  title: string;
  description?: string | null;
  options?: any[] | null;
  selected_option?: number | null;
  due_date?: string | null;
  priority?: string | null;
  status?: string | null;
  decided_at?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Activity {
  id: string;
  plan_version_id: string;
  itinerary_day_id: string;
  name: string;
  description?: string | null;
  time_start?: string | null;
  time_end?: string | null;
  location?: string | null;
  cost?: number | null;
  currency?: string | null;
  booking_status?: string | null;
  booking_reference?: string | null;
  sort_order?: number | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}
