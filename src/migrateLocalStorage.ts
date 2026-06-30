import {
  upsertUserProfile,
  upsertHydrationLog,
  upsertSymptomLog,
  upsertWeightLog,
  upsertDoseLog,
  upsertPantryItems,
  upsertMealPlan,
  upsertShoppingList,
} from "./dataHooks";

const MIGRATION_KEY = "nutri_migrated_v1";

/**
 * Reads every localStorage key that starts with "nutri_",
 * converts the data, and pushes it into Supabase.
 * Should be called once after login, right after setSession(session).
 */
export async function migrateLocalStorageToSupabase(userId: string): Promise<void> {
  if (!userId) {
    console.warn("[migrate] No userId provided; skipping migration.");
    return;
  }

  if (localStorage.getItem(MIGRATION_KEY) === "true") {
    console.log("[migrate] Already migrated; skipping.");
    return;
  }

  console.log("[migrate] Starting localStorage → Supabase migration...");

  try {
    // 1. Preferences → user_profiles
    const rawPrefs = localStorage.getItem("nutri_preferences");
    if (rawPrefs) {
      try {
        const parsed = JSON.parse(rawPrefs);
        await upsertUserProfile(userId, parsed);
        console.log("[migrate] Preferences migrated.");
      } catch (e) {
        console.error("[migrate] Failed to parse preferences:", e);
      }
    }

    // 2. Hydration logs → hydration_logs
    const rawHydration = localStorage.getItem("nutri_hydration_logs");
    if (rawHydration) {
      try {
        const logs = JSON.parse(rawHydration);
        if (Array.isArray(logs)) {
          for (const log of logs) {
            if (log.id && log.date && typeof log.amount === "number") {
              await upsertHydrationLog(userId, log);
            }
          }
          console.log("[migrate] Hydration logs migrated.", logs.length);
        }
      } catch (e) {
        console.error("[migrate] Failed to parse hydration logs:", e);
      }
    }

    // 3. Symptom logs → symptom_logs
    const rawSymptoms = localStorage.getItem("nutri_symptom_logs");
    if (rawSymptoms) {
      try {
        const logs = JSON.parse(rawSymptoms);
        if (Array.isArray(logs)) {
          for (const log of logs) {
            if (log.id && log.date && typeof log.intensity === "number") {
              await upsertSymptomLog(userId, log);
            }
          }
          console.log("[migrate] Symptom logs migrated.", logs.length);
        }
      } catch (e) {
        console.error("[migrate] Failed to parse symptom logs:", e);
      }
    }

    // 4. Weight logs → weight_logs
    const rawWeight = localStorage.getItem("nutri_weight_logs");
    const rawHeight = localStorage.getItem("nutri_height");
    const rawTarget = localStorage.getItem("nutri_target_weight");
    const heightCm = rawHeight ? parseInt(rawHeight, 10) || 170 : undefined;
    const targetWeightKg = rawTarget ? parseFloat(rawTarget) || 70 : undefined;

    if (rawWeight) {
      try {
        const logs = JSON.parse(rawWeight);
        if (Array.isArray(logs)) {
          for (const log of logs) {
            if (log.id && log.date && typeof log.weight === "number") {
              await upsertWeightLog(userId, {
                id: log.id,
                date: log.date,
                weight: log.weight,
                heightCm,
                targetWeightKg,
              });
            }
          }
          console.log("[migrate] Weight logs migrated.", logs.length);
        }
      } catch (e) {
        console.error("[migrate] Failed to parse weight logs:", e);
      }
    }

    // 5. Dose logs → dose_logs
    const rawDoses = localStorage.getItem("nutri_dose_logs");
    if (rawDoses) {
      try {
        const logs = JSON.parse(rawDoses);
        if (Array.isArray(logs)) {
          for (const log of logs) {
            if (log.id && log.date && typeof log.doseMg === "number" && log.injectionSite) {
              await upsertDoseLog(userId, log);
            }
          }
          console.log("[migrate] Dose logs migrated.", logs.length);
        }
      } catch (e) {
        console.error("[migrate] Failed to parse dose logs:", e);
      }
    }

    // 6. Pantry items → pantry_items
    const rawPantry = localStorage.getItem("nutri_pantry_items");
    if (rawPantry) {
      try {
        const items = JSON.parse(rawPantry);
        if (Array.isArray(items)) {
          await upsertPantryItems(userId, items);
          console.log("[migrate] Pantry items migrated.", items.length);
        }
      } catch (e) {
        console.error("[migrate] Failed to parse pantry items:", e);
      }
    }

    // 7. Meal plan + recipes → meal_plans
    const rawPlan = localStorage.getItem("nutri_current_mealplan");
    const rawRecipes = localStorage.getItem("nutri_current_recipes");
    const plan = rawPlan ? JSON.parse(rawPlan) : [];
    const recipes = rawRecipes ? JSON.parse(rawRecipes) : [];
    if (Array.isArray(plan) || Array.isArray(recipes)) {
      await upsertMealPlan(userId, plan, recipes);
      console.log("[migrate] Meal plan migrated.");
    }

    // 8. Shopping list → shopping_lists
    const rawShopping = localStorage.getItem("nutri_current_shopping");
    if (rawShopping) {
      try {
        const items = JSON.parse(rawShopping);
        if (Array.isArray(items)) {
          await upsertShoppingList(userId, items);
          console.log("[migrate] Shopping list migrated.", items.length);
        }
      } catch (e) {
        console.error("[migrate] Failed to parse shopping list:", e);
      }
    }

    // Mark as done
    localStorage.setItem(MIGRATION_KEY, "true");
    console.log("[migrate] Migration completed successfully.");
  } catch (err) {
    console.error("[migrate] Unexpected migration error:", err);
  }
}
