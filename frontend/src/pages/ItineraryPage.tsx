import React from "react"
import { useParams, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { useMission } from "../hooks/useMission"
import { 
  Calendar, MapPin, Clock, Info, 
  ChevronRight, ArrowLeft, Loader2, Sparkles, Plane, Download, Share2
} from "lucide-react"
import { VividCard } from "../components/VividCard"

const handlePrintPDF = (destination: string) => {
  const originalTitle = document.title
  document.title = `Itinerario - ${destination}`
  window.print()
  document.title = originalTitle
}

export const ItineraryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { mission, loading } = useMission(id)

  if (!mission || mission.status !== "done") {
    return (
      <div className="container h-[70vh] flex flex-col items-center justify-center space-y-8 px-4 text-center">
        <div className="relative">
          <div className="absolute inset-0 bg-violet-100/50 rounded-full blur-2xl animate-pulse" />
          {loading ? <Loader2 className="h-16 w-16 text-violet-600 animate-spin relative" /> : <Plane className="h-16 w-16 text-violet-600-600 relative" />}
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900">Orquestando tu itinerario...</h2>
          <p className="text-slate-500 font-medium">Nuestro agente está curando cada detalle para que tu viaje sea impecable.</p>
        </div>
        <Link to={`/mission/${id}`} className="px-6 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all border border-slate-200">Volver al resumen</Link>
      </div>
    )
  }

  return (
    <div className="bg-slate-50 min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-16 space-y-6">
          <Link 
            to={`/mission/${id}`} 
            className="inline-flex items-center gap-2.5 text-xs font-black text-slate-400 hover:text-violet-600 transition-all group uppercase tracking-[0.2em] bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
            Volver a la Misión
          </Link>
          
          <div className="space-y-4">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-5xl md:text-6xl font-black tracking-tight text-slate-900 leading-[1.1]"
            >
              Tu itinerario <br />
              <span className="text-transparent bg-clip-text vivid-gradient">en {mission.travel_request.destination}</span>
            </motion.h1>
            <p className="text-slate-500 text-lg font-medium max-w-2xl">
              Un plan maestro detallado día a día, optimizado algorítmicamente para {mission.travel_request.num_passengers} personas con un estilo {mission.travel_request.travel_style}.
            </p>
          </div>
        </div>

        <div className="space-y-16 relative before:absolute before:left-[23px] before:top-4 before:bottom-4 before:w-[2px] before:bg-slate-200/50">
          {mission.itinerary.map((day, idx) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative pl-16 group"
            >
              {/* Timeline marker */}
              <div className="absolute left-0 top-0 h-12 w-12 rounded-[1.25rem] bg-white border-2 border-slate-100 shadow-xl shadow-slate-100 z-10 flex items-center justify-center font-black text-lg text-slate-900 group-hover:bg-violet-600 group-hover:text-white group-hover:border-violet-600 transition-all duration-500">
                {day.day_number}
              </div>

              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                    {new Date(day.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h3>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-emerald-50 text-emerald-600 text-xs font-black uppercase tracking-widest border border-emerald-100">
                    Est. {day.estimated_cost}€
                  </div>
                </div>

                <div className="p-8 bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-125 transition-transform duration-1000">
                    <Sparkles className="h-20 w-20 vivid-gradient" />
                  </div>
                  <p className="text-slate-500 italic leading-relaxed text-xl font-medium font-serif relative z-10">
                    "{day.summary}"
                  </p>
                </div>

                <div className="grid gap-6">
                  {day.activities.map((activity, aIdx) => (
                    <VividCard key={aIdx} className="hover:ring-violet-200 transition-all group/card border-none ring-1 ring-slate-100">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${
                            activity.type === 'adventure' ? 'bg-orange-50 text-orange-600' :
                            activity.type === 'food' ? 'bg-rose-50 text-rose-600' : 'bg-sky-50 text-sky-600'
                          }`}>
                            {activity.type === 'adventure' ? 'Aventura' :
                             activity.type === 'food' ? 'Gastronomía' : 
                             activity.type === 'cultural' ? 'Cultura' :
                             activity.type === 'nature' ? 'Naturaleza' :
                             activity.type === 'relax' ? 'Relax' :
                             activity.type === 'shopping' ? 'Compras' : 'Actividad'}
                          </span>
                          {activity.source === 'groq' && (
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-violet-600 bg-violet-50 px-3 py-1 rounded-full ring-1 ring-violet-100">
                              <Sparkles className="h-3 w-3" /> AGENTE IA
                            </div>
                          )}
                        </div>
                        {activity.price_eur !== undefined && activity.price_eur > 0 && (
                          <span className="text-lg font-black text-slate-900 tracking-tighter">{activity.price_eur}€</span>
                        )}
                      </div>
                      
                      <h4 className="font-black text-slate-900 text-2xl mb-3 tracking-tight group-hover/card:text-violet-600 transition-colors leading-none flex items-center gap-3">
                        {activity.name}
                        <ChevronRight className="h-5 w-5 text-slate-200 group-hover/card:translate-x-1 group-hover/card:text-violet-300 transition-all" />
                      </h4>
                      
                      <p className="text-slate-500 font-medium leading-relaxed mb-8">
                        {activity.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-8 text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] pt-4 border-t border-slate-50">
                        {activity.location && (
                          <div className="flex items-center gap-2 group/loc">
                            <MapPin className="h-4 w-4 text-slate-300 group-hover/loc:text-violet-400 transition-colors" />
                            <span className="text-slate-400">{activity.location}</span>
                          </div>
                        )}
                        {activity.duration_hours !== undefined && activity.duration_hours > 0 && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-300" />
                            <span className="text-slate-400">{activity.duration_hours} HORAS</span>
                          </div>
                        )}
                      </div>
                    </VividCard>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Final Summary Card */}
        <div className="mt-32 p-16 vivid-gradient rounded-[4rem] text-white text-center space-y-10 relative overflow-hidden shadow-[0_40px_80px_-15px_rgba(139,92,246,0.5)]">
          <div className="absolute inset-x-0 bottom-0 top-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)]" />
          <div className="relative z-10 space-y-8">
            <div className="h-20 w-20 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center mx-auto ring-1 ring-white/20">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <div className="space-y-4">
              <h3 className="text-5xl font-black tracking-tighter">Itinerario Sellado</h3>
              <p className="text-white/80 font-medium text-xl max-w-lg mx-auto leading-relaxed">
                Cada detalle ha sido verificado. Estás a un paso de convertir este plan en recuerdos reales.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-6 pt-4">
              <button
                onClick={() => handlePrintPDF(mission.travel_request?.destination ?? "viaje")}
                className="px-10 py-5 bg-white text-violet-600 font-black rounded-[1.5rem] tracking-wider uppercase text-sm shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-3 print:hidden"
              >
                <Download className="h-5 w-5" /> Descargar Reporte PDF
              </button>
              <button className="px-10 py-5 bg-white/10 text-white border-2 border-white/20 hover:bg-white/20 font-black rounded-[1.5rem] tracking-wider uppercase text-sm transition-all flex items-center justify-center gap-3">
                <Share2 className="h-5 w-5" /> Compartir Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
