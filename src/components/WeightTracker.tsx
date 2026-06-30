import { useState, useEffect, FormEvent } from "react";
import { Scale, Target, Plus, Trash2, Calendar, Sparkles, TrendingDown, TrendingUp, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ClinicalTreatment, DietType } from "../types";
import { fetchWeightLogs, upsertWeightLog } from "../dataHooks";
import { useRealtimeSync } from "../hooks/useRealtimeSync";
import { toast } from "sonner";

interface WeightTrackerProps {
  clinicalTreatment: ClinicalTreatment;
  dietType: DietType;
  userId: string;
}

interface WeightLog {
  id: string;
  date: string; // YYYY-MM-DD
  weight: number; // in kg
}

export default function WeightTracker({ clinicalTreatment, dietType, userId }: WeightTrackerProps) {
  const [height, setHeight] = useState<number>(170); // in cm
  const [targetWeight, setTargetWeight] = useState<number>(70); // in kg
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form weight and date
  const [inputWeight, setInputWeight] = useState<string>("");
  const [inputDate, setInputDate] = useState<string>("");

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setInputDate(today);

    let cancelled = false;
    setLoading(true);
    fetchWeightLogs(userId).then((bundle) => {
      if (cancelled) return;
      setWeightLogs(bundle.logs.map((l) => ({ id: l.id, date: l.date, weight: l.weight_kg })));
      setHeight(bundle.heightCm);
      setTargetWeight(bundle.targetWeightKg);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [userId]);

  useRealtimeSync(userId, () => {
    if (weightLogs.length > 0) {
      const latest = weightLogs[0];
      upsertWeightLog(userId, {
        id: latest.id,
        date: latest.date,
        weight: latest.weight,
        heightCm: height,
        targetWeightKg: targetWeight,
      }).catch(() => {});
    }
  });

  const handleSaveHeight = (val: number) => {
    if (isNaN(val) || val <= 0) return;
    setHeight(val);
  };

  const handleSaveTargetWeight = (val: number) => {
    if (isNaN(val) || val <= 0) return;
    setTargetWeight(val);
  };

  const handleAddLog = (e: FormEvent) => {
    e.preventDefault();
    const parsedWeight = parseFloat(inputWeight);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      toast.warning("Por favor, insira um peso válido!");
      return;
    }

    const newLog: WeightLog = {
      id: Math.random().toString(36).substring(2, 9),
      date: inputDate || new Date().toISOString().split("T")[0],
      weight: parsedWeight,
    };

    const updated = [newLog, ...weightLogs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    setWeightLogs(updated);
    upsertWeightLog(userId, {
      id: newLog.id,
      date: newLog.date,
      weight: newLog.weight,
      heightCm: height,
      targetWeightKg: targetWeight,
    }).catch(() => {});
    setInputWeight("");
    
    const today = new Date().toISOString().split("T")[0];
    setInputDate(today);
  };

  const handleDeleteLog = (id: string) => {
    const updated = weightLogs.filter((log) => log.id !== id);
    setWeightLogs(updated);
  };

  // Derived metrics
  const latestWeight = weightLogs.length > 0 ? weightLogs[0].weight : 0;
  const initialWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : 0;
  
  const heightInMeters = height / 100;
  const bmi = latestWeight > 0 && heightInMeters > 0 
    ? parseFloat((latestWeight / (heightInMeters * heightInMeters)).toFixed(1)) 
    : 0;

  const idealWeightMin = heightInMeters > 0 ? parseFloat((18.5 * heightInMeters * heightInMeters).toFixed(1)) : 0;
  const idealWeightMax = heightInMeters > 0 ? parseFloat((24.9 * heightInMeters * heightInMeters).toFixed(1)) : 0;

  const weightDifference = latestWeight > 0 ? parseFloat((latestWeight - targetWeight).toFixed(1)) : 0;
  const weightChangeTotal = latestWeight > 0 && initialWeight > 0 
    ? parseFloat((latestWeight - initialWeight).toFixed(1)) 
    : 0;

  const getBmiCategory = (bmiVal: number) => {
    if (bmiVal === 0) return { label: "Aguardando dados de peso", color: "text-stone-400 bg-stone-100 border-stone-200" };
    if (bmiVal < 18.5) return { label: "Abaixo do peso", color: "text-amber-600 bg-amber-50 border-amber-100" };
    if (bmiVal >= 18.5 && bmiVal < 25.0) return { label: "Peso Saudável (Normal)", color: "text-green-700 bg-green-50 border-green-100" };
    if (bmiVal >= 25.0 && bmiVal < 30.0) return { label: "Sobrepeso", color: "text-orange-600 bg-orange-50 border-orange-100" };
    if (bmiVal >= 30.0 && bmiVal < 35.0) return { label: "Obesidade Grau I", color: "text-red-600 bg-red-50 border-red-100" };
    if (bmiVal >= 35.0 && bmiVal < 40.0) return { label: "Obesidade Grau II (Forte)", color: "text-red-700 bg-red-100 border-red-200" };
    return { label: "Obesidade Grau III (Extrema)", color: "text-purple-700 bg-purple-50 border-purple-100" };
  };

  const bmiCat = getBmiCategory(bmi);

  const getClinicalRecommendation = () => {
    if (!latestWeight) {
      return "Registre seu peso para que a IA possa analisar e gerar recomendações metabólicas exclusivas.";
    }

    let advice = "";
    
    if (bmi >= 30) {
      advice += "A perda ponderal para obesidade apoia a redução da inflamação crônica. ";
    } else if (bmi >= 25) {
      advice += "Você está na faixa de sobrepeso. Um pequeno déficit estruturado pode restaurar a sensibilidade à insulina. ";
    } else if (bmi >= 18.5) {
      advice += "Parabéns, você está no peso saudável recomendado! Foque em manutenção nutricional e ganho proteico. ";
    } else {
      advice += "Atenção: faixa abaixo do peso. Recomenda-se superávit calórico controlado e foco em hipertrofia saudável. ";
    }

    if (clinicalTreatment === "mounjaro") {
      advice += "Utilizando Tirzepatida (Mounjaro), priorize o consumo proteico elevado (mínimo de 1.2g/kg ao dia) e ingestão abundante de água para mitigar a perda excessiva de massa muscular magra e evitar constipação.";
    } else if (clinicalTreatment === "ozempic") {
      advice += "Utilizando Semaglutida (Ozempic), faça pequenas refeições programadas ricos em minerais. Evite comer rápido ou porções volumosas no final da tarde para contornar refluxos e lentidão gástrica.";
    } else {
      advice += "Para otimização metabólica sustentável tradicional, fragmente o consumo em intervalos regulares de 3 a 4 horas.";
    }

    if (dietType === "low-carb" || dietType === "cetogenica") {
      advice += " Como você escolheu uma linha de baixo carboidrato, capriche no consumo de vegetais folhosos e mantenha o aporte de eletrólitos estável para evitar fadiga ou dor de cabeça transiente.";
    } else if (dietType === "deficit-calorico") {
      advice += " Em restrição calórica ativa, garanta gorduras saudáveis (azeite, sementes) para sinalização hormonal correta.";
    } else if (dietType === "mediterranea") {
      advice += " A dieta mediterrânea é altamente protetora cardiovascular; desfrute de vegetais inteiros hidratados e leguminosas ricas em fibras.";
    }

    return advice;
  };

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 flex flex-col gap-6"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-pink-50 text-pink-500 rounded-2xl">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-heading font-extrabold text-stone-800">Controle de Peso & IMC</h3>
            <p className="text-xs text-stone-500">Métricas analíticas de composição corporal e meta de emagrecimento</p>
          </div>
        </div>
        <div className="text-center py-8 text-xs text-stone-400">Carregando...</div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 flex flex-col gap-6"
    >
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-pink-50 text-pink-500 rounded-2xl">
          <Scale className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-heading font-extrabold text-stone-800">Controle de Peso & IMC</h3>
          <p className="text-xs text-stone-500">Métricas analíticas de composição corporal e meta de emagrecimento</p>
        </div>
      </div>

      {/* Inputs (Height, Target) */}
      <div className="grid grid-cols-2 gap-4 bg-stone-50/50 p-4 rounded-2xl border border-stone-100">
        <div>
          <label className="text-xs font-heading font-bold text-stone-700 block mb-1">Minha Altura (cm)</label>
          <input
            type="number"
            value={height || ""}
            onChange={(e) => handleSaveHeight(parseInt(e.target.value) || 0)}
            className="w-full text-xs p-2.5 outline-none border border-stone-200 rounded-xl bg-white font-bold text-stone-800 focus:border-pink-300 transition-all"
            placeholder="Ex: 170"
          />
        </div>
        <div>
          <label className="text-xs font-heading font-bold text-stone-700 block mb-1">Minha Meta de Peso (kg)</label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              value={targetWeight || ""}
              onChange={(e) => handleSaveTargetWeight(parseFloat(e.target.value) || 0)}
              className="w-full text-xs p-2.5 outline-none border border-stone-200 rounded-xl bg-white font-bold text-stone-800 focus:border-pink-300 transition-all"
              placeholder="Ex: 65.0"
            />
            <Target className="absolute right-3 top-2.5 w-4 h-4 text-stone-400" />
          </div>
        </div>
      </div>

      {/* Ideal Weight range calculation display */}
      {height > 0 && (
        <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-4 flex gap-3 text-stone-700">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-blue-800 block mb-0.5">Recomendação de Peso Ideal:</span>
            Para sua altura de <span className="font-bold">{heightInMeters.toFixed(2)} m</span>, a faixa ideal recomendada pela OMS (com IMC entre 18.5 e 24.9) é de <span className="font-extrabold text-blue-900">{idealWeightMin} kg</span> a <span className="font-bold text-blue-900">{idealWeightMax} kg</span>.
          </div>
        </div>
      )}

      {/* BMI and target metrics if weight logs exist */}
      {latestWeight > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-stone-50 border border-stone-100 rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">IMC Atual</span>
              <span className="text-2xl font-extrabold text-stone-800 leading-none">{bmi}</span>
            </div>
            <span className={`inline-block text-[10px] font-bold px-2 py-1 border rounded-lg mt-3 text-center truncate ${bmiCat.color}`}>
              {bmiCat.label}
            </span>
          </div>

          <div className="bg-stone-50 border border-stone-100 rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Progresso da Meta</span>
              <span className="text-2xl font-extrabold text-stone-800 leading-none">
                {latestWeight.toFixed(1)} <span className="text-xs font-semibold text-stone-400">/ {targetWeight} kg</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-3 justify-center">
              {weightDifference > 0 ? (
                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-1 rounded-lg w-full text-center">
                  Faltam {weightDifference} kg para meta
                </span>
              ) : weightDifference < 0 ? (
                <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-100 px-2 py-1 rounded-lg w-full text-center">
                  Meta superada em {Math.abs(weightDifference)} kg! 🎉
                </span>
              ) : (
                <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-100 px-2 py-1 rounded-lg w-full text-center">
                  Meta Exata Atingida! 🏆
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-stone-50/50 border border-dashed border-stone-200 rounded-2xl p-6 text-center text-xs text-stone-500">
          Nenhum log de peso inserido ainda nesta sessão. Use o formulário abaixo para registrar seu primeiro peso e ativar o gráfico de IMC e evolução de metas.
        </div>
      )}

      {latestWeight > 0 && weightLogs.length > 1 && (
        <div className="bg-pink-50/20 border border-pink-100/50 rounded-2xl p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {weightChangeTotal < 0 ? (
              <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                <TrendingDown className="w-5 h-5" />
              </div>
            ) : weightChangeTotal > 0 ? (
              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center">
                <span className="font-bold text-sm">=</span>
              </div>
            )}
            <div>
              <span className="text-[10px] font-bold text-stone-400 block uppercase leading-none">Variação Histórica</span>
              <span className="text-xs font-extrabold text-stone-700">
                {weightChangeTotal < 0 ? `${weightChangeTotal} kg eliminados!` : weightChangeTotal > 0 ? `+${weightChangeTotal} kg registrados` : "Sem alteração ponderal"}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-semibold text-stone-400 block uppercase">Peso Inicial</span>
            <span className="text-xs font-bold text-stone-600">{initialWeight.toFixed(1)} kg</span>
          </div>
        </div>
      )}

      {latestWeight > 0 && (
        <div className="bg-gradient-to-tr from-pink-500/5 to-purple-500/5 border border-pink-100/40 rounded-2xl p-4 flex gap-3">
          <div className="shrink-0 text-pink-500 mt-1">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 uppercase tracking-wide block mb-1">
              Orientação Clínica PersonalDiet
            </span>
            <p className="text-xs text-stone-600 leading-relaxed font-medium">
              {getClinicalRecommendation()}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleAddLog} className="flex flex-col gap-3">
        <h4 className="text-xs font-heading font-bold text-stone-700 uppercase tracking-wider border-b border-stone-100 pb-2">
          Registrar Entrada de Peso Diário/Semanal
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-stone-500 block mb-1">Peso Registrado (kg)</label>
            <input
              type="number"
              step="0.1"
              required
              value={inputWeight}
              onChange={(e) => setInputWeight(e.target.value)}
              className="w-full text-xs p-2.5 outline-none border border-stone-200/80 rounded-xl bg-stone-50 focus:border-pink-300 focus:bg-white transition-all font-bold"
              placeholder="Ex: 82.5"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-stone-500 block mb-1">Data da Pesagem</label>
            <input
              type="date"
              required
              value={inputDate}
              onChange={(e) => setInputDate(e.target.value)}
              className="w-full text-xs p-2.5 outline-none border border-stone-200/80 rounded-xl bg-stone-50 focus:border-pink-300 focus:bg-white transition-all font-semibold"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full mt-1.5 py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-bold text-center rounded-2xl text-xs flex items-center justify-center gap-1.5 border border-pink-600 shadow-sm shadow-pink-100 btn-interactive"
        >
          <Plus className="w-4 h-4" /> Adicionar Entrada de Peso
        </button>
      </form>

      {weightLogs.length > 0 && (
        <div>
          <h4 className="text-[10px] font-heading font-extrabold text-stone-400 uppercase tracking-widest mb-2.5">
            Histórico de Pesagens
          </h4>
          <div className="max-h-52 overflow-y-auto border border-stone-100 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-100 text-[9px] uppercase font-bold text-stone-500 tracking-wider">
                  <th className="p-2.5 pl-4">Data</th>
                  <th className="p-2.5">Peso</th>
                  <th className="p-2.5">IMC Estimado</th>
                  <th className="p-2.5 text-center pr-4">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50 text-xs text-stone-600">
                <AnimatePresence initial={false}>
                  {weightLogs.map((log) => {
                    const logBmi = heightInMeters > 0 
                      ? (log.weight / (heightInMeters * heightInMeters)).toFixed(1) 
                      : "--";
                    return (
                      <motion.tr 
                        key={log.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="hover:bg-pink-50/10 transition-colors"
                      >
                        <td className="p-2.5 pl-4 font-semibold text-stone-500 text-[11px] flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-stone-300" />
                          {log.date}
                        </td>
                        <td className="p-2.5 font-extrabold text-stone-800">{log.weight.toFixed(1)} kg</td>
                        <td className="p-2.5 font-medium text-stone-500">{logBmi} kg/m²</td>
                        <td className="p-2.5 text-center pr-4">
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="text-stone-300 hover:text-red-500 p-2 rounded-md transition-colors inline-block touch-target"
                            title="Deletar registro"
                            aria-label="Deletar registro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
