-- PersonalDiet / NutriAI — Initial Schema Migration
-- Execute this in the Supabase Dashboard SQL Editor (new query)

-- =============================================================================
-- 1. USER PROFILES
-- =============================================================================
create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  user_name text,
  excluded_ingredients text[] default '{}',
  clinical_restrictions text[] default '{}',
  clinical_treatment text default 'none',
  diet_type text default 'none',
  daily_water_goal int default 2500,
  locale text default 'pt',
  prescription_meal_interval_hours int,
  reminders jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Unique constraint: one profile per user
alter table public.user_profiles
  drop constraint if exists user_profiles_user_id_key;
alter table public.user_profiles
  add constraint user_profiles_user_id_key unique (user_id);

-- =============================================================================
-- 2. HYDRATION LOGS
-- =============================================================================
create table if not exists public.hydration_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date text not null,              -- YYYY-MM-DD
  amount int not null,             -- ml
  created_at timestamptz default now()
);

-- =============================================================================
-- 3. SYMPTOM LOGS
-- =============================================================================
create table if not exists public.symptom_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date timestamptz not null,
  intensity int not null check (intensity >= 1 and intensity <= 10),
  symptoms text[] default '{}',
  triggers text[] default '{}',
  created_at timestamptz default now()
);

-- =============================================================================
-- 4. WEIGHT LOGS
-- =============================================================================
create table if not exists public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date text not null,              -- YYYY-MM-DD
  weight_kg decimal(5,2) not null,
  height_cm int,
  target_weight_kg decimal(5,2),
  created_at timestamptz default now()
);

-- =============================================================================
-- 5. DOSE LOGS (Mounjaro / Ozempic)
-- =============================================================================
create table if not exists public.dose_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date text not null,              -- YYYY-MM-DD
  dose_mg decimal(4,1) not null,
  injection_site text not null
    check (injection_site in (
      'esquerda-abdomen', 'direita-abdomen',
      'coxa-esquerda', 'coxa-direita',
      'braco-esquerdo', 'braco-direito'
    )),
  treatment_type text not null
    check (treatment_type in ('mounjaro', 'ozempic', 'none')),
  created_at timestamptz default now()
);

-- =============================================================================
-- 6. PANTRY ITEMS
-- =============================================================================
create table if not exists public.pantry_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  quantity text default '',
  category text default '',
  created_at timestamptz default now()
);

-- =============================================================================
-- 7. MEAL PLANS
-- =============================================================================
create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  plan jsonb default '[]',
  recipes jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Unique constraint: one meal plan per user
alter table public.meal_plans
  drop constraint if exists meal_plans_user_id_key;
alter table public.meal_plans
  add constraint meal_plans_user_id_key unique (user_id);

-- =============================================================================
-- 8. SHOPPING LISTS
-- =============================================================================
create table if not exists public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  items jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Unique constraint: one shopping list per user
alter table public.shopping_lists
  drop constraint if exists shopping_lists_user_id_key;
alter table public.shopping_lists
  add constraint shopping_lists_user_id_key unique (user_id);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) — ENABLE + POLICIES
-- =============================================================================

-- user_profiles
alter table public.user_profiles enable row level security;
drop policy if exists "user_profiles_select_own" on public.user_profiles;
create policy "user_profiles_select_own"
  on public.user_profiles for select
  using (auth.uid() = user_id);
drop policy if exists "user_profiles_insert_own" on public.user_profiles;
create policy "user_profiles_insert_own"
  on public.user_profiles for insert
  with check (auth.uid() = user_id);
drop policy if exists "user_profiles_update_own" on public.user_profiles;
create policy "user_profiles_update_own"
  on public.user_profiles for update
  using (auth.uid() = user_id);
drop policy if exists "user_profiles_delete_own" on public.user_profiles;
create policy "user_profiles_delete_own"
  on public.user_profiles for delete
  using (auth.uid() = user_id);

-- hydration_logs
alter table public.hydration_logs enable row level security;
drop policy if exists "hydration_logs_select_own" on public.hydration_logs;
create policy "hydration_logs_select_own"
  on public.hydration_logs for select
  using (auth.uid() = user_id);
drop policy if exists "hydration_logs_insert_own" on public.hydration_logs;
create policy "hydration_logs_insert_own"
  on public.hydration_logs for insert
  with check (auth.uid() = user_id);
drop policy if exists "hydration_logs_update_own" on public.hydration_logs;
create policy "hydration_logs_update_own"
  on public.hydration_logs for update
  using (auth.uid() = user_id);
drop policy if exists "hydration_logs_delete_own" on public.hydration_logs;
create policy "hydration_logs_delete_own"
  on public.hydration_logs for delete
  using (auth.uid() = user_id);

-- symptom_logs
alter table public.symptom_logs enable row level security;
drop policy if exists "symptom_logs_select_own" on public.symptom_logs;
create policy "symptom_logs_select_own"
  on public.symptom_logs for select
  using (auth.uid() = user_id);
drop policy if exists "symptom_logs_insert_own" on public.symptom_logs;
create policy "symptom_logs_insert_own"
  on public.symptom_logs for insert
  with check (auth.uid() = user_id);
drop policy if exists "symptom_logs_update_own" on public.symptom_logs;
create policy "symptom_logs_update_own"
  on public.symptom_logs for update
  using (auth.uid() = user_id);
drop policy if exists "symptom_logs_delete_own" on public.symptom_logs;
create policy "symptom_logs_delete_own"
  on public.symptom_logs for delete
  using (auth.uid() = user_id);

-- weight_logs
alter table public.weight_logs enable row level security;
drop policy if exists "weight_logs_select_own" on public.weight_logs;
create policy "weight_logs_select_own"
  on public.weight_logs for select
  using (auth.uid() = user_id);
drop policy if exists "weight_logs_insert_own" on public.weight_logs;
create policy "weight_logs_insert_own"
  on public.weight_logs for insert
  with check (auth.uid() = user_id);
drop policy if exists "weight_logs_update_own" on public.weight_logs;
create policy "weight_logs_update_own"
  on public.weight_logs for update
  using (auth.uid() = user_id);
drop policy if exists "weight_logs_delete_own" on public.weight_logs;
create policy "weight_logs_delete_own"
  on public.weight_logs for delete
  using (auth.uid() = user_id);

-- dose_logs
alter table public.dose_logs enable row level security;
drop policy if exists "dose_logs_select_own" on public.dose_logs;
create policy "dose_logs_select_own"
  on public.dose_logs for select
  using (auth.uid() = user_id);
drop policy if exists "dose_logs_insert_own" on public.dose_logs;
create policy "dose_logs_insert_own"
  on public.dose_logs for insert
  with check (auth.uid() = user_id);
drop policy if exists "dose_logs_update_own" on public.dose_logs;
create policy "dose_logs_update_own"
  on public.dose_logs for update
  using (auth.uid() = user_id);
drop policy if exists "dose_logs_delete_own" on public.dose_logs;
create policy "dose_logs_delete_own"
  on public.dose_logs for delete
  using (auth.uid() = user_id);

-- pantry_items
alter table public.pantry_items enable row level security;
drop policy if exists "pantry_items_select_own" on public.pantry_items;
create policy "pantry_items_select_own"
  on public.pantry_items for select
  using (auth.uid() = user_id);
drop policy if exists "pantry_items_insert_own" on public.pantry_items;
create policy "pantry_items_insert_own"
  on public.pantry_items for insert
  with check (auth.uid() = user_id);
drop policy if exists "pantry_items_update_own" on public.pantry_items;
create policy "pantry_items_update_own"
  on public.pantry_items for update
  using (auth.uid() = user_id);
drop policy if exists "pantry_items_delete_own" on public.pantry_items;
create policy "pantry_items_delete_own"
  on public.pantry_items for delete
  using (auth.uid() = user_id);

-- meal_plans
alter table public.meal_plans enable row level security;
drop policy if exists "meal_plans_select_own" on public.meal_plans;
create policy "meal_plans_select_own"
  on public.meal_plans for select
  using (auth.uid() = user_id);
drop policy if exists "meal_plans_insert_own" on public.meal_plans;
create policy "meal_plans_insert_own"
  on public.meal_plans for insert
  with check (auth.uid() = user_id);
drop policy if exists "meal_plans_update_own" on public.meal_plans;
create policy "meal_plans_update_own"
  on public.meal_plans for update
  using (auth.uid() = user_id);
drop policy if exists "meal_plans_delete_own" on public.meal_plans;
create policy "meal_plans_delete_own"
  on public.meal_plans for delete
  using (auth.uid() = user_id);

-- shopping_lists
alter table public.shopping_lists enable row level security;
drop policy if exists "shopping_lists_select_own" on public.shopping_lists;
create policy "shopping_lists_select_own"
  on public.shopping_lists for select
  using (auth.uid() = user_id);
drop policy if exists "shopping_lists_insert_own" on public.shopping_lists;
create policy "shopping_lists_insert_own"
  on public.shopping_lists for insert
  with check (auth.uid() = user_id);
drop policy if exists "shopping_lists_update_own" on public.shopping_lists;
create policy "shopping_lists_update_own"
  on public.shopping_lists for update
  using (auth.uid() = user_id);
drop policy if exists "shopping_lists_delete_own" on public.shopping_lists;
create policy "shopping_lists_delete_own"
  on public.shopping_lists for delete
  using (auth.uid() = user_id);

-- =============================================================================
-- HOW TO RUN THIS SQL
-- =============================================================================
-- 1. Go to your Supabase project Dashboard → SQL Editor → New query
-- 2. Copy and paste the entire contents of this file.
-- 3. Click "Run". No errors should appear.
-- 4. Verify in the Table Editor that the tables appear under the "public" schema.
-- 5. RLS is enabled by default; the policies above ensure users only ever see
--    and modify their own rows (auth.uid() = user_id).
-- =============================================================================
