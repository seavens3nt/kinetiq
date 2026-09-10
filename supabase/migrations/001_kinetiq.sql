create table if not exists public.projects (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Untitled Kinetiq Project',
  width integer not null,
  height integer not null,
  fps integer not null default 30,
  duration numeric not null default 6,
  project_data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null references public.projects(id) on delete cascade,
  type text not null check (type in ('image','video','audio')),
  file_name text not null,
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;
alter table public.assets enable row level security;

create policy "Users can read own projects"
on public.projects for select
using (auth.uid() = user_id);

create policy "Users can insert own projects"
on public.projects for insert
with check (auth.uid() = user_id);

create policy "Users can update own projects"
on public.projects for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own projects"
on public.projects for delete
using (auth.uid() = user_id);

create policy "Users can read own assets"
on public.assets for select
using (auth.uid() = user_id);

create policy "Users can insert own assets"
on public.assets for insert
with check (auth.uid() = user_id);

create policy "Users can delete own assets"
on public.assets for delete
using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('project-assets', 'project-assets', true)
on conflict (id) do update set public = excluded.public;

create policy "Users can upload own project assets"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'project-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update own project assets"
on storage.objects for update to authenticated
using (
  bucket_id = 'project-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'project-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete own project assets"
on storage.objects for delete to authenticated
using (
  bucket_id = 'project-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);
