import { supabase } from "./supabaseClient";
import type {
  UserPreferences,
  HydrationLog,
  SymptomLog,
  DoseLog,
  PantryIngredient,
  DayMealPlan,
  RecipeResult,
  ShoppingItem,
  ReminderSettings,
} from "./types";

// ---------------------------------------------------------------------------
// Helper: log Supabase errors silently
// ---------------------------------------------------------------------------
function handleError(op: string, error: any): null {
  console.error(`[dataHooks] ${op} failed:`, error?.message || error);
  return null;
}

// ---------------------------------------------------------------------------
// 1. USER PROFILE
// ---------------------------------------------------------------------------
export async function fetchUserProfile(userId: string): Promise<UserPreferences | null> {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select(
        "user_name, excluded_ingredients, clinical_restrictions, clinical_treatment, diet_type, daily_water_goal, locale, prescription_meal_interval_hours, reminders"
      )
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return handleError("fetchUserProfile", error);
    }

    return {
      userName: data.user_name || undefined,
      excludedIngredients: data.excluded_ingredients || [],
      clinicalRestrictions: (data.clinical_restrictions || []) as any,
      clinicalTreatment: data.clinical_treatment as any,
      dietType: data.diet_type as any,
      dailyWaterGoal: data.daily_water_goal ?? 2500,
      locale: (data.locale || "pt") as any,
      prescriptionMealIntervalHours: data.prescription_meal_interval_hours ?? undefined,
      reminders: (data.reminders || undefined) as ReminderSettings | undefined,
    };
  } catch (err) {
    return handleError("fetchUserProfile", err);
  }
}

export async function upsertUserProfile(userId: string, profile: Partial<UserPreferences>): Promise<void> {
  try {
    const payload: any = {
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    if ("userName" in profile) payload.user_name = profile.userName ?? "";
    if ("excludedIngredients" in profile) payload.excluded_ingredients = profile.excludedIngredients ?? [];
    if ("clinicalRestrictions" in profile) payload.clinical_restrictions = profile.clinicalRestrictions ?? [];
    if ("clinicalTreatment" in profile) payload.clinical_treatment = profile.clinicalTreatment ?? "none";
    if ("dietType" in profile) payload.diet_type = profile.dietType ?? "none";
    if ("dailyWaterGoal" in profile) payload.daily_water_goal = profile.dailyWaterGoal ?? 2500;
    if ("locale" in profile) payload.locale = profile.locale ?? "pt";
    if ("prescriptionMealIntervalHours" in profile)
      payload.prescription_meal_interval_hours = profile.prescriptionMealIntervalHours ?? null;
    if ("reminders" in profile) payload.reminders = profile.reminders ?? null;

    const { error } = await supabase.from("user_profiles").upsert(payload, { onConflict: "user_id" });
    if (error) handleError("upsertUserProfile", error);
  } catch (err) {
    handleError("upsertUserProfile", err);
  }
}

// ---------------------------------------------------------------------------
// 2. HYDRATION LOGS
// ---------------------------------------------------------------------------
export async function fetchHydrationLogs(userId: string): Promise<HydrationLog[]> {
  try {
    const { data, error } = await supabase
      .from("hydration_logs")
      .select("id, date, amount")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      handleError("fetchHydrationLogs", error);
      return [];
    }
    return data.map((d) => ({ id: d.id, date: d.date, amount: d.amount }));
  } catch (err) {
    handleError("fetchHydrationLogs", err);
    return [];
  }
}

export async function upsertHydrationLog(userId: string, log: HydrationLog): Promise<void> {
  try {
    const { error } = await supabase.from("hydration_logs").upsert(
      {
        id: log.id,
        user_id: userId,
        date: log.date,
        amount: log.amount,
      },
      { onConflict: "id" }
    );
    if (error) handleError("upsertHydrationLog", error);
  } catch (err) {
    handleError("upsertHydrationLog", err);
  }
}

// ---------------------------------------------------------------------------
// 3. SYMPTOM LOGS
// ---------------------------------------------------------------------------
export async function fetchSymptomLogs(userId: string): Promise<SymptomLog[]> {
  try {
    const { data, error } = await supabase
      .from("symptom_logs")
      .select("id, date, intensity, symptoms, triggers")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      handleError("fetchSymptomLogs", error);
      return [];
    }
    return data.map((d) => ({
      id: d.id,
      date: d.date,
      intensity: d.intensity,
      symptoms: d.symptoms || [],
      triggers: d.triggers || [],
    }));
  } catch (err) {
    handleError("fetchSymptomLogs", err);
    return [];
  }
}

export async function upsertSymptomLog(userId: string, log: SymptomLog): Promise<void> {
  try {
    const { error } = await supabase.from("symptom_logs").upsert(
      {
        id: log.id,
        user_id: userId,
        date: log.date,
        intensity: log.intensity,
        symptoms: log.symptoms,
        triggers: log.triggers,
      },
      { onConflict: "id" }
    );
    if (error) handleError("upsertSymptomLog", error);
  } catch (err) {
    handleError("upsertSymptomLog", err);
  }
}

// ---------------------------------------------------------------------------
// 4. WEIGHT LOGS
// ---------------------------------------------------------------------------
export interface WeightLogDb {
  id: string;
  date: string; // YYYY-MM-DD
  weight_kg: number;
}

export interface WeightDataBundle {
  logs: WeightLogDb[];
  heightCm: number;
  targetWeightKg: number;
}

export async function fetchWeightLogs(userId: string): Promise<WeightDataBundle> {
  try {
    const { data, error } = await supabase
      .from("weight_logs")
      .select("id, date, weight_kg, height_cm, target_weight_kg")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      handleError("fetchWeightLogs", error);
      return { logs: [], heightCm: 170, targetWeightKg: 70 };
    }

    const logs: WeightLogDb[] = data.map((d) => ({ id: d.id, date: d.date, weight_kg: d.weight_kg }));
    const latest = data[0] || {};
    return {
      logs,
      heightCm: latest.height_cm ?? 170,
      targetWeightKg: latest.target_weight_kg ?? 70,
    };
  } catch (err) {
    handleError("fetchWeightLogs", err);
    return { logs: [], heightCm: 170, targetWeightKg: 70 };
  }
}

export async function upsertWeightLog(
  userId: string,
  log: { id: string; date: string; weight: number; heightCm?: number; targetWeightKg?: number }
): Promise<void> {
  try {
    const { error } = await supabase.from("weight_logs").upsert(
      {
        id: log.id,
        user_id: userId,
        date: log.date,
        weight_kg: log.weight,
        height_cm: log.heightCm ?? null,
        target_weight_kg: log.targetWeightKg ?? null,
      },
      { onConflict: "id" }
    );
    if (error) handleError("upsertWeightLog", error);
  } catch (err) {
    handleError("upsertWeightLog", err);
  }
}

// ---------------------------------------------------------------------------
// 5. DOSE LOGS
// ---------------------------------------------------------------------------
export async function fetchDoseLogs(userId: string): Promise<DoseLog[]> {
  try {
    const { data, error } = await supabase
      .from("dose_logs")
      .select("id, date, dose_mg, injection_site, treatment_type")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      handleError("fetchDoseLogs", error);
      return [];
    }
    return data.map((d) => ({
      id: d.id,
      date: d.date,
      doseMg: d.dose_mg,
      injectionSite: d.injection_site as DoseLog["injectionSite"],
      treatmentType: d.treatment_type as DoseLog["treatmentType"],
    }));
  } catch (err) {
    handleError("fetchDoseLogs", err);
    return [];
  }
}

export async function upsertDoseLog(userId: string, log: DoseLog): Promise<void> {
  try {
    const { error } = await supabase.from("dose_logs").upsert(
      {
        id: log.id,
        user_id: userId,
        date: log.date,
        dose_mg: log.doseMg,
        injection_site: log.injectionSite,
        treatment_type: log.treatmentType,
      },
      { onConflict: "id" }
    );
    if (error) handleError("upsertDoseLog", error);
  } catch (err) {
    handleError("upsertDoseLog", err);
  }
}

// ---------------------------------------------------------------------------
// 6. PANTRY ITEMS
// ---------------------------------------------------------------------------
export async function fetchPantryItems(userId: string): Promise<PantryIngredient[]> {
  try {
    const { data, error } = await supabase
      .from("pantry_items")
      .select("id, name, quantity, category")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error || !data) {
      handleError("fetchPantryItems", error);
      return [];
    }
    return data.map((d) => ({
      id: d.id,
      name: d.name,
      quantity: d.quantity || "",
      category: d.category || undefined,
    }));
  } catch (err) {
    handleError("fetchPantryItems", err);
    return [];
  }
}

export async function upsertPantryItems(userId: string, items: PantryIngredient[]): Promise<void> {
  try {
    // Simplest strategy: delete all current items for this user, then insert batch
    const { error: delError } = await supabase.from("pantry_items").delete().eq("user_id", userId);
    if (delError) {
      handleError("upsertPantryItems(delete)", delError);
      return;
    }
    if (items.length === 0) return;

    const payload = items.map((item) => ({
      id: item.id,
      user_id: userId,
      name: item.name,
      quantity: item.quantity || "",
      category: item.category || "",
    }));

    const { error } = await supabase.from("pantry_items").insert(payload);
    if (error) handleError("upsertPantryItems(insert)", error);
  } catch (err) {
    handleError("upsertPantryItems", err);
  }
}

// ---------------------------------------------------------------------------
// 7. MEAL PLANS
// ---------------------------------------------------------------------------
export interface MealPlanBundle {
  plan: DayMealPlan[];
  recipes: RecipeResult[];
}

export async function fetchMealPlan(userId: string): Promise<MealPlanBundle> {
  try {
    const { data, error } = await supabase
      .from("meal_plans")
      .select("plan, recipes")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      handleError("fetchMealPlan", error);
      return { plan: [], recipes: [] };
    }
    return {
      plan: (data.plan || []) as DayMealPlan[],
      recipes: (data.recipes || []) as RecipeResult[],
    };
  } catch (err) {
    handleError("fetchMealPlan", err);
    return { plan: [], recipes: [] };
  }
}

export async function upsertMealPlan(
  userId: string,
  plan: DayMealPlan[],
  recipes: RecipeResult[]
): Promise<void> {
  try {
    const { error } = await supabase.from("meal_plans").upsert(
      {
        user_id: userId,
        plan: plan as any,
        recipes: recipes as any,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (error) handleError("upsertMealPlan", error);
  } catch (err) {
    handleError("upsertMealPlan", err);
  }
}

// ---------------------------------------------------------------------------
// 8. SHOPPING LISTS
// ---------------------------------------------------------------------------
export async function fetchShoppingList(userId: string): Promise<ShoppingItem[]> {
  try {
    const { data, error } = await supabase
      .from("shopping_lists")
      .select("items")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      handleError("fetchShoppingList", error);
      return [];
    }
    return (data.items || []) as ShoppingItem[];
  } catch (err) {
    handleError("fetchShoppingList", err);
    return [];
  }
}

export async function upsertShoppingList(userId: string, items: ShoppingItem[]): Promise<void> {
  try {
    const { error } = await supabase.from("shopping_lists").upsert(
      {
        user_id: userId,
        items: items as any,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (error) handleError("upsertShoppingList", error);
  } catch (err) {
    handleError("upsertShoppingList", err);
  }
}

// ---------------------------------------------------------------------------
// 9. SUBSCRIPTION
// ---------------------------------------------------------------------------
export interface SubscriptionStatus {
  status: string;
  plan: string | null;
  expiresAt: string | null;
  trialEndsAt: string | null;
}

export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("subscription_status, subscription_plan, subscription_expires_at, trial_ends_at")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      handleError("getSubscriptionStatus", error);
      return { status: "free", plan: null, expiresAt: null, trialEndsAt: null };
    }

    const now = new Date();
    const expiresAt = data.subscription_expires_at ? new Date(data.subscription_expires_at) : null;
    const trialEndsAt = data.trial_ends_at ? new Date(data.trial_ends_at) : null;
    let status = data.subscription_status ?? "free";

    if (status === "active" && expiresAt && now > expiresAt) {
      status = "expired";
    }
    if (status === "trial" && trialEndsAt && now > trialEndsAt) {
      status = "trial_expired";
    }

    return {
      status,
      plan: data.subscription_plan ?? null,
      expiresAt: data.subscription_expires_at ?? null,
      trialEndsAt: data.trial_ends_at ?? null,
    };
  } catch (err) {
    handleError("getSubscriptionStatus", err);
    return { status: "free", plan: null, expiresAt: null, trialEndsAt: null };
  }
}

export async function startTrial(userId: string): Promise<void> {
  try {
    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const { error } = await supabase.from("user_profiles").upsert({
      user_id: userId,
      subscription_status: "trial",
      trial_ends_at: trialEndsAt.toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (error) handleError("startTrial", error);
  } catch (err) {
    handleError("startTrial", err);
  }
}

export async function activateSubscription(userId: string, plan: string, expiresAt: Date): Promise<void> {
  try {
    const { error } = await supabase.from("user_profiles").update({
      subscription_status: "active",
      subscription_plan: plan,
      subscription_expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId);
    if (error) handleError("activateSubscription", error);
  } catch (err) {
    handleError("activateSubscription", err);
  }
}
