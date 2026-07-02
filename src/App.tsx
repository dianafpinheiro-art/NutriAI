import { FormEvent, useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import { 
  Heart, 
  Settings, 
  Sliders, 
  Trash2,
  User,
  Crown,
  X
} from "lucide-react";
import { UserPreferences, PantryIngredient, RecipeResult, Locale, DietType, ClinicalTreatment } from "./types";
import type { Session } from "@supabase/supabase-js";
import { Analytics } from "@vercel/analytics/react";
import { localeLabels, t } from "./i18n";
import { supabase } from "./supabaseClient";
import { authFetch } from "./authFetch";
import Auth from "./components/Auth";
import { fetchUserProfile, fetchPantryItems, upsertUserProfile } from "./dataHooks";
import { migrateLocalStorageToSupabase } from "./migrateLocalStorage";

import { usePaywall } from "./hooks/usePaywall";
import SubscriptionPlans from "./components/SubscriptionPlans";
import SubscriptionManager from "./components/SubscriptionManager";
import MedicalDisclaimer from "./components/MedicalDisclaimer";

// Inner Components
import HydrationTracker from "./components/HydrationTracker";
import SymptomTracker from "./components/SymptomTracker";
import WeightTracker from "./components/WeightTracker";
import MounjaroMonitor from "./components/MounjaroMonitor";
import PantryScanner from "./components/PantryScanner";
import MealPlanner from "./components/MealPlanner";
import InstallPwaBanner from "./components/InstallPwaBanner";
import ReminderCenter from "./components/ReminderCenter";
import WhoAmI from "./components/WhoAmI";

export default function App() {
  const defaultPreferences: UserPreferences = {
    userName: "",
    excludedIngredients: ["berinjela", "coentro"],
    clinicalRestrictions: ["lactose"],
    clinicalTreatment: "mounjaro",
    dietType: "low-carb",
    dailyWaterGoal: 2500,
    locale: "pt",
    reminders: {
      hydrationEnabled: true,
      hydrationIntervalMinutes: 120,
      mealEnabled: true,
      mealIntervalHours: 3,
      activeStart: "08:00",
      activeEnd: "21:00",
    },
  };

  const normalizePreferences = (prefs: Partial<UserPreferences>): UserPreferences => ({
    ...defaultPreferences,
    ...prefs,
    excludedIngredients: prefs.excludedIngredients ?? defaultPreferences.excludedIngredients,
    clinicalRestrictions: prefs.clinicalRestrictions ?? defaultPreferences.clinicalRestrictions,
    reminders: {
      ...defaultPreferences.reminders!,
      ...(prefs.reminders ?? {}),
      mealIntervalHours: prefs.prescriptionMealIntervalHours ?? prefs.reminders?.mealIntervalHours ?? defaultPreferences.reminders!.mealIntervalHours,
    },
  });

  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const locale = preferences.locale ?? "pt";

  const [pantry, setPantry] = useState<PantryIngredient[]>([]);
  const [externalRecipes, setExternalRecipes] = useState<RecipeResult[] | null>(null);
  const [showPreferencesEditor, setShowPreferencesEditor] = useState(false);
  const [showWhoAmI, setShowWhoAmI] = useState(false);
  const [showSubscriptionPlans, setShowSubscriptionPlans] = useState(false);
  const [showSubscriptionManager, setShowSubscriptionManager] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  const [newExcluded, setNewExcluded] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.id) {
        const uid = session.user.id;
        // Load preferences from Supabase
        fetchUserProfile(uid).then((profile) => {
          if (profile) {
            setPreferences(normalizePreferences(profile));
          }
        });
        // Load pantry from Supabase
        fetchPantryItems(uid).then((items) => {
          setPantry(items);
        });
        // Migrate old localStorage data
        migrateLocalStorageToSupabase(uid);
      } else {
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.id) {
        const uid = session.user.id;
        fetchUserProfile(uid).then((profile) => {
          if (profile) {
            setPreferences(normalizePreferences(profile));
          }
        });
        fetchPantryItems(uid).then((items) => {
          setPantry(items);
        });
        migrateLocalStorageToSupabase(uid);
      }
    });

    // Auto open WhoAmI onboarding on first visit
    const onboarded = localStorage.getItem("nutri_onboarded");
    if (onboarded !== "true") {
      setTimeout(() => {
        setShowWhoAmI(true);
      }, 800);
    }

    // Trigger Sonner PWA interactive notification for update availability on second startup
    setTimeout(() => {
      toast(t(locale, "updateAvailable"), {
        description: t(locale, "updateDescription"),
        action: {
          label: t(locale, "updateAction"),
          onClick: () => {
            toast.success(t(locale, "updatingCache"));
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        },
        duration: 10000,
      });
    }, 3000);

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleUpdatePreferences = (updated: Partial<UserPreferences>) => {
    const next = { ...preferences, ...updated };
    setPreferences(next);
    if (session?.user?.id) {
      upsertUserProfile(session.user.id, next).catch(() => {});
    }
  };

  const handleSavePreferences = (updated: UserPreferences) => {
    setPreferences(updated);
    if (session?.user?.id) {
      upsertUserProfile(session.user.id, updated).catch(() => {});
    }
    toast.success(t(updated.locale ?? locale, "profileSaved", { name: updated.userName || "PersonalDiet" }));
  };

  const handleAddExcluded = (e: FormEvent) => {
    e.preventDefault();
    if (!newExcluded.trim()) return;
    const cleanTerm = newExcluded.trim().toLowerCase();
    
    if (preferences.excludedIngredients.includes(cleanTerm)) {
      toast.error(t(locale, "duplicateIngredient"));
      return;
    }

    const updated = [...preferences.excludedIngredients, cleanTerm];
    handleUpdatePreferences({ excludedIngredients: updated });
    setNewExcluded("");
  };

  const handleRemoveExcluded = (item: string) => {
    const updated = preferences.excludedIngredients.filter(i => i !== item);
    handleUpdatePreferences({ excludedIngredients: updated });
  };

  const handleToggleRestriction = (restr: "celiac" | "lactose") => {
    const current = preferences.clinicalRestrictions;
    const exists = current.includes(restr);
    const updated = exists 
      ? current.filter(r => r !== restr) 
      : [...current, restr];
    handleUpdatePreferences({ clinicalRestrictions: updated });
  };

  const handleSuggestRecipes = async (items: PantryIngredient[]) => {
    toast.promise(
      authFetch("/api/gemini/generate-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences, pantry: items, actionType: "suggest-recipes-pantry", locale, languageInstruction: t(locale, "mealPlanLanguageInstruction") }),
      }).then(async (res) => {
        const data = await res.json();
        if (data && data.error) {
          throw new Error(data.error);
        }
        if (!Array.isArray(data)) {
          throw new Error(t(locale, "recipesBadFormat"));
        }
        return data;
      }),
      {
        loading: t(locale, "recipesLoading"),
        success: (recipes) => {
          setExternalRecipes(recipes);
          return t(locale, "recipesSuccess");
        },
        error: (err: unknown) => {
          const message = err instanceof Error ? err.message : String(err);
          return t(locale, "recipesError", { message: message || t(locale, "serviceUnavailable") });
        }
      }
    );
  };

  const userId = session?.user.id ?? "";
  const paywall = usePaywall(userId);

  useEffect(() => {
    if (session && (paywall.status === "free" || paywall.status === "trial_expired")) {
      const timer = setTimeout(() => {
        setShowSubscriptionPlans(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [session, paywall.status]);

  if (!session) {
    return <Auth onSession={(session) => setSession(session)} locale={locale} />;
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-800 pb-20 portrait-safe font-body">
      <Toaster position="top-center" richColors />

      <header className="sticky top-0 z-40 bg-[#fafaf9]/85 backdrop-blur-md border-b border-stone-100 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-tr from-pink-400 to-purple-400 rounded-xl flex items-center justify-center text-white shadow-md shadow-pink-100 animate-spin-slow">
            <Heart className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-stone-800 font-heading leading-none">PersonalDiet</h1>
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{t(locale, "appSubtitle")}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {preferences.userName && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 bg-pink-50 text-pink-600 border border-pink-100 rounded-full">
              {t(locale, "hello", { name: preferences.userName })}
            </span>
          )}
          <button
            onClick={() => setShowSubscriptionManager(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-pink-200 hover:bg-pink-50 text-pink-600 rounded-xl shadow-sm text-xs font-extrabold btn-interactive touch-target"
            title={t(locale, "manageSubscription")}
          >
            <Crown className="w-3.5 h-3.5" /> Premium
          </button>
          <button
            onClick={() => setShowWhoAmI(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-95 text-white rounded-xl shadow-sm text-xs font-extrabold btn-interactive touch-target"
            title={t(locale, "whoAmI")}
          >
            <User className="w-3.5 h-3.5" /> {t(locale, "whoAmI")}
          </button>
          <button
            onClick={() => setShowPreferencesEditor(!showPreferencesEditor)}
            className="p-2 bg-white border border-stone-100 rounded-xl shadow-sm text-stone-500 hover:text-pink-500 hover:bg-pink-50/20 transition-all btn-interactive touch-target"
            title={t(locale, "clinicalPreferences")}
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={() => supabase.auth.signOut()}
            className="p-2 bg-white border border-stone-100 rounded-xl shadow-sm text-stone-500 hover:text-red-500 hover:bg-red-50/20 transition-all btn-interactive touch-target"
            title="Sair"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6">

        {showPreferencesEditor && (
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-pink-100 animate-fade flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-pink-500" />
                <h3 className="font-heading font-extrabold text-stone-800 text-sm">{t(locale, "preferencesTitle")}</h3>
              </div>
              <button 
                onClick={() => setShowPreferencesEditor(false)}
                className="text-xs text-stone-400 hover:text-stone-600 font-bold p-2 touch-target"
              >
                {t(locale, "hide")}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-heading font-bold text-stone-700 block mb-1">{t(locale, "language")}</label>
                  <select
                    value={locale}
                    onChange={(e) => handleUpdatePreferences({ locale: e.target.value as Locale })}
                    className="w-full text-xs p-2.5 outline-none border border-stone-200 rounded-xl bg-stone-50 font-bold cursor-pointer focus:border-pink-300 focus:bg-white transition-all"
                  >
                    {Object.entries(localeLabels).map(([code, label]) => (
                      <option key={code} value={code}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-heading font-bold text-stone-700 block mb-1">{t(locale, "clinicalTreatment")}</label>
                  <select
                    value={preferences.clinicalTreatment}
                    onChange={(e) => handleUpdatePreferences({ clinicalTreatment: e.target.value as ClinicalTreatment })}
                    className="w-full text-xs p-2.5 outline-none border border-stone-200 rounded-xl bg-stone-50 font-bold cursor-pointer focus:border-pink-300 focus:bg-white transition-all"
                  >
                    <option value="none">{t(locale, "treatmentNone")}</option>
                    <option value="mounjaro">{t(locale, "treatmentMounjaro")}</option>
                    <option value="ozempic">{t(locale, "treatmentOzempic")}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-heading font-bold text-stone-700 block mb-1">{t(locale, "dietStyle")}</label>
                  <select
                    value={preferences.dietType}
                    onChange={(e) => handleUpdatePreferences({ dietType: e.target.value as DietType })}
                    className="w-full text-xs p-2.5 outline-none border border-stone-200 rounded-xl bg-stone-50 font-bold cursor-pointer focus:border-pink-300 focus:bg-white transition-all"
                  >
                    <option value="none">{t(locale, "dietNone")}</option>
                    <option value="low-carb">{t(locale, "dietLowCarb")}</option>
                    <option value="cetogenica">{t(locale, "dietKeto")}</option>
                    <option value="mediterranea">{t(locale, "dietMediterranean")}</option>
                    <option value="deficit-calorico">{t(locale, "dietDeficit")}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-heading font-bold text-stone-700 block mb-1.5">{t(locale, "clinicalConditions")}</label>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleToggleRestriction("celiac")}
                      className={`p-2.5 rounded-xl text-left text-xs font-bold border flex items-center justify-between ${
                        preferences.clinicalRestrictions.includes("celiac")
                          ? "bg-red-50 text-red-700 border-red-100"
                          : "bg-stone-50 text-stone-600 border-stone-200/50"
                      }`}
                    >
                      <span>{t(locale, "celiacStrict")}</span>
                      {preferences.clinicalRestrictions.includes("celiac") && "✓"}
                    </button>
                    <button
                      onClick={() => handleToggleRestriction("lactose")}
                      className={`p-2.5 rounded-xl text-left text-xs font-bold border flex items-center justify-between ${
                        preferences.clinicalRestrictions.includes("lactose")
                          ? "bg-amber-50 text-amber-700 border-amber-100"
                          : "bg-stone-50 text-stone-600 border-stone-200/50"
                      }`}
                    >
                      <span>{t(locale, "lactoseStrict")}</span>
                      {preferences.clinicalRestrictions.includes("lactose") && "✓"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-heading font-bold text-stone-700 block mb-1">{t(locale, "waterGoal")}</label>
                  <input
                    type="number"
                    value={preferences.dailyWaterGoal}
                    onChange={(e) => handleUpdatePreferences({ dailyWaterGoal: parseInt(e.target.value) || 2000 })}
                    className="w-full text-xs p-2.5 outline-none border border-stone-200 rounded-xl bg-stone-50 font-bold focus:border-pink-300 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-heading font-bold text-stone-700 block mb-1">{t(locale, "excludedIngredient")}</label>
                  <form onSubmit={handleAddExcluded} className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder={t(locale, "excludedPlaceholder")}
                      value={newExcluded}
                      onChange={(e) => setNewExcluded(e.target.value)}
                      className="w-full text-xs p-2.5 outline-none border border-stone-200 rounded-xl bg-stone-50 font-semibold focus:border-pink-300 focus:bg-white transition-all"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold rounded-xl btn-interactive"
                    >
                      {t(locale, "ban")}
                    </button>
                  </form>
                  
                  {preferences.excludedIngredients.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 max-h-24 overflow-y-auto border border-stone-50 p-2 rounded-xl">
                      {preferences.excludedIngredients.map((ing) => (
                        <span 
                          key={ing} 
                          className="inline-flex items-center gap-1 text-[10px] font-bold bg-stone-100 hover:bg-red-50 text-stone-600 hover:text-red-700 px-2 py-1 rounded-lg transition-colors cursor-pointer border border-stone-200/40"
                          onClick={() => handleRemoveExcluded(ing)}
                          title={t(locale, "removeBanTitle")}
                        >
                          {ing} <Trash2 className="w-2.5 h-2.5 text-stone-400" />
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <ReminderCenter
          preferences={preferences}
          onUpdatePreferences={handleUpdatePreferences}
          locale={locale}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="flex flex-col gap-6">
            
            <HydrationTracker dailyGoal={preferences.dailyWaterGoal} userId={userId} />

            <SymptomTracker userId={userId} />

            <WeightTracker 
              clinicalTreatment={preferences.clinicalTreatment} 
              dietType={preferences.dietType} 
              userId={userId}
            />

            <MounjaroMonitor treatmentType={preferences.clinicalTreatment} userId={userId} />

          </div>

          <div className="flex flex-col gap-6">
            
            <PantryScanner 
              onSuggestRecipes={handleSuggestRecipes}
              onUpdatePreferences={(updates) => {
                handleUpdatePreferences({
                  dietType: updates.dietType,
                  clinicalRestrictions: updates.clinicalRestrictions,
                  dailyWaterGoal: updates.dailyWaterGoal ?? preferences.dailyWaterGoal,
                  clinicalTreatment: updates.clinicalTreatment ?? preferences.clinicalTreatment,
                  prescriptionMealIntervalHours: updates.prescriptionMealIntervalHours ?? preferences.prescriptionMealIntervalHours,
                  reminders: updates.reminders ?? preferences.reminders,
                });
              }}
              currentRestrictions={preferences.clinicalRestrictions}
              userId={userId}
              isPremium={paywall.isPremium}
              locale={locale}
              onShowPaywall={() => setShowSubscriptionPlans(true)}
            />

            <MealPlanner 
              preferences={preferences}
              pantry={pantry}
              externalRecipes={externalRecipes}
              onClearExternalRecipes={() => setExternalRecipes(null)}
              userId={userId}
              isPremium={paywall.isPremium}
              locale={locale}
              onShowPaywall={() => setShowSubscriptionPlans(true)}
            />

          </div>

        </div>

      </main>

      <footer className="text-center py-6 mt-12 text-[10px] text-stone-400 font-bold border-t border-stone-100 flex flex-col items-center gap-1.5 max-w-sm mx-auto p-4 leading-normal">
        <div>PersonalDiet — Seu Organizador Pessoal de Receitas e Dietas</div>
        <div className="bg-stone-100 px-2 py-0.5 rounded text-stone-500 border border-stone-200/40">v3.0.0-pwa (Economia & Inteligência)</div>
        <MedicalDisclaimer locale={locale} className="mt-2" />
      </footer>

      <InstallPwaBanner />

      <WhoAmI 
        preferences={preferences}
        onSave={handleSavePreferences}
        isOpen={showWhoAmI}
        onClose={() => setShowWhoAmI(false)}
      />

      {showSubscriptionPlans && (
        <SubscriptionPlans
          userId={userId}
          accessToken={session.access_token}
          locale={locale}
          onClose={() => setShowSubscriptionPlans(false)}
          currentStatus={paywall.status}
        />
      )}

      {showSubscriptionManager && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl border border-pink-100 flex flex-col max-h-[90vh] overflow-hidden animate-fade-in-up">
            <div className="p-4 border-b border-stone-50 flex items-center justify-between">
              <h2 className="text-base font-extrabold text-stone-800 font-heading">
                {t(locale, "manageSubscription")}
              </h2>
              <button
                onClick={() => setShowSubscriptionManager(false)}
                className="p-2 rounded-full hover:bg-stone-50 text-stone-400 hover:text-stone-600 transition-colors touch-target"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <SubscriptionManager
                status={paywall.status}
                trialEndsAt={paywall.trialEndsAt}
                plan={paywall.plan}
                locale={locale}
                onOpenPlans={() => {
                  setShowSubscriptionManager(false);
                  setShowSubscriptionPlans(true);
                }}
              />
            </div>
          </div>
        </div>
      )}

      <Analytics />
    </div>
  );
}
