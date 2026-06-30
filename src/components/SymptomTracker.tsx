import { useState, useEffect } from "react";
import { Plus, Activity, Trash2, Calendar } from "lucide-react";
import { SymptomLog } from "../types";
import { fetchSymptomLogs, upsertSymptomLog } from "../dataHooks";
import { useRealtimeSync } from "../hooks/useRealtimeSync";
import { toast } from "sonner";

const ALL_SYMPTOMS = ["Náusea", "Azia / Refluxo", "Fadiga / Fraqueza", "Dor de Cabeça", "Prisão de Ventre", "Diarreia", "Má Digestão"];
const ALL_TRIGGERS = ["Refeição de alto teor de gorduras", "Alimentos muito doces", "Ingestão rápida de comida", "Pouca água no dia", "Dia seguinte à injeção", "Nenhum trigger identificado"];

interface SymptomTrackerProps {
  userId: string;
}

export default function SymptomTracker({ userId }: SymptomTrackerProps) {
  const [logs, setLogs] = useState<SymptomLog[]>([]);
  const [intensity, setIntensity] = useState(5);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchSymptomLogs(userId).then((data) => {
      if (cancelled) return;
      setLogs(data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [userId]);

  useRealtimeSync(userId, () => {
    if (logs.length > 0) {
      upsertSymptomLog(userId, logs[0]).catch(() => {});
    }
  });

  const toggleSymptom = (sym: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(sym) ? prev.filter(item => item !== sym) : [...prev, sym]
    );
  };

  const toggleTrigger = (trig: string) => {
    setSelectedTriggers(prev =>
      prev.includes(trig) ? prev.filter(item => item !== trig) : [...prev, trig]
    );
  };

  const saveLog = () => {
    if (selectedSymptoms.length === 0) {
      toast.warning("Por favor, selecione pelo menos 1 sintoma!");
      return;
    }

    const newLog: SymptomLog = {
      id: Math.random().toString(36).substring(2, 9),
      date: new Date().toISOString(),
      intensity,
      symptoms: selectedSymptoms,
      triggers: selectedTriggers.length > 0 ? selectedTriggers : ["Nenhum"],
    };

    const updated = [newLog, ...logs];
    setLogs(updated);
    upsertSymptomLog(userId, newLog).catch(() => {});

    // Reset Form
    setSelectedSymptoms([]);
    setSelectedTriggers([]);
    setIntensity(5);

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  const deleteLog = (id: string) => {
    const updated = logs.filter(l => l.id !== id);
    setLogs(updated);
  };

  // Intensity indicators style
  const getIntensityBadge = (lvl: number) => {
    if (lvl <= 3) return { bg: "bg-green-50 text-green-700 border-green-100", label: "Leve" };
    if (lvl <= 7) return { bg: "bg-amber-50 text-amber-700 border-amber-100", label: "Moderado" };
    return { bg: "bg-rose-50 text-rose-700 border-rose-100", label: "Intenso" };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-500 rounded-2xl">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-heading font-extrabold text-stone-800">Rastreador de Sintomas & Náuseas</h3>
            <p className="text-xs text-stone-500">Mapeie reações digestivas ou sintomas induzidos por medicações</p>
          </div>
        </div>
        <div className="text-center py-8 text-xs text-stone-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-purple-50 text-purple-500 rounded-2xl">
          <Activity className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h3 className="text-lg font-heading font-extrabold text-stone-800">Rastreador de Sintomas & Náuseas</h3>
          <p className="text-xs text-stone-500">Mapeie reações digestivas ou sintomas induzidos por medicações</p>
        </div>
      </div>

      <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100 flex flex-col gap-4">
        {/* Intensity range 1-10 */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-heading font-bold text-stone-700">Intensidade do Sintoma: {intensity}/10</label>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 border rounded-full ${getIntensityBadge(intensity).bg}`}>
              {getIntensityBadge(intensity).label}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={intensity}
            onChange={(e) => setIntensity(parseInt(e.target.value))}
            className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <div className="flex justify-between text-[10px] text-stone-400 mt-1 px-1">
            <span>Quase Imperceptível</span>
            <span>Grave</span>
          </div>
        </div>

        {/* Symptoms buttons */}
        <div>
          <label className="text-xs font-heading font-bold text-stone-700 block mb-2">Quais sintomas está sentindo?</label>
          <div className="flex flex-wrap gap-2">
            {ALL_SYMPTOMS.map((sym) => {
              const selected = selectedSymptoms.includes(sym);
              return (
                <button
                  key={sym}
                  onClick={() => toggleSymptom(sym)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-150 btn-interactive ${
                    selected 
                      ? "bg-purple-100 text-purple-700 border-purple-200 shadow-sm"
                      : "bg-white text-stone-600 border-stone-100 hover:border-stone-300"
                  }`}
                >
                  {sym}
                </button>
              );
            })}
          </div>
        </div>

        {/* Triggers list */}
        <div>
          <label className="text-xs font-heading font-bold text-stone-700 block mb-2">Possíveis Gatilhos associados:</label>
          <div className="flex flex-wrap gap-2">
            {ALL_TRIGGERS.map((trig) => {
              const selected = selectedTriggers.includes(trig);
              return (
                <button
                  key={trig}
                  onClick={() => toggleTrigger(trig)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-150 btn-interactive ${
                    selected 
                      ? "bg-amber-100 text-amber-700 border-amber-200"
                      : "bg-white text-stone-600 border-stone-100 hover:border-stone-300"
                  }`}
                >
                  {trig}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={saveLog}
          className="w-full py-2.5 bg-purple-500 hover:bg-purple-600 text-white font-bold text-center rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-purple-100 btn-interactive"
        >
          <Plus className="w-4 h-4" /> Registrar Sintoma
        </button>

        {showSuccess && (
          <div className="p-2.5 bg-green-50 border border-green-100 text-green-700 rounded-xl text-xs text-center font-medium animate-fade">
            ✓ Sintoma registrado e vinculado ao prontuário clínico!
          </div>
        )}
      </div>

      {/* History log charts/list */}
      <div>
        <h4 className="text-xs font-heading font-semibold text-stone-500 uppercase tracking-wider mb-3">Linha do Tempo de Sintomas</h4>
        <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
          {logs.length === 0 ? (
            <div className="text-center py-6 bg-stone-50 rounded-2xl">
              <span className="text-xs text-stone-400 font-medium block">Nenhum sintoma gravado ultimamente.</span>
              <span className="text-[10px] text-stone-400 block">Isso é um ótimo sinal do seu organismo!</span>
            </div>
          ) : (
            logs.map(log => {
              const badge = getIntensityBadge(log.intensity);
              const formattedDate = new Date(log.date).toLocaleString("pt-BR", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit"
              });

              return (
                <div key={log.id} className="p-3.5 bg-stone-50 rounded-2xl border border-stone-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-stone-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-stone-400" />
                      {formattedDate}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 border rounded-full ${badge.bg}`}>
                        Intensidade: {log.intensity} ({badge.label})
                      </span>
                      <button 
                        onClick={() => deleteLog(log.id)}
                        className="text-stone-300 hover:text-red-500 rounded p-2 transition-colors touch-target"
                        title="Remover"
                        aria-label="Remover registro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-1">
                    {log.symptoms.map(s => (
                      <span key={s} className="bg-purple-50 border border-purple-100/50 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>

                  {log.triggers && log.triggers.length > 0 && log.triggers[0] !== "Nenhum" && (
                    <div className="text-[10px] bg-amber-50/50 border border-amber-100/50 text-amber-800 p-2 rounded-xl mt-1 leading-normal">
                      <strong className="font-bold">Gatilhos:</strong> {log.triggers.join(", ")}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
