-- PersonalDiet / NutriAI — Security Hardening + Auto-Trial Migration
-- Execute this in the Supabase Dashboard SQL Editor (new query).
-- Safe to run more than once (idempotent).
--
-- WHAT THIS DOES:
-- 1. Blocks users from self-activating Premium via column-level privileges
-- 2. Auto-creates a profile with 7-day trial on signup
-- =============================================================================

-- =============================================================================
-- 1. COLUMN-LEVEL SECURITY: prevent users from writing subscription columns
-- =============================================================================
-- By default Supabase grants UPDATE on ALL columns to the authenticated role.
-- We revoke that and grant UPDATE only on non-sensitive columns.
-- The service_role bypasses RLS and is unaffected by column grants.

REVOKE UPDATE ON public.user_profiles FROM anon, authenticated;
GRANT UPDATE (
  user_name,
  excluded_ingredients,
  clinical_restrictions,
  clinical_treatment,
  diet_type,
  daily_water_goal,
  locale,
  prescription_meal_interval_hours,
  reminders,
  updated_at
) ON public.user_profiles TO authenticated;

-- Also restrict INSERT so users can't craft an INSERT with subscription_status='active'
REVOKE INSERT ON public.user_profiles FROM anon, authenticated;
GRANT INSERT (
  user_id,
  user_name,
  excluded_ingredients,
  clinical_restrictions,
  clinical_treatment,
  diet_type,
  daily_water_goal,
  locale,
  prescription_meal_interval_hours,
  reminders
) ON public.user_profiles TO authenticated;

-- =============================================================================
-- 2. AUTO-CREATE PROFILE WITH 7-DAY TRIAL ON SIGNUP
-- =============================================================================
-- This trigger fires when a new user registers in auth.users.
-- It inserts a user_profiles row with subscription_status='trial' and a
-- 7-day expiration. SECURITY DEFINER runs as the postgres owner so it can
-- write subscription columns even though the user themselves cannot.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, subscription_status)
  VALUES (NEW.id, 'free')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- 3. DEFENSIVE TRIGGER: block subscription column writes from non-service roles
-- =============================================================================
-- Belt-and-suspenders: even if a future migration accidentally re-grants
-- UPDATE on subscription columns, this trigger will still block writes from
-- the authenticated/anon roles. Only the service_role (which sets a special
-- claim) is allowed through.

CREATE OR REPLACE FUNCTION public.guard_subscription_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- service_role bypasses this check (it sets role='service_role' in JWT)
  IF current_setting('role', true) = 'service_role' OR
     current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- For non-service roles, reject if any subscription column changed
  IF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
     OR NEW.subscription_plan IS DISTINCT FROM OLD.subscription_plan
     OR NEW.subscription_expires_at IS DISTINCT FROM OLD.subscription_expires_at
     OR NEW.trial_ends_at IS DISTINCT FROM OLD.trial_ends_at
     OR NEW.mercado_pago_preference_id IS DISTINCT FROM OLD.mercado_pago_preference_id
     OR NEW.mercado_pago_payment_id IS DISTINCT FROM OLD.mercado_pago_payment_id THEN
    RAISE EXCEPTION 'Permission denied: subscription columns are read-only';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_profiles_guard_subscription ON public.user_profiles;
CREATE TRIGGER user_profiles_guard_subscription
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_subscription_columns();

-- =============================================================================
-- HOW TO RUN THIS SQL
-- =============================================================================
-- 1. Go to your Supabase project Dashboard → SQL Editor → New query
-- 2. Copy and paste the entire contents of this file.
-- 3. Click "Run". Deve rodar sem erros (e pode ser rodado de novo sem quebrar).
-- =============================================================================
