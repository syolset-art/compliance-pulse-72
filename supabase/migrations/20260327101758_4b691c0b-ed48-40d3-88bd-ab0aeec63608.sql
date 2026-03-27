
create table public.work_area_documents (
  id uuid primary key default gen_random_uuid(),
  work_area_id uuid not null references public.work_areas(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_size integer,
  document_type text default 'other',
  linked_asset_id uuid references public.assets(id) on delete set null,
  notes text,
  generated boolean default false,
  created_at timestamptz default now()
);

alter table public.work_area_documents enable row level security;

create policy "Allow all access to work_area_documents"
  on public.work_area_documents
  for all
  using (true)
  with check (true);
