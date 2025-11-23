-- Migration: create wallets and blocks tables
-- Run this in your Supabase SQL editor or include in your migration pipeline.

create table if not exists public.wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  public_key jsonb,
  encrypted_private_key jsonb,
  verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.wallets_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.wallets;
create trigger set_updated_at
  before update on public.wallets
  for each row execute procedure public.wallets_updated_at();

-- Blocks table for simple on-chain storage
create table if not exists public.blocks (
  id bigserial primary key,
  data jsonb,
  previous_hash text,
  hash text,
  created_at timestamptz default now()
);

create or replace function public.blocks_created_at()
returns trigger language plpgsql as $$
begin
  new.created_at = now();
  return new;
end;
$$;

drop trigger if exists set_created_at on public.blocks;
create trigger set_created_at
  before insert on public.blocks
  for each row execute procedure public.blocks_created_at();

-- Add a top-level user_id column to blocks so transactions can be easily
-- scoped to a user and secured with RLS policies. If you already have data
-- in `data->>user_id`, existing rows will continue to work; new inserts
-- should include the top-level `user_id` as well.
alter table public.blocks
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Example RLS policy for blocks: allow users to see only their own blocks
-- Uncomment and adapt as needed in Supabase SQL editor.
-- alter table public.blocks enable row level security;
-- create policy "blocks_user_read" on public.blocks
--   for select using ( auth.uid() = user_id );

-- Example RLS policy (commented) - enable and adapt for your project
-- alter table public.wallets enable row level security;
-- create policy "wallets_self_access" on public.wallets
--   for all using ( auth.uid() = user_id ) with check ( auth.uid() = user_id );

-- alter table public.blocks enable row level security;
-- create policy "blocks_read" on public.blocks
--   for select using ( true );
