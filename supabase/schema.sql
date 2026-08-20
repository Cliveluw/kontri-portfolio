-- Run this in Supabase SQL Editor.
-- Storage bucket: create a public bucket named "photos" in Storage.

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  title text,
  location text,
  description text,
  image_url text not null,
  storage_path text not null,
  width integer,
  height integer,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.photos enable row level security;

create policy "Public can view published photos"
on public.photos for select
using (published = true);

create policy "Authenticated users can manage photos"
on public.photos for all
to authenticated
using (true)
with check (true);

-- Storage policies assume the "photos" bucket exists.
create policy "Public can view photo objects"
on storage.objects for select
using (bucket_id = 'photos');

create policy "Authenticated users can upload photo objects"
on storage.objects for insert
to authenticated
with check (bucket_id = 'photos');

create policy "Authenticated users can delete photo objects"
on storage.objects for delete
to authenticated
using (bucket_id = 'photos');
