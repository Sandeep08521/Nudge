-- Nudge database schema. Run this once in Supabase: SQL Editor -> New query -> paste -> Run.

create table if not exists public.subscriptions (
  id              bigint generated always as identity primary key,
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name            text not null check (char_length(name) between 1 and 80),
  category        text not null default 'Other' check (char_length(category) <= 40),
  amount          numeric(12,2) not null check (amount > 0),
  cycle           text not null check (cycle in ('monthly', 'quarterly', 'half-yearly', 'yearly')),
  renewal         date not null,
  status          text not null check (status in ('active', 'trial', 'cancelled', 'paused')),
  initial         text not null default '' check (char_length(initial) <= 4),
  brand           text not null default 'custom' check (char_length(brand) <= 40),
  payment_method  text not null default 'Credit / Debit Card' check (char_length(payment_method) <= 60),
  usage_frequency text not null default 'weekly' check (usage_frequency in ('daily', 'weekly', 'monthly', 'rarely', 'never')),
  is_shared       boolean not null default false,
  my_share        numeric(12,2),
  notes           text,
  currency        text not null default 'USD' check (char_length(currency) <= 5),
  paused_until    date,
  created_at      timestamptz not null default now()
);

create index if not exists subscriptions_user_created_idx
  on public.subscriptions (user_id, created_at desc);

-- Row Level Security for Subscriptions: each user can only touch their own rows
alter table public.subscriptions enable row level security;

drop policy if exists "read own subscriptions"   on public.subscriptions;
drop policy if exists "insert own subscriptions" on public.subscriptions;
drop policy if exists "update own subscriptions" on public.subscriptions;
drop policy if exists "delete own subscriptions" on public.subscriptions;

create policy "read own subscriptions" on public.subscriptions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "insert own subscriptions" on public.subscriptions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "update own subscriptions" on public.subscriptions
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own subscriptions" on public.subscriptions
  for delete to authenticated using ((select auth.uid()) = user_id);

-- User Profiles: Syncs currency, monthly budget cap, and notification preferences across devices
create table if not exists public.profiles (
  id              uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  currency_symbol text not null default '$' check (char_length(currency_symbol) <= 5),
  monthly_budget  numeric(12,2),
  lead_days       integer not null default 3 check (lead_days between 1 and 30),
  updated_at      timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "manage own profile" on public.profiles;
create policy "manage own profile" on public.profiles
  for all to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- =========================================================================
-- MIGRATIONS FOR EXISTING SUPABASE DATABASES (Run in SQL Editor if upgrading):
-- =========================================================================
-- alter table public.subscriptions drop constraint if exists subscriptions_status_check;
-- alter table public.subscriptions add constraint subscriptions_status_check check (status in ('active', 'trial', 'cancelled', 'paused'));
-- alter table public.subscriptions add column if not exists paused_until date;
-- alter table public.subscriptions add column if not exists payment_method text not null default 'Credit / Debit Card';
-- alter table public.subscriptions add column if not exists usage_frequency text not null default 'weekly';
-- alter table public.subscriptions add column if not exists is_shared boolean not null default false;
-- alter table public.subscriptions add column if not exists my_share numeric(12,2);
-- alter table public.subscriptions add column if not exists notes text;
-- alter table public.subscriptions add column if not exists currency text not null default 'USD';

