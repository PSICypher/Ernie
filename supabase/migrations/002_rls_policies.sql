-- RLS helper functions
create or replace function public.is_trip_owner(p_trip_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.trips
    where id = p_trip_id and user_id = p_user_id
  );
$$;

create or replace function public.is_trip_shared_with_user(p_trip_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.trip_shares
    where trip_id = p_trip_id and shared_with_user_id = p_user_id
  );
$$;

-- Enable RLS
alter table public.trips enable row level security;
alter table public.plan_versions enable row level security;
alter table public.itinerary_days enable row level security;
alter table public.accommodations enable row level security;
alter table public.transport enable row level security;
alter table public.costs enable row level security;
alter table public.checklist_items enable row level security;
alter table public.activities enable row level security;
alter table public.decisions enable row level security;
alter table public.travellers enable row level security;
alter table public.travel_insurance enable row level security;
alter table public.documents enable row level security;
alter table public.packing_items enable row level security;
alter table public.comments enable row level security;
alter table public.trip_shares enable row level security;
alter table public.ai_research_cache enable row level security;
alter table public.push_subscriptions enable row level security;

-- Trips policies
create policy trips_select on public.trips
  for select using (
    auth.uid() = user_id
    or public.is_trip_shared_with_user(id, auth.uid())
  );

create policy trips_insert on public.trips
  for insert with check (auth.uid() = user_id);

create policy trips_update on public.trips
  for update using (auth.uid() = user_id);

create policy trips_delete on public.trips
  for delete using (auth.uid() = user_id);

-- Plan versions policies
create policy plan_versions_all on public.plan_versions
  for all using (
    public.is_trip_owner(trip_id, auth.uid())
    or public.is_trip_shared_with_user(trip_id, auth.uid())
  )
  with check (
    public.is_trip_owner(trip_id, auth.uid())
    or public.is_trip_shared_with_user(trip_id, auth.uid())
  );

-- Itinerary days policies
create policy itinerary_days_all on public.itinerary_days
  for all using (
    exists (
      select 1 from public.plan_versions pv
      where pv.id = itinerary_days.plan_version_id
        and (public.is_trip_owner(pv.trip_id, auth.uid())
          or public.is_trip_shared_with_user(pv.trip_id, auth.uid()))
    )
  )
  with check (
    exists (
      select 1 from public.plan_versions pv
      where pv.id = itinerary_days.plan_version_id
        and (public.is_trip_owner(pv.trip_id, auth.uid())
          or public.is_trip_shared_with_user(pv.trip_id, auth.uid()))
    )
  );

-- Accommodations policies
create policy accommodations_all on public.accommodations
  for all using (
    exists (
      select 1 from public.plan_versions pv
      where pv.id = accommodations.plan_version_id
        and (public.is_trip_owner(pv.trip_id, auth.uid())
          or public.is_trip_shared_with_user(pv.trip_id, auth.uid()))
    )
  )
  with check (
    exists (
      select 1 from public.plan_versions pv
      where pv.id = accommodations.plan_version_id
        and (public.is_trip_owner(pv.trip_id, auth.uid())
          or public.is_trip_shared_with_user(pv.trip_id, auth.uid()))
    )
  );

-- Transport policies
create policy transport_all on public.transport
  for all using (
    exists (
      select 1 from public.plan_versions pv
      where pv.id = transport.plan_version_id
        and (public.is_trip_owner(pv.trip_id, auth.uid())
          or public.is_trip_shared_with_user(pv.trip_id, auth.uid()))
    )
  )
  with check (
    exists (
      select 1 from public.plan_versions pv
      where pv.id = transport.plan_version_id
        and (public.is_trip_owner(pv.trip_id, auth.uid())
          or public.is_trip_shared_with_user(pv.trip_id, auth.uid()))
    )
  );

-- Costs policies
create policy costs_all on public.costs
  for all using (
    exists (
      select 1 from public.plan_versions pv
      where pv.id = costs.plan_version_id
        and (public.is_trip_owner(pv.trip_id, auth.uid())
          or public.is_trip_shared_with_user(pv.trip_id, auth.uid()))
    )
  )
  with check (
    exists (
      select 1 from public.plan_versions pv
      where pv.id = costs.plan_version_id
        and (public.is_trip_owner(pv.trip_id, auth.uid())
          or public.is_trip_shared_with_user(pv.trip_id, auth.uid()))
    )
  );

-- Checklist policies
create policy checklist_items_all on public.checklist_items
  for all using (
    exists (
      select 1 from public.plan_versions pv
      where pv.id = checklist_items.plan_version_id
        and (public.is_trip_owner(pv.trip_id, auth.uid())
          or public.is_trip_shared_with_user(pv.trip_id, auth.uid()))
    )
  )
  with check (
    exists (
      select 1 from public.plan_versions pv
      where pv.id = checklist_items.plan_version_id
        and (public.is_trip_owner(pv.trip_id, auth.uid())
          or public.is_trip_shared_with_user(pv.trip_id, auth.uid()))
    )
  );

-- Activities policies
create policy activities_all on public.activities
  for all using (
    exists (
      select 1 from public.plan_versions pv
      where pv.id = activities.plan_version_id
        and (public.is_trip_owner(pv.trip_id, auth.uid())
          or public.is_trip_shared_with_user(pv.trip_id, auth.uid()))
    )
  )
  with check (
    exists (
      select 1 from public.plan_versions pv
      where pv.id = activities.plan_version_id
        and (public.is_trip_owner(pv.trip_id, auth.uid())
          or public.is_trip_shared_with_user(pv.trip_id, auth.uid()))
    )
  );

-- Decisions policies
create policy decisions_all on public.decisions
  for all using (
    public.is_trip_owner(trip_id, auth.uid())
    or public.is_trip_shared_with_user(trip_id, auth.uid())
  )
  with check (
    public.is_trip_owner(trip_id, auth.uid())
    or public.is_trip_shared_with_user(trip_id, auth.uid())
  );

-- Travellers policies
create policy travellers_all on public.travellers
  for all using (
    public.is_trip_owner(trip_id, auth.uid())
    or public.is_trip_shared_with_user(trip_id, auth.uid())
  )
  with check (
    public.is_trip_owner(trip_id, auth.uid())
    or public.is_trip_shared_with_user(trip_id, auth.uid())
  );

-- Travel insurance policies
create policy travel_insurance_all on public.travel_insurance
  for all using (
    public.is_trip_owner(trip_id, auth.uid())
    or public.is_trip_shared_with_user(trip_id, auth.uid())
  )
  with check (
    public.is_trip_owner(trip_id, auth.uid())
    or public.is_trip_shared_with_user(trip_id, auth.uid())
  );

-- Documents policies
create policy documents_all on public.documents
  for all using (
    public.is_trip_owner(trip_id, auth.uid())
    or public.is_trip_shared_with_user(trip_id, auth.uid())
  )
  with check (
    (public.is_trip_owner(trip_id, auth.uid())
      or public.is_trip_shared_with_user(trip_id, auth.uid()))
    and uploaded_by = auth.uid()
  );

-- Packing items policies
create policy packing_items_all on public.packing_items
  for all using (
    public.is_trip_owner(trip_id, auth.uid())
    or public.is_trip_shared_with_user(trip_id, auth.uid())
  )
  with check (
    public.is_trip_owner(trip_id, auth.uid())
    or public.is_trip_shared_with_user(trip_id, auth.uid())
  );

-- Comments policies
create policy comments_all on public.comments
  for all using (
    public.is_trip_owner(trip_id, auth.uid())
    or public.is_trip_shared_with_user(trip_id, auth.uid())
  )
  with check (
    (public.is_trip_owner(trip_id, auth.uid())
      or public.is_trip_shared_with_user(trip_id, auth.uid()))
    and user_id = auth.uid()
  );

-- Trip shares policies
create policy trip_shares_owner on public.trip_shares
  for all using (public.is_trip_owner(trip_id, auth.uid()))
  with check (public.is_trip_owner(trip_id, auth.uid()));

create policy trip_shares_viewer on public.trip_shares
  for select using (shared_with_user_id = auth.uid());

-- AI research cache policies
create policy ai_research_cache_all on public.ai_research_cache
  for all using (
    trip_id is not null
    and (public.is_trip_owner(trip_id, auth.uid())
      or public.is_trip_shared_with_user(trip_id, auth.uid()))
  )
  with check (
    trip_id is not null
    and (public.is_trip_owner(trip_id, auth.uid())
      or public.is_trip_shared_with_user(trip_id, auth.uid()))
  );

-- Push subscriptions policies
create policy push_subscriptions_owner on public.push_subscriptions
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
