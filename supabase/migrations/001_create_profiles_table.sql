-- Migration: create profiles table for storing user profiles separately from auth.users
-- Run this in your Supabase SQL editor or include in your migration pipeline.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  -- Public key (JWK or other) associated with the user's browser-generated wallet. Stored as JSON to allow flexible formats.
  public_key jsonb,
  -- OPTIONAL: encrypted_private_key allows storing an encrypted backup (strongly discouraged unless encrypted with a user-supplied password)
  -- If you prefer not to store any private material server-side, leave this column null and require users to manage backups client-side.
  encrypted_private_key jsonb,
  email text,
  phone text,
  notifications jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trigger to keep updated_at current
create or replace function public.profiles_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at
  before update on public.profiles
  for each row execute procedure public.profiles_updated_at();

-- Recommended RLS policy: allow users to select/update/insert their own profile only.
-- Enable RLS and policies after reviewing them for your security needs.

-- enable row level security
-- alter table public.profiles enable row level security;

-- example policy: allow authenticated users to manage their own profile
-- create policy "profiles_self_access" on public.profiles
--   for all using ( auth.uid() = id ) with check ( auth.uid() = id );

-- Indexes
create index if not exists idx_profiles_email on public.profiles(email);
-- Consider adding a unique index on email if emails are guaranteed unique in your system:
-- create unique index if not exists uq_profiles_email on public.profiles(email);
