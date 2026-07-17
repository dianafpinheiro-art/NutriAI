import { useState, useEffect } from "react";
import { Syringe, Plus, Trash2, MapPin } from "lucide-react";
import { DoseLog, ClinicalTreatment } from "../types";
import { fetchDoseLogs, upsertDoseLog } from "../dataHooks";
import { useRealtimeSync } from "../hooks/useRealtimeSync";
import { toast } from "sonner";

interface MounjaroMonitorProps {
  treatmentType: ClinicalTreatment;
  userId: string;
}

const INJECTION_SITES = [
  { id: "esquerda-abdomen", label: "Abdômen Esquerdo", category: "Abdominal" },
  { id: "direita-abdomen", label: "Abdômen Direito", category: "Abdominal" },
  { id: "coxa-esquerda", label: "Coxa Esquerda", category: "Coxas" },
  { id: "coxa-direita", label: "Coxa Direita", category: "Coxas" },
  { id: "braco-esquerdo", label: "Braço Esquerdo", category: "Braços" },
  { id: "braco-direito", label: "Braço Direito", category: "Braços" },
];

export default function MounjaroMonitor({ treatmentType, userId }: MounjaroMonitorProps) {
  const [logs, setLogs] = useState<DoseLog[]>([]);
  const [doseMg, setDoseMg] = useState(2.5);
  const [selectedSite, setSelectedSite] = useState<string>("esquerda-abdomen");
  const [customDate, setCustomDate] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setCustomDate(today);

    let cancelled = false;
    setLoading(true);
    fetchDoseLogs(userId).then((data) => {
      if (cancelled) return;
      setLogs(data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [userId]);

  useRealtimeSync(userId, () => {
    if (logs.length > 0) {
      upsertDoseLog(userId, logs[0]).catch(() => {});
    }
  });

  if (treatmentType === "none") {
    return (
      <div className="bg-stone-50 rounded-3xl p-6 text-center border border-dashed border-stone-200">
        <Syringe className="w-8 h-8 mx-auto text-stone-300 mb-2" />
        <h4 className="font-heading font-extrabold text-stone-700 text-sm">Monitor de Medicações (Mounjaro/Ozempic) Inativo</h4>
        <p className="text-xs text-stone-500 max-w-xs mx-auto mt-1">
          Ative seu tratamento no perfil para registrar suas doses semanais e o rodízio de locais de aplicação.
        </p>
      </div>
    );
  }

  const handleAddDose = () => {
    if (!doseMg || doseMg <= 0) {
      toast.warning("Por favor insira uma dose válida!");
      return;
    }

    const matchedSite = INJECTION_SITES.find(s => s.id === selectedSite);
    const newLog: DoseLog = {
      id: Math.random().toString(36).substring(2, 9),
      date: customDate || new Date().toISOString().split("T")[0],
      doseMg,
      injectionSite: selectedSite as DoseLog['injectionSite'],
      treatmentType,
    };

    const updated = [newLog, ...logs];
    setLogs(updated);
    upsertDoseLog(userId, newLog).catch(() => {});
    toast.success(`Dose de ${doseMg}mg registrada em [${matchedSite?.label}] com sucesso! Lembre-se de alternar a posição na próxima aplicação.`);
  };

  const handleDeleteDose = (id: string) => {
    const updated = logs.filter(l => l.id !== id);
    setLogs(updated);
  };

  const suggestionDoses = treatmentType === "mounjaro" 
    ? [2.5, 5.0, 7.5, 10.0, 12.5, 15.0]
    : [0.25, 0.50, 1.0, 2.0];

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-pink-50 text-pink-500 rounded-2xl">
            <Syringe className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-heading font-extrabold text-stone-800 capitalize">Monitor Diário: {treatmentType}</h3>
            <p className="text-xs text-stone-500">Mapeamento anatômico rotacional para maior conforto de aplicação</p>
          </div>
        </div>
        <div className="text-center py-8 text-xs text-stone-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-pink-50 text-pink-500 rounded-2xl">
          <Syringe className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-heading font-extrabold text-stone-800 capitalize">Monitor Diário: {treatmentType}</h3>
          <p className="text-xs text-stone-500">Mapeamento anatômico rotacional para maior conforto de aplicação</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-stone-100 bg-stone-50/50 p-4 rounded-2xl flex flex-col items-center">
          <h4 className="text-xs font-heading font-bold text-stone-600 mb-4 text-center">
            Clique no Mapa para Selecionar o Local de Aplicação
          </h4>
          
          <div className="relative w-44 h-64 bg-stone-100/50 rounded-full border border-stone-200/40 flex flex-col p-4 justify-between overflow-hidden">
            <div className="text-[10px] text-center text-stone-400 absolute w-full top-1 left-0 font-bold uppercase tracking-widest">
              Esquema Corporal
            </div>

            <div className="flex justify-between w-full absolute top-[75px] left-0 px-2">
              <button 
                onClick={() => setSelectedSite("braco-esquerdo")}
                className={`w-7 h-7 rounded-full flex items-center justify-center border font-bold text-[9px] transition-all ${
                  selectedSite === "braco-esquerdo"
                    ? "bg-pink-500 text-white border-pink-600 shadow-sm scale-110"
                    : "bg-white text-stone-600 border-stone-200 hover:border-pink-300"
                }`}
                title="Braço Esquerdo"
              >
                BE
              </button>
              <button 
                onClick={() => setSelectedSite("braco-direito")}
                className={`w-7 h-7 rounded-full flex items-center justify-center border font-bold text-[9px] transition-all ${
                  selectedSite === "braco-direito"
                    ? "bg-pink-500 text-white border-pink-600 shadow-sm scale-110"
                    : "bg-white text-stone-600 border-stone-200 hover:border-pink-300"
                }`}
                title="Braço Direito"
              >
                BD
              </button>
            </div>

            <div className="flex justify-center gap-6 w-full absolute top-[115px] left-0">
              <button 
                onClick={() => setSelectedSite("esquerda-abdomen")}
                className={`w-7 h-7 rounded-full flex items-center justify-center border font-bold text-[9px] transition-all ${
                  selectedSite === "esquerda-abdomen"
                    ? "bg-pink-500 text-white border-pink-600 shadow-sm scale-110"
                    : "bg-white text-stone-600 border-stone-200 hover:border-pink-300"
                }`}
                title="Abdômen Esquerdo"
              >
                AE
              </button>
              <button 
                onClick={() => setSelectedSite("direita-abdomen")}
                className={`w-7 h-7 rounded-full flex items-center justify-center border font-bold text-[9px] transition-all ${
                  selectedSite === "direita-abdomen"
                    ? "bg-pink-500 text-white border-pink-600 shadow-sm scale-110"
                    : "bg-white text-stone-600 border-stone-200 hover:border-pink-300"
                }`}
                title="Abdômen Direito"
              >
                AD
              </button>
            </div>

            <div className="flex justify-center gap-7 w-full absolute bottom-[45px] left-0">
              <button 
                onClick={() => setSelectedSite("coxa-esquerda")}
                className={`w-7 h-7 rounded-full flex items-center justify-center border font-bold text-[9px] transition-all ${
                  selectedSite === "coxa-esquerda"
                    ? "bg-pink-500 text-white border-pink-600 shadow-sm scale-110"
                    : "bg-white text-stone-600 border-stone-200 hover:border-pink-300"
                }`}
                title="Coxa Esquerda"
              >
                CE
              </button>
              <button 
                onClick={() => setSelectedSite("coxa-direita")}
                className={`w-7 h-7 rounded-full flex items-center justify-center border font-bold text-[9px] transition-all ${
                  selectedSite === "coxa-direita"
                    ? "bg-pink-500 text-white border-pink-600 shadow-sm scale-110"
                    : "bg-white text-stone-600 border-stone-200 hover:border-pink-300"
                }`}
                title="Coxa Direita"
              >
                CD
              </button>
            </div>
          </div>

          <div className="mt-4 text-center z-10">
            <span className="text-xs text-stone-500 font-medium">Local Escolhido:</span>
            <span className="ml-1 text-xs font-bold text-pink-600">
              {INJECTION_SITES.find(s => s.id === selectedSite)?.label || selectedSite}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-heading font-bold text-stone-700 block mb-1">Dose da Medicação (mg)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {suggestionDoses.map((dose) => (
                <button
                  key={dose}
                  onClick={() => setDoseMg(dose)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    doseMg === dose 
                      ? "bg-pink-500 text-white border-pink-600"
                      : "bg-stone-50 text-stone-600 border-stone-100 hover:border-stone-200"
                  }`}
                >
                  {dose} mg
                </button>
              ))}
            </div>
            
            <input 
              type="number"
              step="0.01"
              value={doseMg}
              onChange={(e) => setDoseMg(parseFloat(e.target.value) || 0)}
              className="w-full text-xs p-2.5 outline-none border border-stone-200/75 rounded-xl bg-stone-50 focus:border-pink-400 focus:bg-white transition-all font-bold"
              placeholder="Outro valor em mg..."
            />
          </div>

          <div>
            <label className="text-xs font-heading font-bold text-stone-700 block mb-1">Data da Aplicação</label>
            <div className="relative">
              <input 
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full text-xs p-2.5 outline-none border border-stone-200/75 rounded-xl bg-stone-50 focus:border-pink-400 focus:bg-white transition-all font-semibold"
              />
            </div>
          </div>

          <button
            onClick={handleAddDose}
            className="w-full mt-2 py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-bold text-center rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-pink-100 btn-interactive"
          >
            <Plus className="w-4 h-4" /> Registrar Dose Semanal
          </button>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-heading font-semibold text-stone-500 uppercase tracking-wider mb-2">Histórico de Rodízio de Doses</h4>
        <div className="max-h-56 overflow-y-auto border border-stone-100/70 rounded-2xl overflow-hidden shadow-sm">
          {logs.length === 0 ? (
            <div className="text-center py-6 bg-stone-50 rounded-2xl">
              <span className="text-xs text-stone-400 font-medium block">Nenhuma aplicação registrada ainda.</span>
              <span className="text-[10px] text-stone-400 block">As aplicações de Ozempic / Mounjaro ocorrem semanalmente.</span>
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-100 text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                  <th className="p-3">Data</th>
                  <th className="p-3">Medicação / Dose</th>
                  <th className="p-3">Anatomia do Sítio</th>
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
                {logs.map((log) => {
                  const siteName = INJECTION_SITES.find(s => s.id === log.injectionSite)?.label || log.injectionSite;
                  return (
                    <tr key={log.id} className="hover:bg-pink-50/20 transition-colors">
                      <td className="p-3 font-semibold">{log.date}</td>
                      <td className="p-3">
                        <span className="capitalize font-bold text-pink-600">{log.treatmentType}</span> ({log.doseMg} mg)
                      </td>
                      <td className="p-3 flex items-center gap-1.5 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-pink-400" />
                        {siteName}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDeleteDose(log.id)}
                          className="text-stone-300 hover:text-red-500 p-2 rounded-md transition-colors inline-block touch-target"
                          title="Remover dose"
                          aria-label="Remover dose"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
