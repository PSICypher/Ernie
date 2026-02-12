-- Initial schema for Holiday Planner App

create extension if not exists "pgcrypto";

create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trips
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  destination text,
  start_date date,
  end_date date,
  cover_image_url text,
  is_archived boolean default false,
  public_share_token text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_trips_user_id on public.trips(user_id);
create index if not exists idx_trips_dates on public.trips(start_date, end_date);
create index if not exists idx_trips_public_share_token on public.trips(public_share_token) where public_share_token is not null;

create trigger trips_updated_at
before update on public.trips
for each row execute function public.update_updated_at();

-- Plan versions
create table if not exists public.plan_versions (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null,
  description text,
  is_active boolean default false,
  total_cost decimal(12,2) default 0,
  currency text default 'GBP',
  color text default '#3b82f6',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_plan_versions_trip_id on public.plan_versions(trip_id);
create unique index if not exists idx_one_active_plan on public.plan_versions(trip_id) where is_active = true;

create trigger plan_versions_updated_at
before update on public.plan_versions
for each row execute function public.update_updated_at();

-- Itinerary days
create table if not exists public.itinerary_days (
  id uuid primary key default gen_random_uuid(),
  plan_version_id uuid not null references public.plan_versions(id) on delete cascade,
  day_number integer not null,
  date date,
  location text not null,
  location_coordinates jsonb,
  icon text default '📍',
  color text default '#6b7280',
  activities jsonb default '[]',
  notes text,
  drive_time text,
  drive_distance text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(plan_version_id, day_number)
);

create index if not exists idx_itinerary_days_plan on public.itinerary_days(plan_version_id);
create index if not exists idx_itinerary_days_date on public.itinerary_days(date);

create trigger itinerary_days_updated_at
before update on public.itinerary_days
for each row execute function public.update_updated_at();

-- Accommodations
create table if not exists public.accommodations (
  id uuid primary key default gen_random_uuid(),
  plan_version_id uuid not null references public.plan_versions(id) on delete cascade,
  name text not null,
  type text default 'hotel',
  location text,
  address text,
  coordinates jsonb,
  check_in date not null,
  check_out date not null,
  nights integer generated always as (check_out - check_in) stored,
  cost decimal(10,2),
  currency text default 'GBP',
  booking_reference text,
  booking_url text,
  cancellation_policy text,
  amenities jsonb default '[]',
  notes text,
  color text default '#4ECDC4',
  is_confirmed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_accommodations_plan on public.accommodations(plan_version_id);
create index if not exists idx_accommodations_dates on public.accommodations(check_in, check_out);

create trigger accommodations_updated_at
before update on public.accommodations
for each row execute function public.update_updated_at();

-- Transport
create table if not exists public.transport (
  id uuid primary key default gen_random_uuid(),
  plan_version_id uuid not null references public.plan_versions(id) on delete cascade,
  type text not null,
  provider text,
  vehicle text,
  reference_number text,
  pickup_location text,
  pickup_date date,
  pickup_time time,
  dropoff_location text,
  dropoff_date date,
  dropoff_time time,
  cost decimal(10,2),
  currency text default 'GBP',
  includes jsonb default '[]',
  booking_url text,
  notes text,
  is_confirmed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_transport_plan on public.transport(plan_version_id);

create trigger transport_updated_at
before update on public.transport
for each row execute function public.update_updated_at();

-- Costs
create table if not exists public.costs (
  id uuid primary key default gen_random_uuid(),
  plan_version_id uuid not null references public.plan_versions(id) on delete cascade,
  itinerary_day_id uuid references public.itinerary_days(id) on delete set null,
  category text not null,
  item text not null,
  amount decimal(12,2) not null,
  currency text default 'GBP',
  is_paid boolean default false,
  is_estimated boolean default true,
  notes text,
  created_at timestamptz default now()
);

create index if not exists idx_costs_plan on public.costs(plan_version_id);
create index if not exists idx_costs_category on public.costs(category);

-- Checklist items
create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  plan_version_id uuid not null references public.plan_versions(id) on delete cascade,
  category text not null default 'other'
    check (category in ('accommodation', 'transport', 'activity', 'tickets', 'other')),
  name text not null,
  description text,
  source_type text,
  source_id uuid,
  booking_status text not null default 'not_booked'
    check (booking_status in ('not_booked', 'booked', 'confirmed')),
  booking_reference text,
  booking_url text,
  total_cost numeric(10,2) default 0,
  deposit_amount numeric(10,2) default 0,
  amount_paid numeric(10,2) default 0,
  is_fully_paid boolean not null default false,
  payment_type text not null default 'full'
    check (payment_type in ('full', 'deposit', 'on_arrival', 'free')),
  payment_due_date date,
  payment_due_context text default 'flexible'
    check (payment_due_context in ('before_trip', 'on_arrival', 'flexible')),
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_checklist_items_plan_version on public.checklist_items(plan_version_id);
create index if not exists idx_checklist_items_source on public.checklist_items(plan_version_id, source_type, source_id);

create trigger checklist_items_updated_at
before update on public.checklist_items
for each row execute function public.update_updated_at();

-- Activities
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  plan_version_id uuid not null references public.plan_versions(id) on delete cascade,
  itinerary_day_id uuid not null references public.itinerary_days(id) on delete cascade,
  name text not null,
  description text,
  time_start text,
  time_end text,
  location text,
  cost numeric(12,2),
  currency text default 'GBP',
  booking_status text default 'not_booked'
    check (booking_status in ('not_booked', 'booked', 'confirmed', 'cancelled')),
  booking_reference text,
  sort_order integer default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_activities_day on public.activities(itinerary_day_id, sort_order);

create trigger activities_updated_at
before update on public.activities
for each row execute function public.update_updated_at();

-- Decisions
create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  plan_version_id uuid references public.plan_versions(id) on delete set null,
  title text not null,
  description text,
  options jsonb default '[]',
  selected_option integer,
  due_date date,
  priority text default 'medium',
  status text default 'pending',
  decided_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_decisions_trip on public.decisions(trip_id);
create index if not exists idx_decisions_status on public.decisions(status);

create trigger decisions_updated_at
before update on public.decisions
for each row execute function public.update_updated_at();

-- Travellers
create table if not exists public.travellers (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null,
  passport_number text,
  passport_expiry date,
  nationality text,
  esta_status text default 'not_required'
    check (esta_status in ('not_required', 'pending', 'approved', 'expired')),
  dietary text,
  medical_notes text,
  is_child boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_travellers_trip_id on public.travellers(trip_id);

create trigger travellers_updated_at
before update on public.travellers
for each row execute function public.update_updated_at();

-- Travel insurance
create table if not exists public.travel_insurance (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  provider text not null,
  policy_number text,
  emergency_phone text,
  coverage_start date,
  coverage_end date,
  document_url text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_travel_insurance_trip_id on public.travel_insurance(trip_id);

create trigger travel_insurance_updated_at
before update on public.travel_insurance
for each row execute function public.update_updated_at();

-- Documents
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  plan_version_id uuid references public.plan_versions(id) on delete set null,
  linked_item_type text,
  linked_item_id uuid,
  file_name text not null,
  file_url text not null,
  file_type text,
  uploaded_by uuid references auth.users(id) on delete set null,
  uploaded_at timestamptz default now(),
  notes text
);

create index if not exists idx_documents_trip_id on public.documents(trip_id);

-- Packing items
create table if not exists public.packing_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  category text not null default 'Misc',
  name text not null,
  quantity integer not null default 1,
  packed boolean default false,
  assigned_to text,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create index if not exists idx_packing_items_trip_id on public.packing_items(trip_id);

-- Comments
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  item_type text not null,
  item_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  created_at timestamptz default now()
);

create index if not exists idx_comments_item on public.comments(item_type, item_id);

-- Trip shares
create table if not exists public.trip_shares (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  shared_with_email text not null,
  shared_with_user_id uuid references auth.users(id) on delete cascade,
  permission text not null default 'view',
  invited_at timestamptz default now(),
  accepted_at timestamptz,
  created_at timestamptz default now(),
  unique(trip_id, shared_with_email)
);

create index if not exists idx_trip_shares_email on public.trip_shares(shared_with_email);
create index if not exists idx_trip_shares_user on public.trip_shares(shared_with_user_id);
create index if not exists idx_trip_shares_trip_id on public.trip_shares(trip_id);

-- Push subscriptions
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now(),
  unique(user_id, endpoint)
);

create index if not exists idx_push_subscriptions_user on public.push_subscriptions(user_id);

-- AI research cache
create table if not exists public.ai_research_cache (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references public.trips(id) on delete cascade,
  query text not null,
  query_type text,
  results jsonb not null,
  model text,
  tokens_used integer,
  expires_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_ai_cache_trip on public.ai_research_cache(trip_id);
create index if not exists idx_ai_cache_query on public.ai_research_cache(query);
create index if not exists idx_ai_cache_lookup on public.ai_research_cache(trip_id, query, query_type);
create index if not exists idx_ai_cache_expiry on public.ai_research_cache(expires_at);

-- Cost total trigger
create or replace function public.update_plan_total()
returns trigger as $$
begin
  update public.plan_versions
  set total_cost = (
    select coalesce(sum(amount), 0)
    from public.costs
    where plan_version_id = coalesce(new.plan_version_id, old.plan_version_id)
  ),
  updated_at = now()
  where id = coalesce(new.plan_version_id, old.plan_version_id);

  return coalesce(new, old);
end;
$$ language plpgsql;

create trigger costs_update_total
after insert or update or delete on public.costs
for each row execute function public.update_plan_total();
