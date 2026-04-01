import React from "react";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  Hotel, 
  Map as MapIcon, 
  LayoutDashboard
} from "lucide-react";

interface Step {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  { id: "ai_prompter", label: "Analizando Solicitud", icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: "hotel_searcher", label: "Buscando Alojamiento", icon: <Hotel className="h-4 w-4" /> },
  { id: "itinerary", label: "Diseñando Itinerario", icon: <MapIcon className="h-4 w-4" /> },
];

import { MissionStatus } from "../hooks/useAgentStream";

interface AgentTrackerProps {
  status: MissionStatus;
  completedNodes: string[];
}

export const AgentTracker: React.FC<AgentTrackerProps> = ({ status, completedNodes }) => {
  const isCompleted = (id: string) => completedNodes.includes(id);
  const isActive = (id: string) => {
    if (['idle', 'done', 'error', 'clarifying'].includes(status)) return false;
    const lastCompleted = completedNodes[completedNodes.length - 1];
    const currentIndex = STEPS.findIndex(s => s.id === id);
    const lastIndex = STEPS.findIndex(s => s.id === lastCompleted);
    // Active if it's the first step and none are completed, OR if it's the step after the last completed one.
    return currentIndex === lastIndex + 1 || (currentIndex === 0 && completedNodes.length === 0);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
          Estado del Agente
        </h3>
        {['init', 'planning', 'searching', 'itinerary'].includes(status) && (
          <div className="flex items-center gap-2 px-3 py-1 bg-violet-50 text-violet-600 rounded-full text-xs font-bold animate-pulse-vivid">
            <Loader2 className="h-3 w-3 animate-spin" />
            Pensando...
          </div>
        )}
      </div>

      <div className="space-y-4">
        {STEPS.map((step, index) => {
          const completed = isCompleted(step.id);
          const active = isActive(step.id);

          return (
            <div key={step.id} className="relative">
              {/* Connector Line */}
              {index < STEPS.length - 1 && (
                <div 
                  className={`absolute left-[19px] top-10 w-[2px] h-8 transition-colors duration-500 ${
                    completed ? "bg-violet-600" : "bg-slate-100"
                  }`} 
                />
              )}

              <motion.div 
                initial={false}
                animate={{
                  opacity: completed || active || status === "idle" ? 1 : 0.5,
                  x: active ? 4 : 0
                }}
                className={`flex items-start gap-4 p-3 rounded-2xl transition-all ${
                  active ? "bg-white shadow-lg shadow-violet-100 ring-1 ring-violet-100" : ""
                }`}
              >
                <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-500 ${
                  completed 
                    ? "vivid-gradient text-white shadow-lg shadow-violet-200" 
                    : active
                    ? "bg-violet-100 text-violet-600 ring-2 ring-violet-200"
                    : "bg-slate-100 text-slate-400"
                }`}>
                  {completed ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : active ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    step.icon
                  )}
                </div>

                <div className="flex flex-col">
                  <span className={`text-sm font-bold transition-colors ${
                    completed ? "text-slate-900" : active ? "text-violet-600" : "text-slate-500"
                  }`}>
                    {step.label}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {completed ? "Finalizado" : active ? "En progreso..." : "Pendiente"}
                  </span>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>

      {status === "error" && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-xs font-bold leading-tight">
            Hubo un error en la misión. Por favor, reintenta.
          </p>
        </motion.div>
      )}
    </div>
  );
};
