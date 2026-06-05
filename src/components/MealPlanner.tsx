import { useState, useEffect } from "react";
import { Sparkles, ShoppingBag, CheckSquare, Square, Check, RefreshCw, Calendar, Download, AlertOctagon, Heart, ListPlus, Printer } from "lucide-react";
import { DayMealPlan, PantryIngredient, UserPreferences, RecipeResult, ShoppingItem } from "../types";
import { t } from "../i18n";

interface MealPlannerProps {
  preferences: UserPreferences;
  pantry: PantryIngredient[];
  // If parent wants to provide recommended recipes from fridge scans
  externalRecipes: RecipeResult[] | null;
  onClearExternalRecipes: () => void;
}

export default function MealPlanner({ preferences, pantry, externalRecipes, onClearExternalRecipes }: MealPlannerProps) {
  const [menuLoading, setMenuLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState<DayMealPlan[]>([]);
  const [recipesList, setRecipesList] = useState<RecipeResult[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [activeSegment, setActiveSegment] = useState<"meals" | "recipes" | "shopping">("meals");

  useEffect(() => {
    // Load local storage states if already exists
    const savedPlan = localStorage.getItem("nutri_current_mealplan");
    const savedRecipes = localStorage.getItem("nutri_current_recipes");
    const savedShopping = localStorage.getItem("nutri_current_shopping");

    if (savedPlan) setMealPlan(JSON.parse(savedPlan));
    if (savedRecipes) setRecipesList(JSON.parse(savedRecipes));
    if (savedShopping) setShoppingList(JSON.parse(savedShopping));
  }, []);

  // When parent triggers recipe scans from fridge scan
  useEffect(() => {
    if (externalRecipes && externalRecipes.length > 0) {
      setRecipesList(externalRecipes);
      localStorage.setItem("nutri_current_recipes", JSON.stringify(externalRecipes));
      setActiveSegment("recipes"); // jump immediately to recipes tab!
      onClearExternalRecipes();
    }
  }, [externalRecipes]);

  // Generate Menu
  const generateMealPlan = async () => {
    setMenuLoading(true);
    setMealPlan([]);
    
    try {
      const response = await fetch("/api/gemini/generate-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferences,
          pantry,
          actionType: "generate-weekly-menu",
          locale: preferences.locale ?? "pt",
          languageInstruction: t(preferences.locale ?? "pt", "mealPlanLanguageInstruction"),
        }),
      });

      if (!response.ok) {
        let errorBody = "";
        try {
          errorBody = await response.text();
        } catch {
          errorBody = "(Não foi possível ler o corpo do erro)";
        }
        console.error(`Erro de Rede / HTTP: Status ${response.status} - ${response.statusText}`, errorBody);
        throw new Error(`HTTP ${response.status} (${response.statusText}). Detalhes do erro: ${errorBody.substring(0, 300)}`);
      }

      const contentType = response.headers.get("Content-Type") || "";
      if (!contentType.includes("application/json")) {
        let bodySnippet = "";
        try {
          bodySnippet = await response.text();
        } catch {
          bodySnippet = "(Não foi possível obter o corpo)";
        }
        console.error(`A resposta recebida não é um JSON válido. Content-Type: ${contentType}`, bodySnippet);
        throw new Error(`Tipagem de resposta incorreta (Esperava JSON, mas o Content-Type do servidor foi: ${contentType}). Snippet do conteúdo: ${bodySnippet.substring(0, 250)}`);
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setMealPlan(data);
        localStorage.setItem("nutri_current_mealplan", JSON.stringify(data));
        
        // Auto convert to shopping list with exact quantities!
        const generatedShoppingItems: ShoppingItem[] = [];
        data.forEach((day: any) => {
          day.meals.forEach((meal: any) => {
            meal.ingredients.forEach((ing: any) => {
              // Avoid exact duplicate names for checklist comfort
              const exists = generatedShoppingItems.find(item => item.name.toLowerCase() === ing.name.toLowerCase());
              if (!exists) {
                generatedShoppingItems.push({
                  id: Math.random().toString(36).substring(2, 9),
                  name: ing.name,
                  quantity: ing.quantity,
                  checked: false,
                  category: meal.type,
                });
              }
            });
          });
        });

        setShoppingList(generatedShoppingItems);
        localStorage.setItem("nutri_current_shopping", JSON.stringify(generatedShoppingItems));
        alert("Novo cardápio montado com sucesso e lista de compras exata sincronizada!");
      } else {
        throw new Error("Formato inválido retornado do motor de inteligência.");
      }
    } catch (err: any) {
      console.error("Erro completo na geração do plano de refeições:", err);
      alert("Erro ao conectar ao motor clínico.\n\n" + err?.message);
    } finally {
      setMenuLoading(false);
    }
  };

  const handleToggleShoppingItem = (id: string) => {
    const updated = shoppingList.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setShoppingList(updated);
    localStorage.setItem("nutri_current_shopping", JSON.stringify(updated));
  };

  const handleClearShoppingList = () => {
    if (confirm("Limpar lista de compras atual?")) {
      setShoppingList([]);
      localStorage.removeItem("nutri_current_shopping");
    }
  };

  // Consolidar prontuário de saúde do paciente em formato CSV estruturado
  const handleExportPatientCSV = () => {
    // Collect from storage to ensure we encompass all components
    const hLogs = JSON.parse(localStorage.getItem("nutri_hydration_logs") || "[]");
    const symLogs = JSON.parse(localStorage.getItem("nutri_symptom_logs") || "[]");
    const dLogs = JSON.parse(localStorage.getItem("nutri_dose_logs") || "[]");

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // supports Excel portuguese characters
    
    // Header
    csvContent += "=== PRONTUÁRIO CLÍNICO E NUTRITIONAL CONSOLIDADO ===\n\n";
    
    // User Settings
    csvContent += "PERFIL DO USUÁRIO\n";
    csvContent += `Dieta Selecionada;${preferences.dietType.toUpperCase()}\n`;
    csvContent += `Tratamento Ativo;${preferences.clinicalTreatment.toUpperCase()}\n`;
    csvContent += `Meta Diária de Hidratação;${preferences.dailyWaterGoal} ml\n`;
    csvContent += `Restrições Clínicas;${preferences.clinicalRestrictions.join(", ") || "Nenhuma"}\n`;
    csvContent += `Ingredientes Banidos;${preferences.excludedIngredients.join(", ") || "Nenhum"}\n\n`;

    // Hydration Table
    csvContent += "HISTÓRICO DE HIDRATAÇÃO\n";
    csvContent += "ID;Data;Quantidade (ml)\n";
    hLogs.forEach((log: any) => {
      csvContent += `${log.id};${log.date};${log.amount}\n`;
    });
    csvContent += "\n";

    // Meds Table
    csvContent += "MONITORAMENTO DE MEDICAMENTO (Mounjaro/Ozempic)\n";
    csvContent += "ID;Data;Medicação;Dose (mg);Local de Aplicação\n";
    dLogs.forEach((log: any) => {
      csvContent += `${log.id};${log.date};${log.treatmentType};${log.doseMg};${log.injectionSite}\n`;
    });
    csvContent += "\n";

    // Symptoms Table
    csvContent += "HISTÓRICO DE REAÇÕES DE DISPNÉIA OU NÁUSEAS\n";
    csvContent += "ID;Data;Intensidade (1 a 10);Sintomas;Gatilhos Associados\n";
    symLogs.forEach((log: any) => {
      csvContent += `${log.id};${log.date};${log.intensity};${log.symptoms.join(", ")};${log.triggers.join(", ")}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `prontuario_nutriai_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Segment controls */}
      <div className="grid grid-cols-3 bg-stone-100 p-1.5 rounded-2xl w-full">
        <button
          onClick={() => setActiveSegment("meals")}
          className={`py-2 px-3 text-xs font-heading font-extrabold rounded-xl transition-all ${
            activeSegment === "meals" ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700"
          }`}
        >
          Cardápio Semanal
        </button>
        <button
          onClick={() => setActiveSegment("recipes")}
          className={`py-2 px-3 text-xs font-heading font-extrabold rounded-xl transition-all flex items-center justify-center gap-1 ${
            activeSegment === "recipes" ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700"
          }`}
        >
          Receitas IA 
          {recipesList.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span>
          )}
        </button>
        <button
          onClick={() => setActiveSegment("shopping")}
          className={`py-2 px-3 text-xs font-heading font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeSegment === "shopping" ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700"
          }`}
        >
          Lista de Compras
          {shoppingList.length > 0 && (
            <span className="bg-pink-100 text-pink-600 font-bold text-[9px] px-1.5 py-0.5 rounded-full">
              {shoppingList.filter(s => !s.checked).length}
            </span>
          )}
        </button>
      </div>

      {/* Warnings bar for personalized exclusions */}
      <div className="bg-amber-50/60 border border-amber-100/50 p-3 rounded-2xl text-[11px] text-amber-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0" />
          <div className="leading-normal">
            <strong>Filtro Clínico Ativo:</strong> Exclusão de {preferences.excludedIngredients.join(", ") || "nenhum ingrediente"}. 
            {preferences.clinicalRestrictions.includes("celiac") && " Gluten-free obrigatório."}
            {preferences.clinicalRestrictions.includes("lactose") && " Lactose-free obrigatório."}
          </div>
        </div>
        <button 
          onClick={handleExportPatientCSV}
          className="px-3 py-1.5 bg-white text-stone-700 font-extrabold border border-stone-100 hover:bg-stone-50 text-[10px] rounded-xl flex items-center gap-1 shrink-0 btn-interactive shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-stone-500" /> Exportar Prontuário CSV
        </button>
      </div>

      {/* Section 1: Weekly schedule planner */}
      {activeSegment === "meals" && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-heading font-extrabold text-stone-800">Cardápio Inteligente Personalizado</h3>
              <p className="text-xs text-stone-500">Desenvolvido com IA considerando sua condição metabólica</p>
            </div>
            {mealPlan.length > 0 && (
              <button
                onClick={generateMealPlan}
                disabled={menuLoading}
                className="text-xs text-pink-500 font-extrabold flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${menuLoading ? "animate-spin" : ""}`} /> Novo Cardápio
              </button>
            )}
          </div>

          {menuLoading && (
            <div className="space-y-4">
              <div className="font-medium text-xs text-center text-stone-500 animate-pulse py-4">
                <p>Analisando restrições de saúde do paciente...</p>
                <p className="text-[10px] text-stone-400 mt-1">Garantindo a remoção estrita de alergênicos e alimentos banidos...</p>
              </div>
              
              {/* Production Skeleton Loaders matching exact target layout */}
              <div className="border border-stone-100 rounded-3xl p-5 bg-white space-y-4">
                <div className="h-4 bg-stone-100 rounded-md w-1/4 animate-pulse"></div>
                <div className="space-y-3">
                  <div className="h-10 bg-stone-50 rounded-xl animate-pulse"></div>
                  <div className="h-10 bg-stone-50 rounded-xl animate-pulse"></div>
                  <div className="h-10 bg-stone-50 rounded-xl animate-pulse"></div>
                </div>
              </div>
            </div>
          )}

          {!menuLoading && mealPlan.length === 0 && (
            <div className="text-center py-10 bg-white border border-stone-100 rounded-3xl p-6 shadow-sm">
              <ShoppingBag className="w-10 h-10 mx-auto text-pink-400 mb-3" />
              <h4 className="font-heading font-extrabold text-stone-700 text-sm">Pronto para elaborar seu cardápio?</h4>
              <p className="text-xs text-stone-500 max-w-xs mx-auto mt-1 mb-6">
                Geramos refeições leves, saudáveis e sem alérgenos cruzados para facilitar sua rotina.
              </p>
              <button
                onClick={generateMealPlan}
                className="px-5 py-3 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold rounded-2xl shadow-md shadow-pink-100 btn-interactive mx-auto"
              >
                Gerar Cardápio Inteligente
              </button>
            </div>
          )}

          {!menuLoading && mealPlan.length > 0 && (
            <div className="space-y-6">
              {mealPlan.map((day) => (
                <div key={day.dayName} className="bg-white border border-stone-100 rounded-3xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-stone-50 pb-2">
                    <Calendar className="w-4 h-4 text-pink-500" />
                    <h4 className="font-heading font-extrabold text-sm text-stone-800">{day.dayName}</h4>
                  </div>

                  <div className="space-y-3">
                    {day.meals.map((meal) => (
                      <div key={meal.type} className="p-3 bg-stone-50/50 hover:bg-stone-50 border border-stone-100/50 rounded-2xl flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase py-0.5 px-2 bg-pink-50 text-pink-600 border border-pink-100/50 rounded-full">
                            {meal.type === "cafe-da-manha" ? "Café da Manhã" : meal.type === "almoco" ? "Almoço" : meal.type === "lanche" ? "Lanche Tarde" : "Jantar"}
                          </span>
                          {meal.calories && (
                            <span className="text-[10px] text-stone-400 font-semibold">{meal.calories} kcal</span>
                          )}
                        </div>

                        <div>
                          <strong className="text-xs font-heading font-extrabold text-stone-800 block">{meal.name}</strong>
                          <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
                            {meal.instructions}
                          </p>
                        </div>

                        {/* Ingredients listed */}
                        <div className="mt-1 pt-2 border-t border-stone-100 grid grid-cols-2 gap-2">
                          {meal.ingredients.map((ing, idx) => (
                            <div key={idx} className="text-[10px] text-stone-600 flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-pink-400"></span>
                              <span className="font-bold">{ing.name}:</span>
                              <span className="text-stone-400 font-medium">{ing.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Section 2: Custom Recipes based on fridge pantry */}
      {activeSegment === "recipes" && (
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-heading font-extrabold text-stone-800">Receitas Sugeridas da Despensa</h3>
            <p className="text-xs text-stone-500">Aproveitamento máximo com receitas banindo os ingredientes indesejados</p>
          </div>

          {recipesList.length === 0 ? (
            <div className="text-center py-10 bg-white border border-stone-100 rounded-3xl p-6">
              <ShoppingBag className="w-10 h-10 mx-auto text-purple-400 mb-2" />
              <h4 className="font-heading font-extrabold text-stone-700 text-sm">Sugestão de Receitas Vazia</h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                Acesse a aba **"Foto da Despensa"** ou insira itens na sua geladeira para acionar o motor de receitas inteligentes!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recipesList.map((recipe, idx) => (
                <div key={idx} className="bg-white border border-stone-100 rounded-3xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="font-heading font-extrabold text-sm text-stone-800 flex items-center gap-1.5">
                        <Heart className="w-4 h-4 text-pink-500" />
                        {recipe.title}
                      </h4>
                      <span className="text-[10px] text-stone-400 font-bold block mt-0.5">Tempo Prep: {recipe.prepTime}</span>
                    </div>
                    <span className="shrink-0 bg-green-50 text-green-700 border border-green-100 font-bold text-[10px] px-2.5 py-1 rounded-full">
                      🔥 {recipe.matchPercentage}% Uso Dispensa
                    </span>
                  </div>

                  <div>
                    <h5 className="text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1.5">Ingredientes</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {recipe.ingredients.map((ing, iIdx) => (
                        <div key={iIdx} className="text-[11px] text-stone-600 flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-green-500 shrink-0" />
                          {ing}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-stone-50 pt-3">
                    <h5 className="text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1.5">Instruções Práticas de Preparo</h5>
                    <ol className="space-y-1.5 text-xs text-stone-500 list-decimal pl-4 leading-relaxed">
                      {recipe.instructions.map((inst, insIdx) => (
                        <li key={insIdx}>{inst}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Section 3: Checked checklists for grocery shopping */}
      {activeSegment === "shopping" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-heading font-extrabold text-stone-800">Checklist de Compras Semanal</h3>
              <p className="text-xs text-stone-500">Mapeamento com quantidades exatas gerado da sua dieta ativa</p>
            </div>
            {shoppingList.length > 0 && (
              <button 
                onClick={handleClearShoppingList}
                className="text-stone-400 hover:text-red-500 text-xs font-semibold"
              >
                Limpar Lista
              </button>
            )}
          </div>

          {shoppingList.length === 0 ? (
            <div className="text-center py-10 bg-white border border-stone-100 rounded-3xl p-6">
              <ShoppingBag className="w-10 h-10 mx-auto text-stone-300 mb-2" />
              <h4 className="font-heading font-extrabold text-stone-700 text-sm">Lista de compras vazia</h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                Gere um **"Cardápio Inteligente"** para ver a lista de compras semanal sincronizada instantaneamente!
              </p>
            </div>
          ) : (
            <div className="bg-white border border-stone-100 p-4 rounded-3xl space-y-2 max-h-[400px] overflow-y-auto">
              {shoppingList.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => handleToggleShoppingItem(item.id)}
                  className={`p-3 border rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all duration-150 ${
                    item.checked 
                      ? "bg-stone-50/70 border-stone-100 opacity-60 line-through"
                      : "bg-white border-stone-100 hover:border-pink-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-stone-400 shrink-0">
                      {item.checked ? (
                        <CheckSquare className="w-4 h-4 text-pink-500" />
                      ) : (
                        <Square className="w-4 h-4 text-stone-300" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-stone-700 block leading-tight">{item.name}</span>
                      <span className="text-[10px] text-stone-400 block font-semibold">{item.quantity}</span>
                    </div>
                  </div>
                  <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full">
                    {item.category === "cafe-da-manha" ? "Café" : item.category === "almoco" ? "Almoço" : item.category === "lanche" ? "Lanche" : "Jantar"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
