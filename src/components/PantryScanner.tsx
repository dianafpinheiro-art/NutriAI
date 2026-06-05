import { useState, useEffect, FormEvent } from "react";
import { Search, Plus, Trash2, Camera, FileText, AlertTriangle, ShieldCheck, CheckCircle2, RefreshCw, Upload, Sparkles, Check, Heart, X, CheckSquare, Square, Eye, Edit2 } from "lucide-react";
import { PantryIngredient, ClinicalRestriction, ReminderSettings } from "../types";

interface PantryScannerProps {
  onSuggestRecipes: (pantryItems: PantryIngredient[]) => void;
  onUpdatePreferences: (updates: {
    dietType: any;
    clinicalRestrictions: any[];
    dailyWaterGoal?: number;
    clinicalTreatment?: any;
    prescriptionMealIntervalHours?: number;
    reminders?: ReminderSettings;
  }) => void;
  currentRestrictions: ClinicalRestriction[];
}

export default function PantryScanner({ onSuggestRecipes, onUpdatePreferences, currentRestrictions }: PantryScannerProps) {
  const [activeTab, setActiveTab] = useState<"inventory" | "vision" | "pdf" | "labels">("inventory");
  const [ingredients, setIngredients] = useState<PantryIngredient[]>([]);
  
  // Manual Ingredient Form
  const [manName, setManName] = useState("");
  const [manQty, setManQty] = useState("");
  const [manCategory, setManCategory] = useState("Proteínas");

  // UPGRADED Vision Multi-Carousel State
  // 3 slots of fridge, 3 slots of pantry
  const [fridgePhotos, setFridgePhotos] = useState<(string | null)[]>([null, null, null]);
  const [pantryPhotos, setPantryPhotos] = useState<(string | null)[]>([null, null, null]);
  const [activePhotoCategory, setActivePhotoCategory] = useState<"fridge" | "pantry">("fridge");
  
  const [isVisionScanning, setIsVisionScanning] = useState(false);
  const [visionDetectedItems, setVisionDetectedItems] = useState<(PantryIngredient & { checked: boolean })[]>([]);
  
  // PDF Simulator
  const [pdfFile, setPdfFile] = useState<string | null>(null);
  const [isPdfParsing, setIsPdfParsing] = useState(false);
  const [parsedPrescription, setParsedPrescription] = useState<any | null>(null);

  // Label Scanner
  const [labelText, setLabelText] = useState("");
  const [allergenType, setAllergenType] = useState<"celiac" | "lactose">("celiac");
  const [isLabelAnalyzing, setIsLabelAnalyzing] = useState(false);
  const [labelResult, setLabelResult] = useState<any | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("nutri_pantry_items");
    if (saved) {
      try {
        setIngredients(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    } else {
      // Default initial pantry
      const defaults: PantryIngredient[] = [
        { id: "1", name: "Ovos Orgânicos", quantity: "6 unidades", category: "Proteínas" },
        { id: "2", name: "Peito de Frango", quantity: "400g", category: "Proteínas" },
        { id: "3", name: "Brócolis Fresco", quantity: "1 maço", category: "Legumes" },
        { id: "4", name: "Azeite de Oliva", quantity: "1 garrafa", category: "Condimentos" }
      ];
      setIngredients(defaults);
      localStorage.setItem("nutri_pantry_items", JSON.stringify(defaults));
    }
  }, []);

  const saveInventory = (latest: PantryIngredient[]) => {
    setIngredients(latest);
    localStorage.setItem("nutri_pantry_items", JSON.stringify(latest));
  };

  const handleManualAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!manName.trim()) return;

    const newItem: PantryIngredient = {
      id: Math.random().toString(36).substring(2, 9),
      name: manName.trim(),
      quantity: manQty.trim() || "A gosto",
      category: manCategory,
    };

    const updated = [...ingredients, newItem];
    saveInventory(updated);
    setManName("");
    setManQty("");
  };

  const handleDeleteItem = (id: string) => {
    const updated = ingredients.filter(i => i.id !== id);
    saveInventory(updated);
  };

  const clearPantry = () => {
    if (confirm("Deseja realmente limpar toda sua geladeira?")) {
      saveInventory([]);
    }
  };

  // Preset unsplash simulation sources
  const photoLibrary = {
    fridge: [
      "https://images.unsplash.com/photo-1571175452283-bc241517565e?w=400&q=80", // fruit jar shelves
      "https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=400&q=80", // crisper vegetables
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80"  // glass prep bowls
    ],
    pantry: [
      "https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=400&q=80", // grains/oils
      "https://images.unsplash.com/photo-1588854337115-1c67d9247e4d?w=400&q=80", // avocados baskets
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80"  // oats/chocolate
    ]
  };

  const handleAddPhotoSlot = (category: "fridge" | "pantry", slotIdx: number) => {
    const samplePhoto = photoLibrary[category][slotIdx];
    if (category === "fridge") {
      const next = [...fridgePhotos];
      next[slotIdx] = samplePhoto;
      setFridgePhotos(next);
    } else {
      const next = [...pantryPhotos];
      next[slotIdx] = samplePhoto;
      setPantryPhotos(next);
    }
  };

  const handleRemovePhotoSlot = (category: "fridge" | "pantry", slotIdx: number) => {
    if (category === "fridge") {
      const next = [...fridgePhotos];
      next[slotIdx] = null;
      setFridgePhotos(next);
    } else {
      const next = [...pantryPhotos];
      next[slotIdx] = null;
      setPantryPhotos(next);
    }
    setVisionDetectedItems([]);
  };

  // Vision Computer Multi-Image processing simulator
  const handleScanPhotos = async () => {
    // Count active photo files
    const totalPhotos = [...fridgePhotos, ...pantryPhotos].filter(p => p !== null).length;
    if (totalPhotos === 0) {
      alert("Por favor adicione pelo menos uma foto de geladeira ou dispensa para iniciar análise!");
      return;
    }

    setIsVisionScanning(true);
    setVisionDetectedItems([]);

    try {
      const response = await fetch("/api/gemini/analyze-pantry-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: "carousel-multi-base64-data", totalPhotos }),
      });
      const data = await response.json();
      
      if (data.detectedIngredients) {
        // Enforce checklist checkbox selection state (all verified true by default, editable in client UI)
        const parsed = data.detectedIngredients.map((item: any) => ({
          ...item,
          id: Math.random().toString(36).substring(2, 9),
          checked: true,
        }));
        setVisionDetectedItems(parsed);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao conectar à API de visao inteligente do Gemini.");
    } finally {
      setIsVisionScanning(false);
    }
  };

  const handleToggleCheckItem = (id: string) => {
    setVisionDetectedItems(
      visionDetectedItems.map(item => item.id === id ? { ...item, checked: !item.checked } : item)
    );
  };

  const handleEditDetectedItem = (id: string, field: "name" | "quantity", value: string) => {
    setVisionDetectedItems(
      visionDetectedItems.map(item => item.id === id ? { ...item, [field]: value } : item)
    );
  };

  const handleConfirmVisionItems = () => {
    const selected = visionDetectedItems.filter(item => item.checked);
    if (selected.length === 0) {
      alert("Selecione pelo menos um alimento no formulário de confirmação!");
      return;
    }

    // Clean client identifiers and add
    const mapped = selected.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      category: item.category || "Despensa"
    }));

    const updated = [...ingredients, ...mapped];
    saveInventory(updated);
    
    // Clear vision scanner drawer after success
    setVisionDetectedItems([]);
    setFridgePhotos([null, null, null]);
    setPantryPhotos([null, null, null]);
    setActiveTab("inventory");
    alert(`Sucesso! ${mapped.length} ingredientes confirmados e adicionados com segurança ao seu estoque.`);
  };

  // PDF Doctor Prescription Simulation Trigger
  const handlePdfSimulate = async () => {
    setIsPdfParsing(true);
    setPdfFile("prescricao_nutricional.pdf");
    setParsedPrescription(null);

    try {
      const response = await fetch("/api/gemini/parse-prescription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: "prescricao.pdf", fileContent: "mock-base-64" }),
      });
      const data = await response.json();
      setParsedPrescription(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPdfParsing(false);
    }
  };

  const handleApplyDietRules = () => {
    if (!parsedPrescription) return;

    onUpdatePreferences({
      dietType: parsedPrescription.detectedDiet,
      clinicalRestrictions: parsedPrescription.detectedRestrictions,
      dailyWaterGoal: parsedPrescription.waterGoalMl,
      clinicalTreatment: parsedPrescription.clinicalTreatment,
      prescriptionMealIntervalHours: parsedPrescription.mealIntervalHours || 3,
      reminders: {
        hydrationEnabled: true,
        hydrationIntervalMinutes: 120,
        mealEnabled: true,
        mealIntervalHours: parsedPrescription.mealIntervalHours || 3,
        activeStart: "08:00",
        activeEnd: "21:00",
      },
    });

    alert("As diretrizes nutricionais extraídas do PDF foram aplicadas com sucesso em suas preferências de perfil!");
    setParsedPrescription(null);
    setPdfFile(null);
  };

  // Allergen Label Scan Trigger
  const handleAnalyzeLabel = async () => {
    if (!labelText.trim()) {
      alert("Por favor insira os ingredientes do rótulo para escanear!");
      return;
    }

    setIsLabelAnalyzing(true);
    setLabelResult(null);

    try {
      const response = await fetch("/api/gemini/analyze-labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labelText, restrictionType: allergenType }),
      });
      const data = await response.json();
      setLabelResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLabelAnalyzing(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 flex flex-col gap-6">
      
      {/* Sub tabs configuration */}
      <div className="flex border-b border-stone-100 overflow-x-auto gap-2 pb-1.5 scrollbar-none">
        <button
          onClick={() => setActiveTab("inventory")}
          className={`px-4 py-2 text-xs font-heading font-extrabold whitespace-nowrap rounded-lg transition-all ${
            activeTab === "inventory" ? "bg-pink-50 text-pink-500" : "text-stone-500 hover:text-stone-700"
          }`}
        >
          Sua Geladeira ({ingredients.length})
        </button>
        <button
          onClick={() => setActiveTab("vision")}
          className={`px-4 py-2 text-xs font-heading font-extrabold whitespace-nowrap rounded-lg transition-all ${
            activeTab === "vision" ? "bg-pink-50 text-pink-500" : "text-stone-500 hover:text-stone-700"
          }`}
        >
          Fotos Despensa & Geladeira (IA)
        </button>
        <button
          onClick={() => setActiveTab("pdf")}
          className={`px-4 py-2 text-xs font-heading font-extrabold whitespace-nowrap rounded-lg transition-all ${
            activeTab === "pdf" ? "bg-pink-50 text-pink-500" : "text-stone-500 hover:text-stone-700"
          }`}
        >
          Ler PDF Prescrição
        </button>
        <button
          onClick={() => setActiveTab("labels")}
          className={`px-4 py-2 text-xs font-heading font-extrabold whitespace-nowrap rounded-lg transition-all ${
            activeTab === "labels" ? "bg-pink-50 text-pink-500" : "text-stone-500 hover:text-stone-700"
          }`}
        >
          Filtro alérgenos
        </button>
      </div>

      {/* Screen 1: Inventory panel */}
      {activeTab === "inventory" && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-extrabold text-stone-800 text-sm">O que você tem em casa?</h3>
              <p className="text-[11px] text-stone-400">Insira ingredientes ou use as fotos com Inteligência Artificial para escanear</p>
            </div>
            {ingredients.length > 0 && (
              <button 
                onClick={clearPantry}
                className="text-stone-400 hover:text-red-500 text-xs font-semibold"
              >
                Limpar Todos
              </button>
            )}
          </div>

          <form onSubmit={handleManualAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-2 border-b border-stone-50 pb-4">
            <input 
              type="text" 
              placeholder="Ex: Abobrinha, Peito de Frango" 
              value={manName}
              onChange={(e) => setManName(e.target.value)}
              className="text-xs p-2.5 outline-none border border-stone-100 rounded-xl bg-stone-50/50 focus:border-pink-300 focus:bg-white transition-all col-span-2 font-bold"
            />
            <input 
              type="text" 
              placeholder="Ex: 200g, 4 unidades" 
              value={manQty}
              onChange={(e) => setManQty(e.target.value)}
              className="text-xs p-2.5 outline-none border border-stone-100 rounded-xl bg-stone-50/50 focus:border-pink-300 focus:bg-white transition-all font-semibold"
            />
            <button
              type="submit"
              className="py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-bold text-center rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-pink-100 btn-interactive"
            >
              <Plus className="w-4 h-4" /> Adicionar
            </button>
          </form>

          {/* List ingredients in visual grid cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
            {ingredients.length === 0 ? (
              <div className="col-span-full text-center py-6 bg-stone-50 rounded-2xl">
                <p className="text-xs text-stone-400 font-medium">Sua geladeira está vazia!</p>
                <p className="text-[10px] text-stone-400">Adicione manualmente acima ou use a aba de Fotos Despensa/Geladeira.</p>
              </div>
            ) : (
              ingredients.map((item) => (
                <div key={item.id} className="p-3 bg-stone-50/50 border border-stone-100 rounded-xl flex items-center justify-between gap-2 hover:bg-stone-50 group transition-colors">
                  <div className="overflow-hidden">
                    <span className="text-xs font-bold text-stone-700 block truncate">{item.name}</span>
                    <span className="text-[10px] text-stone-400 block font-semibold">{item.quantity}</span>
                  </div>
                  <button 
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1 rounded text-stone-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Recipe suggestion based on fridge ingredients trigger */}
          {ingredients.length > 0 && (
            <button
              onClick={() => onSuggestRecipes(ingredients)}
              className="w-full mt-2 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90 text-white font-bold text-center rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md shadow-pink-100 btn-interactive"
            >
              <Sparkles className="w-4 h-4" /> Sugerir 3 Receitas com meus ingredientes (IA)
            </button>
          )}
        </div>
      )}

      {/* Upgraded Screen 2: Multi-Vision Carousel */}
      {activeTab === "vision" && (
        <div className="flex flex-col gap-5">
          <div>
            <h3 className="font-heading font-extrabold text-stone-800 text-sm">Escaneamento por Fotos Clínico</h3>
            <p className="text-[11px] text-stone-400">Suba até 3 fotos da Geladeira e 3 fotos da Despensa (Dispensa). O Gemini detectará todos os alimentos!</p>
          </div>

          {/* Category Toggle selector */}
          <div className="flex gap-2 p-1 bg-stone-100 rounded-xl">
            <button
              onClick={() => setActivePhotoCategory("fridge")}
              className={`flex-1 py-1.5 text-xs font-heading font-bold rounded-lg transition-all text-center ${
                activePhotoCategory === "fridge" ? "bg-white text-stone-800 shadow-sm" : "text-stone-500"
              }`}
            >
              ❄️ Geladeira (Máx: 3)
            </button>
            <button
              onClick={() => setActivePhotoCategory("pantry")}
              className={`flex-1 py-1.5 text-xs font-heading font-bold rounded-lg transition-all text-center ${
                activePhotoCategory === "pantry" ? "bg-white text-stone-800 shadow-sm" : "text-stone-500"
              }`}
            >
              📦 Despensa / Dispensa (Máx: 3)
            </button>
          </div>

          {/* Images Grid Slots for selected category */}
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((idx) => {
              const currentPhotos = activePhotoCategory === "fridge" ? fridgePhotos : pantryPhotos;
              const photo = currentPhotos[idx];

              return (
                <div key={idx} className="relative aspect-square rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50 flex flex-col items-center justify-center text-center overflow-hidden hover:bg-stone-100/50 transition-colors">
                  {photo ? (
                    <>
                      <img src={photo} alt="Slot da cozinha" className="w-full h-full object-cover" />
                      <button
                        onClick={() => handleRemovePhotoSlot(activePhotoCategory, idx)}
                        className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md"
                        title="Remover foto"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="absolute bottom-0 inset-x-0 bg-stone-900/40 text-white text-[8px] py-0.5 font-bold uppercase truncate">
                        Foto {idx + 1}
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => handleAddPhotoSlot(activePhotoCategory, idx)}
                      className="w-full h-full flex flex-col items-center justify-center p-2 text-stone-400 hover:text-pink-500 transition-colors"
                    >
                      <Camera className="w-6 h-6 mb-1 text-stone-300" />
                      <span className="text-[9px] font-bold uppercase leading-none">Simular</span>
                      <span className="text-[8px] text-stone-400 mt-1">Slot {idx + 1}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Prompt action trigger */}
          {visionDetectedItems.length === 0 && (
            <button
              onClick={handleScanPhotos}
              disabled={isVisionScanning || [...fridgePhotos, ...pantryPhotos].filter(p => p !== null).length === 0}
              className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-md shadow-pink-100 btn-interactive disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isVisionScanning ? "animate-spin" : ""}`} />
              {isVisionScanning ? "Processando imagens com Gemini..." : "Escanear Fotos Selecionadas (IA)"}
            </button>
          )}

          {/* CONFIRMAÇÃO DA IDENTIFICAÇÃO TABLE DRAWER */}
          {visionDetectedItems.length > 0 && (
            <div className="bg-gradient-to-tr from-pink-500/5 to-purple-500/5 border border-pink-100 rounded-2xl p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-pink-100/60 pb-2">
                <div>
                  <h4 className="text-xs font-heading font-extrabold text-pink-600">Confirmação da Identificação de Alimentos</h4>
                  <p className="text-[9px] text-stone-400">Verifique, edite e selecione apenas o que quer salvar</p>
                </div>
                <span className="text-[9px] bg-pink-500 text-white font-bold px-2 py-0.5 rounded-full uppercase">IA Ativa</span>
              </div>

              {/* Verified food items review list with inputs */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {visionDetectedItems.map((item) => (
                  <div key={item.id} className="flex gap-2 items-center bg-white border border-stone-100 p-2 rounded-xl text-xs hover:border-pink-300 transition-all">
                    
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => handleToggleCheckItem(item.id)}
                      className="p-1 rounded text-stone-400 transition-colors"
                    >
                      {item.checked ? (
                        <CheckSquare className="w-4 h-4 text-pink-500" />
                      ) : (
                        <Square className="w-4 h-4 text-stone-300" />
                      )}
                    </button>

                    {/* Edit fields directly in table cells */}
                    <div className="flex-1 min-w-0 grid grid-cols-2 gap-1.5">
                      <div>
                        <span className="text-[8px] text-stone-400 uppercase font-semibold leading-none">Alimento</span>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleEditDetectedItem(item.id, "name", e.target.value)}
                          disabled={!item.checked}
                          className="w-full text-xs font-bold leading-tight border-b border-dashed border-stone-200 outline-none text-stone-700 py-0.5 focus:border-pink-400"
                        />
                      </div>
                      <div>
                        <span className="text-[8px] text-stone-400 uppercase font-semibold leading-none">Quantidade</span>
                        <input
                          type="text"
                          value={item.quantity}
                          onChange={(e) => handleEditDetectedItem(item.id, "quantity", e.target.value)}
                          disabled={!item.checked}
                          className="w-full text-xs font-medium leading-tight border-b border-dashed border-stone-200 outline-none text-stone-400 py-0.5 focus:border-pink-400"
                        />
                      </div>
                    </div>

                  </div>
                ))}
              </div>

              {/* Save or Cancel */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setVisionDetectedItems([]); setFridgePhotos([null, null, null]); setPantryPhotos([null, null, null]); }}
                  className="w-1/3 py-2 border border-stone-200 hover:bg-stone-50 text-stone-500 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmVisionItems}
                  className="w-2/3 py-2 bg-pink-500 hover:bg-pink-600 text-white font-extrabold rounded-xl text-xs shadow-sm flex items-center justify-center gap-1"
                >
                  Confirmar e Adicionar à Geladeira
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Screen 3: PDF Prescriptions Dropzone */}
      {activeTab === "pdf" && (
        <div className="flex flex-col gap-5">
          <div>
            <h3 className="font-heading font-extrabold text-stone-800 text-sm">Leitor Inteligente de Prescrições PDF</h3>
            <p className="text-[11px] text-stone-400">Arraste a prescrição do nutricionista ou médico para extrair restrições de dietas automaticamente</p>
          </div>

          <div className="border border-dashed border-stone-200 bg-stone-50/40 hover:bg-pink-50/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 cursor-pointer transition-all">
            <FileText className="w-10 h-10 text-purple-400 animate-pulse" />
            
            {!pdfFile ? (
              <div>
                <button
                  onClick={handlePdfSimulate}
                  disabled={isPdfParsing}
                  className="px-5 py-2.5 bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold rounded-2xl flex items-center gap-1.5 shadow-md shadow-purple-100 btn-interactive mx-auto"
                >
                  <Upload className="w-4 h-4" /> Simular Dropzone de PDF
                </button>
                <span className="text-[10px] text-stone-400 block mt-2">Dica: Extrai dietas como Low carb, déficit, medicações em uso</span>
              </div>
            ) : (
              <span className="text-xs font-bold text-stone-700 flex items-center gap-1">
                ✓ {pdfFile} carregado
              </span>
            )}

            {isPdfParsing && (
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <RefreshCw className="w-4 h-4 animate-spin text-purple-500" />
                Extraindo diretrizes de saúde com Gemini PDF parser...
              </div>
            )}
          </div>

          {/* Confirm results */}
          {parsedPrescription && (
            <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-4 flex flex-col gap-3">
              <h4 className="text-xs font-heading font-bold text-purple-700">Informações Extraídas da Prescrição</h4>
              
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-white rounded-lg border border-purple-100/50">
                  <span className="text-stone-400 block font-semibold text-[9px] uppercase">Dieta Sugerida</span>
                  <span className="font-bold text-stone-700 capitalize">{parsedPrescription.detectedDiet}</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-purple-100/50">
                  <span className="text-stone-400 block font-semibold text-[9px] uppercase">Meta de Água</span>
                  <span className="font-bold text-stone-700">{parsedPrescription.waterGoalMl} ml / dia</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-purple-100/50">
                  <span className="text-stone-400 block font-semibold text-[9px] uppercase">Restrições Clínicas</span>
                  <span className="font-bold text-stone-700 capitalize">
                    {parsedPrescription.detectedRestrictions.join(", ") || "Nenhuma"}
                  </span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-purple-100/50">
                  <span className="text-stone-400 block font-semibold text-[9px] uppercase">Uso de Peptídeo GLP-1</span>
                  <span className="font-bold text-stone-700 capitalize">{parsedPrescription.clinicalTreatment || "Nenhum"}</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-purple-100 text-[10px] text-stone-600 leading-relaxed italic">
                "{parsedPrescription.doctorNotes}"
              </div>

              <button
                onClick={handleApplyDietRules}
                className="w-full py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl text-xs shadow-sm shadow-purple-100 btn-interactive"
              >
                Configurar Perfil de Dieta automaticamente
              </button>
            </div>
          )}
        </div>
      )}

      {/* Screen 4: Allergen labels checker */}
      {activeTab === "labels" && (
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="font-heading font-extrabold text-stone-800 text-sm">Scanner de Substâncias e Alérgenos</h3>
            <p className="text-[11px] text-stone-400">Insira a lista de ingredientes do rótulo para cruzar informações de alérgenos da sua restrição intestinal</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setAllergenType("celiac")}
              className={`w-1/2 py-2 text-xs font-bold border rounded-xl transition-all ${
                allergenType === "celiac" ? "bg-red-50 text-red-600 border-red-100" : "bg-white text-stone-600 border-stone-200"
              }`}
            >
              Exame para Celíacos
            </button>
            <button
              onClick={() => setAllergenType("lactose")}
              className={`w-1/2 py-2 text-xs font-bold border rounded-xl transition-all ${
                allergenType === "lactose" ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-white text-stone-600 border-stone-200"
              }`}
            >
              Exame Intolerantes Lactose
            </button>
          </div>

          <textarea 
            rows={3}
            value={labelText}
            onChange={(e) => setLabelText(e.target.value)}
            placeholder="Copie aqui os ingredientes do rótulo do produto (Ex: Farinha de arroz, ovos, soro de leite em pó, xarope de malte...)"
            className="w-full text-xs p-3 outline-none border border-stone-200 rounded-xl bg-stone-50/50 focus:bg-white focus:border-pink-300 transition-all font-medium leading-relaxed"
          />

          <div className="flex flex-wrap gap-1.5 justify-center">
            <button 
              onClick={() => setLabelText("Ingredientes: Farinha de trigo enriquecida com ferro e ácido fólico, açúcar, óleo de soja, aromatizante natural de baunilha.")}
              className="text-[9px] bg-stone-100 hover:bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full"
            >
              Simular Rótulo de Trigo / Glúten
            </button>
            <button 
              onClick={() => setLabelText("Ingredientes: Leite pasteurizado desnatado, fermento lácteo ativo, soro de queijo adoçado.")}
              className="text-[9px] bg-stone-100 hover:bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full"
            >
              Simular Rótulo de Lactose
            </button>
            <button 
              onClick={() => setLabelText("Ingredientes: Farinha de mandioca torrada, sementes de abóbora sem sal, cebola desidratada puríssima.")}
              className="text-[9px] bg-stone-100 hover:bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full"
            >
              Simular Rótulo Seguro
            </button>
          </div>

          <button
            onClick={handleAnalyzeLabel}
            disabled={isLabelAnalyzing}
            className="w-full py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-bold text-center rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-sm btn-interactive"
          >
            {isLabelAnalyzing ? "Verificando componentes com Gemini..." : "Analisar Rótulo do Produto"}
          </button>

          {labelResult && (
            <div className={`p-4 border rounded-2xl flex flex-col gap-2 ${
              labelResult.isSafe 
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}>
              <div className="flex items-center gap-1.5 font-bold text-xs">
                {labelResult.isSafe ? (
                  <>
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                    Ingredientes 100% Livres de Riscos ({labelResult.riskLevel})!
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    SUBSTÂNCIA PROIBIDA IDENTIFICADA ({labelResult.riskLevel})!
                  </>
                )}
              </div>
              
              <p className="text-[11px] font-semibold">
                {labelResult.explanation}
              </p>
              {!labelResult.isSafe && (
                <div className="text-[10px] bg-red-100 text-red-700 p-1 px-2 rounded-lg font-bold w-fit uppercase">
                  Elemento nocivo: {labelResult.triggerIngredient}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
