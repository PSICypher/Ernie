-- Storage bucket for trip documents
insert into storage.buckets (id, name, public)
values ('trip-documents', 'trip-documents', false)
on conflict (id) do nothing;

-- Storage policies
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can upload documents'
  ) then
    execute $p$
      create policy "Users can upload documents" on storage.objects
      for insert to authenticated
      with check (bucket_id = 'trip-documents')
    $p$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can read own documents'
  ) then
    execute $p$
      create policy "Users can read own documents" on storage.objects
      for select to authenticated
      using (bucket_id = 'trip-documents')
    $p$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can delete own documents'
  ) then
    execute $p$
      create policy "Users can delete own documents" on storage.objects
      for delete to authenticated
      using (bucket_id = 'trip-documents')
    $p$;
  end if;
end $$;
