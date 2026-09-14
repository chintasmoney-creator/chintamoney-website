-- ChintasMoney — Supabase database schema
-- Run this ONCE in your Supabase project: Dashboard → SQL Editor → New query → paste → Run.
-- It creates one table that holds each user's full app state as JSON,
-- protected so a user can only read/write their OWN row.

create table if not exists public.user_state (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_state enable row level security;

-- Each signed-in user may read their own row.
create policy "read own state"
  on public.user_state for select
  using ( auth.uid() = user_id );

-- Each signed-in user may create their own row.
create policy "insert own state"
  on public.user_state for insert
  with check ( auth.uid() = user_id );

-- Each signed-in user may update their own row.
create policy "update own state"
  on public.user_state for update
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

-- (Optional) a table to log verified payments if you add the webhook later.
create table if not exists public.payments (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users(id) on delete set null,
  plan        text,
  amount      integer,
  razorpay_payment_id text,
  created_at  timestamptz not null default now()
);
alter table public.payments enable row level security;
create policy "read own payments" on public.payments for select using ( auth.uid() = user_id );
