import { useState, useEffect, FormEvent } from "react";
import { Search, Plus, Trash2, Camera, FileText, AlertTriangle, ShieldCheck, CheckCircle2, RefreshCw, Upload, Sparkles } from "lucide-react";
import { PantryIngredient, ClinicalRestriction } from "../types";

interface PantryScannerProps {
  onSuggestRecipes: (pantryItems: PantryIngredient[]) => void;
  onUpdatePreferences: (updates: { dietType: any; clinicalRestrictions: any[]; dailyWaterGoal?: number; clinicalTreatment?: any }) => void;
  currentRestrictions: ClinicalRestriction[];
}

export default function PantryScanner({ onSuggestRecipes, onUpdatePreferences, currentRestrictions }: PantryScannerProps) {
  const [activeTab, setActiveTab] = useState<"inventory" | "vision" | "pdf" | "labels">("inventory");
  const [ingredients, setIngredients] = useState<PantryIngredient[]>([]);
  
  // Manual Ingredient Form
  const [manName, setManName] = useState("");
  const [manQty, setManQty] = useState("");
  const [manCategory, setManCategory] = useState("Proteínas");

  // Vision Simulator
  const [visionImage, setVisionImage] = useState<string | null>(null);
  const [isVisionScanning, setIsVisionScanning] = useState(false);
  const [visionDetectedItems, setVisionDetectedItems] = useState<PantryIngredient[]>([]);
  
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

  // Computer Vision Simulation Trigger
  const handleVisionSimulate = async () => {
    setIsVisionScanning(true);
    setVisionImage("https://images.unsplash.com/photo-1571175452283-bc241517565e?w=500&auto=format&fit=crop");
    setVisionDetectedItems([]);

    try {
      const response = await fetch("/api/gemini/analyze-pantry-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: "mock-base64-data" }),
      });
      const data = await response.json();
      
      if (data.detectedIngredients) {
        const withIds = data.detectedIngredients.map((item: any) => ({
          ...item,
          id: Math.random().toString(36).substring(2, 9),
        }));
        setVisionDetectedItems(withIds);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsVisionScanning(false);
    }
  };

  const handleConfirmVisionItems = () => {
    const updated = [...ingredients, ...visionDetectedItems];
    saveInventory(updated);
    setVisionDetectedItems([]);
    setVisionImage(null);
    setActiveTab("inventory");
    alert("Ingredientes detectados salvos com sucesso na Despensa!");
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
          Foto da Despensa (IA)
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
              <p className="text-[11px] text-stone-400">Insira ingredientes ou use Visão Computacional para completar</p>
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
                <p className="text-[10px] text-stone-400">Adicione manualmente acima ou capture foto da despensa.</p>
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

      {/* Screen 2: Vision simulate */}
      {activeTab === "vision" && (
        <div className="flex flex-col gap-5">
          <div>
            <h3 className="font-heading font-extrabold text-stone-800 text-sm">Escaneamento por Visão Computacional</h3>
            <p className="text-[11px] text-stone-400">Capture ou faça upload de uma foto da sua despensa para detectar ingredientes instantaneamente</p>
          </div>

          <div className="border border-dashed border-stone-200 bg-stone-50/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4">
            {visionImage ? (
              <div className="relative w-44 h-44 rounded-2xl overflow-hidden border border-stone-200">
                <img src={visionImage} alt="Geladeira" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-xs font-bold uppercase">
                  ✓ Foto Enviada
                </div>
              </div>
            ) : (
              <Camera className="w-10 h-10 text-stone-300 animate-pulse" />
            )}

            {!visionImage && (
              <div>
                <button
                  onClick={handleVisionSimulate}
                  disabled={isVisionScanning}
                  className="px-5 py-2.5 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold rounded-2xl flex items-center gap-1.5 shadow-md shadow-pink-100 btn-interactive"
                >
                  <Camera className="w-4 h-4" /> Simular Captura da Despensa
                </button>
                <span className="text-[10px] text-stone-400 block mt-2">Dica: Um feed simulador carregará os itens em poucos segundos</span>
              </div>
            )}

            {isVisionScanning && (
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <RefreshCw className="w-4 h-4 animate-spin text-pink-500" />
                Processando imagem com Gemini Vision...
              </div>
            )}
          </div>

          {/* Confirm captured vision items */}
          {visionDetectedItems.length > 0 && (
            <div className="bg-white border border-pink-100 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-pink-50 pb-2">
                <h4 className="text-xs font-heading font-bold text-pink-500">Alimentos Identificados na Foto</h4>
                <span className="text-[9px] bg-pink-50 text-pink-600 font-bold px-2 py-0.5 rounded-full">Confirmar Itens</span>
              </div>

              <div className="space-y-1 max-h-36 overflow-y-auto">
                {visionDetectedItems.map((item, idx) => (
                  <div key={item.id} className="flex justify-between items-center text-xs p-1.5 bg-stone-50 rounded-lg">
                    <span className="font-bold text-stone-700">{item.name}</span>
                    <span className="text-stone-400 font-semibold">{item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setVisionDetectedItems([]); setVisionImage(null); }}
                  className="w-1/2 py-2 border border-stone-200 hover:bg-stone-50 text-stone-500 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmVisionItems}
                  className="w-1/2 py-2 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl text-xs shadow-sm"
                >
                  Adicionar à Despensa
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
