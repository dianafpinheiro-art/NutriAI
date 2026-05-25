import { useState, useEffect, FormEvent } from "react";
import { User, Activity, Flame, ShieldAlert, Sliders, Sparkles, Check, HelpCircle, X, Info, Plus } from "lucide-react";
import { UserPreferences, DietType, ClinicalRestriction, ClinicalTreatment } from "../types";

interface WhoAmIProps {
  preferences: UserPreferences;
  onSave: (updated: UserPreferences) => void;
  onClose?: () => void;
  isOpen: boolean;
}

export default function WhoAmI({ preferences, onSave, onClose, isOpen }: WhoAmIProps) {
  const [userName, setUserName] = useState(preferences.userName || "");
  const [dietType, setDietType] = useState<DietType>(preferences.dietType || "none");
  const [clinicalTreatment, setClinicalTreatment] = useState<ClinicalTreatment>(preferences.clinicalTreatment || "none");
  const [clinicalRestrictions, setClinicalRestrictions] = useState<ClinicalRestriction[]>(preferences.clinicalRestrictions || []);
  const [dailyWaterGoal, setDailyWaterGoal] = useState<number>(preferences.dailyWaterGoal || 2500);
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>(preferences.excludedIngredients || []);
  
  const [newExcluded, setNewExcluded] = useState("");

  useEffect(() => {
    if (isOpen) {
      setUserName(preferences.userName || "");
      setDietType(preferences.dietType || "none");
      setClinicalTreatment(preferences.clinicalTreatment || "none");
      setClinicalRestrictions(preferences.clinicalRestrictions || []);
      setDailyWaterGoal(preferences.dailyWaterGoal || 2500);
      setExcludedIngredients(preferences.excludedIngredients || []);
    }
  }, [isOpen, preferences]);

  if (!isOpen) return null;

  const handleToggleRestriction = (restr: ClinicalRestriction) => {
    if (clinicalRestrictions.includes(restr)) {
      setClinicalRestrictions(clinicalRestrictions.filter(r => r !== restr));
    } else {
      setClinicalRestrictions([...clinicalRestrictions, restr]);
    }
  };

  const handleAddExcluded = (e: FormEvent) => {
    e.preventDefault();
    if (!newExcluded.trim()) return;
    const clean = newExcluded.trim().toLowerCase();
    if (!excludedIngredients.includes(clean)) {
      setExcludedIngredients([...excludedIngredients, clean]);
    }
    setNewExcluded("");
  };

  const handleRemoveExcluded = (item: string) => {
    setExcludedIngredients(excludedIngredients.filter(i => i !== item));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const updated: UserPreferences = {
      userName: userName.trim() || "Consumidor Saudável",
      dietType,
      clinicalTreatment,
      clinicalRestrictions,
      dailyWaterGoal,
      excludedIngredients
    };
    onSave(updated);
    localStorage.setItem("nutri_onboarded", "true");
    if (onClose) onClose();
  };

  const popularExclusions = ["coentro", "berinjela", "camarão", "cebola", "alho", "sardinha", "melancia"];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-100 flex flex-col max-h-[90vh] overflow-hidden animate-fade-in-up">
        
        {/* Header */}
        <div className="p-6 border-b border-stone-50 bg-gradient-to-r from-pink-500/5 to-purple-500/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-pink-500 to-purple-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-pink-100">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-stone-800 font-heading">Quem Sou Eu?</h2>
              <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Perfil Clínico e Alimentar Individual de Saúde</p>
            </div>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-stone-50 text-stone-400 hover:text-stone-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Section 1: Name */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">Qual é o seu nome?</label>
            <div className="relative">
              <input 
                type="text"
                required
                placeholder="Ex: Maria Carolina Souza"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full text-sm font-bold bg-stone-50/50 border border-stone-100 focus:border-pink-400 focus:bg-white rounded-2xl p-3.5 pl-4 outline-none transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Section 2: Diet Choice */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">Qual é o seu Padrão Alimentar / Dieta?</label>
              <p className="text-[11px] text-stone-400">Selecione uma diretriz para calibrar o balanceamento calórico e protéico</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: "low-carb", title: "Low-Carb", icon: "🥦", desc: "Baixo carboidrato, mais vegetais e gorduras boas" },
                { id: "cetogenica", title: "Cetogênica", icon: "🥑", desc: "Altíssima queima de gordura e cetose induzida" },
                { id: "mediterranea", title: "Mediterrânea", icon: "🐟", desc: "Peixes, grãos integrais, azeite e frescor" },
                { id: "deficit-calorico", title: "Déficit Calórico", icon: "📉", desc: "Focado em emagrecimento sustentado acelerado" },
                { id: "none", title: "Padrão / Livre", icon: "🍽️", desc: "Sem restrição de macros, porções equilibradas normais" }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDietType(opt.id as DietType)}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                    dietType === opt.id 
                      ? "bg-pink-500 text-white border-pink-500 shadow-lg shadow-pink-100 scale-[1.02]" 
                      : "bg-stone-50/50 border-stone-100 text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  <span className="text-xl">{opt.icon}</span>
                  <span className="text-xs font-bold block leading-none">{opt.title}</span>
                  <span className={`text-[9px] leading-tight block ${dietType === opt.id ? "text-pink-50/90" : "text-stone-400"}`}>{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Clinical Treatment GLP-1 */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">Você utiliza algum Peptídeo Emagrecedor (GLP-1)?</label>
              <p className="text-[11px] text-stone-400">Pacientes em tratamento ativo necessitam de porções fracionadas e ricas em proteínas magras</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: "mounjaro", name: "Uso de Mounjaro (Tirzepatida)", desc: "Orientação focada em náusea zero, digestão equilibrada, alta hidratação" },
                { id: "ozempic", name: "Uso de Ozempic (Semaglutida)", desc: "Evita refluxos e gastroparesia lenta, mantém massa muscular magra" },
                { id: "none", name: "Não utilizo / Sem medicamentos", desc: "Plano regular sem adaptações para retardamento gástrico" }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setClinicalTreatment(opt.id as ClinicalTreatment)}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                    clinicalTreatment === opt.id 
                      ? "bg-purple-500 text-white border-purple-500 shadow-lg shadow-purple-100 scale-[1.01]" 
                      : "bg-stone-50/50 border-stone-100 text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  <span className="text-xs font-bold block">{opt.name}</span>
                  <span className={`text-[9px] leading-tight block ${clinicalTreatment === opt.id ? "text-purple-50/90" : "text-stone-400"}`}>{opt.desc}</span>
                </button>
              ))}
            </div>

            {clinicalTreatment !== "none" && (
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-800 text-[11px] leading-relaxed flex items-start gap-2.5">
                <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Aviso Clínico de Suporte:</span> Ao ativar o protocolo {clinicalTreatment.toUpperCase()}, o PersonalDiet adaptará os algoritmos de geração de receitas para omitir frituras, açúcares simples e gorduras saturadas excessivas, prevenindo enjôos agudos e protegendo sua saúde.
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Allergens / Restrictions */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">Você possui alguma restrição imunológica ou clínica?</label>
              <p className="text-[11px] text-stone-400">Ative para ocultar receitas perigosas e alertar no scanner de rótulos</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleToggleRestriction("celiac")}
                className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  clinicalRestrictions.includes("celiac")
                    ? "bg-red-500 text-white border-red-500 shadow-lg shadow-red-100"
                    : "bg-stone-50/50 border-stone-100 text-stone-700 hover:bg-stone-50"
                }`}
              >
                <div>
                  <span className="text-xs font-bold block">Celíaco / Intolerante ao Glúten 🌾</span>
                  <span className={`text-[9px] block ${clinicalRestrictions.includes("celiac") ? "text-red-50" : "text-stone-400"}`}>
                    Banir aveia, cevada, trigo e derivados
                  </span>
                </div>
                {clinicalRestrictions.includes("celiac") && <Check className="w-5 h-5 text-white" />}
              </button>

              <button
                type="button"
                onClick={() => handleToggleRestriction("lactose")}
                className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  clinicalRestrictions.includes("lactose")
                    ? "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-100"
                    : "bg-stone-50/50 border-stone-100 text-stone-700 hover:bg-stone-50"
                }`}
              >
                <div>
                  <span className="text-xs font-bold block">Intolerância à Lactose 🥛</span>
                  <span className={`text-[9px] block ${clinicalRestrictions.includes("lactose") ? "text-amber-50" : "text-stone-400"}`}>
                    Remover laticínios normais das sugestões
                  </span>
                </div>
                {clinicalRestrictions.includes("lactose") && <Check className="w-5 h-5 text-white" />}
              </button>
            </div>
          </div>

          {/* Section 5: Excluded Ingredients (Gosto / Não Gosto) */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">Ingredientes Banidos (Coisas que você NÃO Gosta)</label>
              <p className="text-[11px] text-stone-400">Escreva alimentos que você quer proibir nas receitas (Gostos/Alergias específicas)</p>
            </div>

            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="Ex: coentro, cebola, berinjela"
                value={newExcluded}
                onChange={(e) => setNewExcluded(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (newExcluded.trim()) {
                      const clean = newExcluded.trim().toLowerCase();
                      if (!excludedIngredients.includes(clean)) {
                        setExcludedIngredients([...excludedIngredients, clean]);
                      }
                      setNewExcluded("");
                    }
                  }
                }}
                className="flex-1 text-xs bg-stone-50 border border-stone-100 focus:bg-white rounded-xl p-2.5 outline-none font-bold"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (newExcluded.trim()) {
                    const clean = newExcluded.trim().toLowerCase();
                    if (!excludedIngredients.includes(clean)) {
                      setExcludedIngredients([...excludedIngredients, clean]);
                    }
                    setNewExcluded("");
                  }
                }}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Banir
              </button>
            </div>

            {/* List and preset suggestions */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {excludedIngredients.length === 0 ? (
                <span className="text-[10px] bg-stone-50 border border-stone-100 text-stone-400 px-2.5 py-1 rounded-lg font-semibold">Nenhum ingrediente banido ainda</span>
              ) : (
                excludedIngredients.map((item) => (
                  <span 
                    key={item} 
                    className="text-[10px] bg-red-50 border border-red-100 text-red-600 px-2.5 py-1 rounded-full font-bold uppercase flex items-center gap-1"
                  >
                    {item}
                    <X 
                      className="w-3 h-3 hover:text-red-800 cursor-pointer" 
                      onClick={() => handleRemoveExcluded(item)}
                    />
                  </span>
                ))
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[9px] text-stone-400 block font-bold uppercase">Adicionar Presets Populares:</span>
              <div className="flex flex-wrap gap-1">
                {popularExclusions.map(p => {
                  const exists = excludedIngredients.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      disabled={exists}
                      onClick={() => setExcludedIngredients([...excludedIngredients, p])}
                      className={`text-[9px] px-2 py-0.5 rounded-full border transition-all ${
                        exists 
                          ? "bg-purple-100 border-purple-100 text-purple-400 cursor-not-allowed" 
                          : "bg-white hover:bg-stone-50 border-stone-200 text-stone-500"
                      }`}
                    >
                      + {p}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 6: Water Intake Goal */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">Sua Meta Diária de Água Recomendada</label>
                <span className="text-[11px] text-stone-400">Meta calculada para desintoxicação renal de medicamentos e nutrição</span>
              </div>
              <span className="text-sm font-extrabold text-blue-600 font-mono bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                {dailyWaterGoal} ml
              </span>
            </div>

            <input 
              type="range"
              min={1500}
              max={5000}
              step={100}
              value={dailyWaterGoal}
              onChange={(e) => setDailyWaterGoal(parseInt(e.target.value))}
              className="w-full accent-blue-500 h-1.5 bg-stone-100 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-stone-400 font-bold">
              <span>1500 ml (Mínimo)</span>
              <span>2500 ml (Moderado)</span>
              <span>3500 ml (Alvo Clínico Tirzepatida)</span>
              <span>5000 ml</span>
            </div>
          </div>

        </form>

        {/* Footer actions */}
        <div className="p-4 border-t border-stone-50 bg-stone-50/50 flex gap-2">
          {onClose && (
            <button
              onClick={onClose}
              type="button"
              className="w-1/3 py-3 border border-stone-200 hover:bg-stone-100 text-stone-600 text-xs font-bold rounded-2xl transition-all"
            >
              Voltar ao Meu Menu
            </button>
          )}
          <button
            onClick={handleSubmit}
            className={`py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-95 text-white text-xs font-extrabold text-center rounded-2xl shadow-lg shadow-pink-100 btn-interactive ${
              onClose ? "w-2/3" : "w-full"
            }`}
          >
            ✓ Salvar Configurações Clínicas e Entrar
          </button>
        </div>

      </div>
    </div>
  );
}
