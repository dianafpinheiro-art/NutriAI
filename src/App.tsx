import { useState, useEffect, FormEvent } from "react";
import { Toaster, toast } from "sonner";
import { 
  Heart, 
  Settings, 
  Sparkles, 
  Award, 
  Sliders, 
  Activity, 
  RefreshCw,
  Plus,
  Trash2,
  Syringe,
  AlertCircle
} from "lucide-react";
import { UserPreferences, PantryIngredient, RecipeResult } from "./types";

// Inner Components
import HydrationTracker from "./components/HydrationTracker";
import SymptomTracker from "./components/SymptomTracker";
import MounjaroMonitor from "./components/MounjaroMonitor";
import PantryScanner from "./components/PantryScanner";
import MealPlanner from "./components/MealPlanner";
import InstallPwaBanner from "./components/InstallPwaBanner";

export default function App() {
  const [preferences, setPreferences] = useState<UserPreferences>({
    excludedIngredients: ["berinjela", "coentro"],
    clinicalRestrictions: ["lactose"],
    clinicalTreatment: "mounjaro",
    dietType: "low-carb",
    dailyWaterGoal: 2500,
  });

  const [pantry, setPantry] = useState<PantryIngredient[]>([]);
  const [externalRecipes, setExternalRecipes] = useState<RecipeResult[] | null>(null);
  const [showPreferencesEditor, setShowPreferencesEditor] = useState(false);

  // Form input states for direct reactivity and validation
  const [newExcluded, setNewExcluded] = useState("");

  useEffect(() => {
    // Load state from localStorage on startup
    const savedPrefs = localStorage.getItem("nutri_preferences");
    const savedPantry = localStorage.getItem("nutri_pantry_items");

    if (savedPrefs) {
      try {
        setPreferences(JSON.parse(savedPrefs));
      } catch (e) {
        console.error(e);
      }
    }
    if (savedPantry) {
      try {
        setPantry(JSON.parse(savedPantry));
      } catch (e) {
        console.error(e);
      }
    }

    // TriggerSonner PWA interactive notification for update availability on second startup
    setTimeout(() => {
      toast("Nova versão disponível (v2.1.0-pwa)!", {
        description: "Mais ágil, com correções de rodízio e alérgenos. Atualizar?",
        action: {
          label: "Atualizar",
          onClick: () => {
            toast.success("Atualizando cache estável...");
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        },
        duration: 10000,
      });
    }, 3000);
  }, []);

  const handleUpdatePreferences = (updated: Partial<UserPreferences>) => {
    const next = { ...preferences, ...updated };
    setPreferences(next);
    localStorage.setItem("nutri_preferences", JSON.stringify(next));
  };

  const handleAddExcluded = (e: FormEvent) => {
    e.preventDefault();
    if (!newExcluded.trim()) return;
    const cleanTerm = newExcluded.trim().toLowerCase();
    
    if (preferences.excludedIngredients.includes(cleanTerm)) {
      alert("Este ingrediente já está banido!");
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

  // Called from pantry scanner when Gemini suggests recipes
  const handleSuggestRecipes = async (items: PantryIngredient[]) => {
    toast.promise(
      fetch("/api/gemini/generate-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences, pantry: items, actionType: "suggest-recipes-pantry" }),
      }).then(res => res.json()),
      {
        loading: "Escanenado despensa e gerando receitas saudáveis com Gemini...",
        success: (recipes) => {
          setExternalRecipes(recipes);
          return "Receitas personalizadas geradas com sucesso!";
        },
        error: "Erro ao gerar receitas da geladeira."
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-800 pb-20 portrait-safe font-body">
      {/* Sonner Toaster Container configured */}
      <Toaster position="top-center" richColors />

      {/* Main Header visual branding */}
      <header className="sticky top-0 z-40 bg-[#fafaf9]/85 backdrop-blur-md border-b border-stone-100 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-tr from-pink-400 to-purple-400 rounded-xl flex items-center justify-center text-white shadow-md shadow-pink-100 animate-spin-slow">
            <Heart className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-stone-800 font-heading leading-none">NutriAI</h1>
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Suporte Clínico Avançado</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block text-[10px] font-bold px-2.5 py-1 bg-green-50 text-green-700 border border-green-100 rounded-full">
            ● PWA Ativo / Offline OK
          </span>
          <button
            onClick={() => setShowPreferencesEditor(!showPreferencesEditor)}
            className="p-2 bg-white border border-stone-100 rounded-xl shadow-sm text-stone-500 hover:text-pink-500 hover:bg-pink-50/20 transition-all btn-interactive touch-target"
            title="Preferências Clínicas"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Primary Container Frame */}
      <main className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* Floating Editor de Preferências & Alérgenos Clínicos */}
        {showPreferencesEditor && (
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-pink-100 animate-fade flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-pink-500" />
                <h3 className="font-heading font-extrabold text-stone-800 text-sm">Controle de Preferências e Restrições Clínicas</h3>
              </div>
              <button 
                onClick={() => setShowPreferencesEditor(false)}
                className="text-xs text-stone-400 hover:text-stone-600 font-bold"
              >
                Ocultar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Clinical treatment details */}
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-heading font-bold text-stone-700 block mb-1">Tratamento Clínico (Peptídeos GLP-1)</label>
                  <select
                    value={preferences.clinicalTreatment}
                    onChange={(e) => handleUpdatePreferences({ clinicalTreatment: e.target.value as any })}
                    className="w-full text-xs p-2.5 outline-none border border-stone-200 rounded-xl bg-stone-50 font-bold cursor-pointer focus:border-pink-300 focus:bg-white transition-all"
                  >
                    <option value="none">Nenhum em andamento</option>
                    <option value="mounjaro">Tirzepatida (Mounjaro)</option>
                    <option value="ozempic">Semaglutida (Ozempic)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-heading font-bold text-stone-700 block mb-1">Estilo de Dieta Alvo</label>
                  <select
                    value={preferences.dietType}
                    onChange={(e) => handleUpdatePreferences({ dietType: e.target.value as any })}
                    className="w-full text-xs p-2.5 outline-none border border-stone-200 rounded-xl bg-stone-50 font-bold cursor-pointer focus:border-pink-300 focus:bg-white transition-all"
                  >
                    <option value="none">Dieta Padrão / Saudável</option>
                    <option value="low-carb">Dieta Baixo Carboidrato (Low-carb)</option>
                    <option value="cetogenica">Dieta Cetogênica</option>
                    <option value="mediterranea">Dieta Mediterrânea</option>
                    <option value="deficit-calorico">Dieta com Déficit Calórico</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-heading font-bold text-stone-700 block mb-1.5">Severidade e Condições Clínicas Coletivas</label>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleToggleRestriction("celiac")}
                      className={`p-2.5 rounded-xl text-left text-xs font-bold border flex items-center justify-between ${
                        preferences.clinicalRestrictions.includes("celiac")
                          ? "bg-red-50 text-red-700 border-red-100"
                          : "bg-stone-50 text-stone-600 border-stone-200/50"
                      }`}
                    >
                      <span>Diagnóstico de Doença Celíaca (Glúten-Free Estrito)</span>
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
                      <span>Intolerância Crônica à Lactose (Zero Laticínios)</span>
                      {preferences.clinicalRestrictions.includes("lactose") && "✓"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Exclusion lists */}
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-heading font-bold text-stone-700 block mb-1">Meta Hidratação Diária (ml)</label>
                  <input
                    type="number"
                    value={preferences.dailyWaterGoal}
                    onChange={(e) => handleUpdatePreferences({ dailyWaterGoal: parseInt(e.target.value) || 2000 })}
                    className="w-full text-xs p-2.5 outline-none border border-stone-200 rounded-xl bg-stone-50 font-bold focus:border-pink-300 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-heading font-bold text-stone-700 block mb-1">Excluir Ingrediente por Preferência Pessoal (Banir)</label>
                  <form onSubmit={handleAddExcluded} className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Ex: cebola, pimenta, abacate"
                      value={newExcluded}
                      onChange={(e) => setNewExcluded(e.target.value)}
                      className="w-full text-xs p-2.5 outline-none border border-stone-200 rounded-xl bg-stone-50 font-semibold focus:border-pink-300 focus:bg-white transition-all"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold rounded-xl btn-interactive"
                    >
                      Banir
                    </button>
                  </form>
                  
                  {preferences.excludedIngredients.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 max-h-24 overflow-y-auto border border-stone-50 p-2 rounded-xl">
                      {preferences.excludedIngredients.map((ing) => (
                        <span 
                          key={ing} 
                          className="inline-flex items-center gap-1 text-[10px] font-bold bg-stone-100 hover:bg-red-50 text-stone-600 hover:text-red-700 px-2 py-1 rounded-lg transition-colors cursor-pointer border border-stone-200/40"
                          onClick={() => handleRemoveExcluded(ing)}
                          title="Clique para remover banimento"
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

        {/* GRID LAYOUT FOR CORE UTILITIES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* LEFT COLUMN: Trackers and sensors */}
          <div className="flex flex-col gap-6">
            
            {/* Feature 5: Hydration */}
            <HydrationTracker dailyGoal={preferences.dailyWaterGoal} />

            {/* Feature 2: Nausea and clinical symptoms */}
            <SymptomTracker />

            {/* Feature 4: Ozempic/Mounjaro injection monitor with visual Body Map */}
            <MounjaroMonitor treatmentType={preferences.clinicalTreatment} />

          </div>

          {/* RIGHT COLUMN: Pantries and scanners */}
          <div className="flex flex-col gap-6">
            
            {/* Feature 3: Scanner, product checking, computerized vision simulated dropzones */}
            <PantryScanner 
              onSuggestRecipes={handleSuggestRecipes}
              onUpdatePreferences={(updates) => {
                handleUpdatePreferences({
                  dietType: updates.dietType,
                  clinicalRestrictions: updates.clinicalRestrictions,
                  dailyWaterGoal: updates.dailyWaterGoal ?? preferences.dailyWaterGoal,
                  clinicalTreatment: updates.clinicalTreatment ?? preferences.clinicalTreatment,
                });
              }}
              currentRestrictions={preferences.clinicalRestrictions}
            />

            {/* Feature 1 & Exporter: Meal planners, checklists and medical CSV files */}
            <MealPlanner 
              preferences={preferences}
              pantry={pantry}
              externalRecipes={externalRecipes}
              onClearExternalRecipes={() => setExternalRecipes(null)}
            />

          </div>

        </div>

      </main>

      {/* Footer credits and standalone app standalone indicators */}
      <footer className="text-center py-6 mt-12 text-[10px] text-stone-400 font-bold border-t border-stone-100 flex flex-col items-center gap-1.5 max-w-sm mx-auto p-4 leading-normal">
        <div>NutriAI — Protocolo de Inteligência Clínica Nutricional</div>
        <div className="bg-stone-100 px-2 py-0.5 rounded text-stone-500 border border-stone-200/40">v2.1.0-pwa (Estabilidade Total)</div>
      </footer>

      {/* PWA banner to slide-up */}
      <InstallPwaBanner />
    </div>
  );
}
