-- CampusQuest profiles (reference SQL)
-- Preferred path: `yarn prisma:push` from prisma/schema.prisma
-- You can still paste this into the Supabase SQL editor if needed.

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

-- Optional: enable RLS. Server uses DATABASE_URL (Postgres role), not the anon key.
alter table public.profiles enable row level security;
