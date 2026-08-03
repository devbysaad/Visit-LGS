-- CampusQuest profiles (run in Supabase SQL editor)
-- Clerk user id is the external key (text).

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_id text not null unique,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (email);

-- Enable RLS. No policies for anon/authenticated → clients cannot read/write.
-- Our Node server uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS.
alter table public.profiles enable row level security;
