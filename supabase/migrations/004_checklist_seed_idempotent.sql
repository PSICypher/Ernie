-- Make "Seed from plan" idempotent by preventing duplicate linked checklist items.
-- Manual checklist items have NULL source_id/source_type and are unaffected.

-- 1) Remove any existing duplicates for linked items (keep the most recently updated).
with ranked as (
  select
    id,
    row_number() over (
      partition by plan_version_id, source_type, source_id
      order by updated_at desc nulls last, created_at desc nulls last, id asc
    ) as rn
  from public.checklist_items
  where source_id is not null and source_type is not null
)
delete from public.checklist_items
where id in (select id from ranked where rn > 1);

-- 2) Enforce uniqueness for linked items.
-- Note: UNIQUE indexes allow multiple NULLs, so manual items remain allowed.
create unique index if not exists uniq_checklist_items_source
  on public.checklist_items(plan_version_id, source_type, source_id);

