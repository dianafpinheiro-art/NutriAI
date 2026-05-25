import { useState, useEffect } from "react";
import { Droplet, Plus, Trash2, Award, Sparkles } from "lucide-react";
import { HydrationLog } from "../types";

interface HydrationTrackerProps {
  dailyGoal: number;
}

export default function HydrationTracker({ dailyGoal }: HydrationTrackerProps) {
  const [logs, setLogs] = useState<HydrationLog[]>([]);
  const [todayIntake, setTodayIntake] = useState(0);

  // Get current date string in local format YYYY-MM-DD
  const getTodayDateString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  useEffect(() => {
    const saved = localStorage.getItem("nutri_hydration_logs");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as HydrationLog[];
        setLogs(parsed);

        const today = getTodayDateString();
        const sum = parsed
          .filter(log => log.date === today)
          .reduce((total, log) => total + log.amount, 0);
        setTodayIntake(sum);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveLogs = (newLogs: HydrationLog[]) => {
    setLogs(newLogs);
    localStorage.setItem("nutri_hydration_logs", JSON.stringify(newLogs));

    const today = getTodayDateString();
    const sum = newLogs
      .filter(log => log.date === today)
      .reduce((total, log) => total + log.amount, 0);
    setTodayIntake(sum);
  };

  const addWater = (amount: number) => {
    const newLog: HydrationLog = {
      id: Math.random().toString(36).substring(2, 9),
      date: getTodayDateString(),
      amount,
    };
    saveLogs([newLog, ...logs]);
  };

  const deleteLog = (id: string) => {
    const updated = logs.filter(l => l.id !== id);
    saveLogs(updated);
  };

  const percentage = Math.min(100, Math.floor((todayIntake / dailyGoal) * 100));

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl">
            <Droplet className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-heading font-extrabold text-stone-800">Hidratação Metabólica</h3>
            <p className="text-xs text-stone-500">Aumente a ingestão hídrica para ajudar o fígado e rins</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-stone-100 text-stone-600 rounded-full">
          Meta: {dailyGoal / 1000}L
        </span>
      </div>

      {/* Floating fluid fluid container */}
      <div className="relative h-48 w-full bg-blue-50/40 rounded-3xl overflow-hidden border border-blue-100 flex flex-col justify-end items-center">
        {/* Animated wave */}
        <div 
          style={{ height: `${percentage}%` }}
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-400/80 to-blue-300/60 w-full transition-all duration-700 ease-out flex flex-col justify-center items-center overflow-hidden"
        >
          {/* Wave effect overlay */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-blue-200/50 animate-pulse"></div>
          
          {percentage > 25 && (
            <span className="text-white font-heading font-extrabold text-2xl drop-shadow-md z-10 transition-all">
              {percentage}%
            </span>
          )}
        </div>

        {/* Absolute labels inside container */}
        <div className="z-20 text-center mb-6 pointer-events-none">
          {percentage <= 25 && (
            <span className="text-stone-700 font-heading font-extrabold text-2xl">
              {percentage}%
            </span>
          )}
          <p className="text-xs font-semibold text-stone-600 mt-1">
            {todayIntake} ml consumidos
          </p>
          <p className="text-[10px] text-stone-400">
            Falta {(dailyGoal - todayIntake) > 0 ? (dailyGoal - todayIntake) : 0} ml
          </p>
        </div>

        {percentage >= 100 && (
          <div className="absolute top-4 right-4 bg-yellow-400 text-white rounded-full p-1.5 shadow-md flex items-center gap-1 text-[10px] font-bold uppercase animate-bounce z-20">
            <Award className="w-3.5 h-3.5" />
            Meta Batida!
          </div>
        )}
      </div>

      {/* Adding controls */}
      <div>
        <h4 className="text-xs font-heading font-semibold text-stone-500 uppercase tracking-wider mb-3">Registrar Ingestão Rápida</h4>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => addWater(200)}
            className="p-3 bg-stone-50 hover:bg-blue-50 hover:text-blue-500 rounded-2xl flex flex-col items-center justify-center border border-stone-100 transition-all btn-interactive group"
          >
            <Droplet className="w-5 h-5 text-stone-400 group-hover:text-blue-400" />
            <span className="text-xs font-bold text-stone-700 mt-1.5">Copo Leve</span>
            <span className="text-[10px] text-stone-400">200ml</span>
          </button>
          
          <button
            onClick={() => addWater(350)}
            className="p-3 bg-stone-50 hover:bg-blue-50 hover:text-blue-500 rounded-2xl flex flex-col items-center justify-center border border-stone-100 transition-all btn-interactive group"
          >
            <Droplet className="w-6 h-6 text-stone-400 group-hover:text-blue-400" />
            <span className="text-xs font-bold text-stone-700 mt-1.5">Copo Médio</span>
            <span className="text-[10px] text-stone-400">350ml</span>
          </button>

          <button
            onClick={() => addWater(500)}
            className="p-3 bg-stone-50 hover:bg-blue-50 hover:text-blue-500 rounded-2xl flex flex-col items-center justify-center border border-stone-100 transition-all btn-interactive group"
          >
            <Droplet className="w-7 h-7 text-stone-400 group-hover:text-blue-400" />
            <span className="text-xs font-bold text-stone-700 mt-1.5">Garrafa</span>
            <span className="text-[10px] text-stone-400">500ml</span>
          </button>
        </div>
      </div>

      {/* History log */}
      <div>
        <div className="flex items-center justify-between mb-3 border-t border-stone-50 pt-4">
          <h4 className="text-xs font-heading font-semibold text-stone-500 uppercase tracking-wider">Histórico de Hoje</h4>
          <span className="text-[10px] text-stone-400">Clique para remover</span>
        </div>

        <div className="max-h-36 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
          {logs.filter(l => l.date === getTodayDateString()).length === 0 ? (
            <div className="text-center py-4 bg-stone-50/50 rounded-2xl">
              <span className="text-[11px] text-stone-400 block font-medium">Nenhum registro ainda hoje.</span>
              <span className="text-[10px] text-stone-400 block">Hidrate-se!</span>
            </div>
          ) : (
            logs.filter(l => l.date === getTodayDateString()).map((log) => (
              <div 
                key={log.id} 
                className="flex items-center justify-between p-2.5 bg-stone-50 hover:bg-red-50 hover:border-red-100 border border-transparent rounded-xl transition-all group duration-200"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-300"></div>
                  <span className="text-xs font-semibold text-stone-700">{log.amount} ml</span>
                  <span className="text-[10px] text-stone-400">Registrado agora há pouco</span>
                </div>
                <button 
                  onClick={() => deleteLog(log.id)}
                  className="text-stone-300 hover:text-red-500 p-1 rounded-md transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
