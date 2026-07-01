-- PersonalDiet / NutriAI — Subscription Schema Migration
-- Execute this in the Supabase Dashboard SQL Editor (new query).
-- Safe to run more than once (idempotent).

-- =============================================================================
-- 9. SUBSCRIPTION COLUMNS (user_profiles)
-- =============================================================================
alter table public.user_profiles
  add column if not exists subscription_status text default 'free',
  add column if not exists subscription_plan text, -- 'monthly' | 'annual'
  add column if not exists subscription_expires_at timestamptz,
  add column if not exists mercado_pago_preference_id text,
  add column if not exists mercado_pago_payment_id text,
  add column if not exists trial_ends_at timestamptz;

-- =============================================================================
-- 10. PAYMENTS (audit / history)
-- =============================================================================
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  mercado_pago_payment_id text,
  mercado_pago_preference_id text,
  amount decimal(10,2),
  currency text default 'BRL',
  status text, -- 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded'
  plan text, -- 'monthly' | 'annual'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Unique constraint: evita duplicatas de pagamento por MP payment id.
-- Postgres nao aceita "add constraint if not exists", entao usamos DROP + ADD idempotente.
alter table public.payments
  drop constraint if exists payments_mercado_pago_payment_id_key;
alter table public.payments
  add constraint payments_mercado_pago_payment_id_key unique (mercado_pago_payment_id);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) — PAYMENTS
-- =============================================================================
alter table public.payments enable row level security;

-- IMPORTANTE: Postgres NAO suporta "create policy if not exists".
-- Por isso derrubamos a policy antes de recria-la (torna o script re-executavel).
drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own"
  on public.payments for select
  using (auth.uid() = user_id);

drop policy if exists "payments_insert_own" on public.payments;
create policy "payments_insert_own"
  on public.payments for insert
  with check (auth.uid() = user_id);

drop policy if exists "payments_update_own" on public.payments;
create policy "payments_update_own"
  on public.payments for update
  using (auth.uid() = user_id);

drop policy if exists "payments_delete_own" on public.payments;
create policy "payments_delete_own"
  on public.payments for delete
  using (auth.uid() = user_id);

-- =============================================================================
-- HOW TO RUN THIS SQL
-- =============================================================================
-- 1. Go to your Supabase project Dashboard -> SQL Editor -> New query
-- 2. Copy and paste the entire contents of this file.
-- 3. Click "Run". Deve rodar sem erros (e pode ser rodado de novo sem quebrar).
-- 4. Verify in the Table Editor that the new columns appear in user_profiles
--    and the payments table appears under the "public" schema with RLS enabled.
-- =============================================================================
