import React from "react"
import { useParams, Link } from "react-router-dom"
import { useMission } from "../hooks/useMission"
import { 
  Calendar, MapPin, Clock, Info, 
  ChevronRight, ArrowLeft, Loader2, Sparkles, Plane
} from "lucide-react"

export const ItineraryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { mission, loading } = useMission(id)

  if (!mission || mission.status !== "done") {
    return (
      <div className="container h-[60vh] flex flex-col items-center justify-center space-y-4">
        {loading ? <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" /> : <Plane className="h-10 w-10 text-indigo-600" />}
        <p className="text-slate-500 font-medium">Generando itinerario detallado con IA...</p>
        <Link to={`/mission/${id}`} className="text-indigo-600 font-bold hover:underline">Volver al resumen</Link>
      </div>
    )
  }

  return (
    <div className="container py-10 px-4 max-w-4xl">
      <div className="mb-10">
        <Link 
          to={`/mission/${id}`} 
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors mb-6 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Volver a la Propuesta
        </Link>
        
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">Tu Itinerario en {mission.travel_request.destination}</h1>
        <p className="text-muted-foreground text-lg">Un plan día a día optimizado para tu estilo {mission.travel_request.travel_style}.</p>
      </div>

      <div className="space-y-12 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
        {mission.itinerary.map((day, idx) => (
          <div key={idx} className="relative pl-12 group">
            {/* Timeline dot */}
            <div className="absolute left-0 top-0 h-10 w-10 rounded-full bg-white border-4 border-indigo-600 shadow-lg shadow-indigo-200 z-10 flex items-center justify-center font-black text-xs text-indigo-600 group-hover:scale-110 transition-transform">
              {day.day_number}
            </div>

            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <h3 className="text-2xl font-bold text-slate-900">
                  Día {day.day_number}: {new Date(day.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
                <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full w-fit">
                  Est. {day.estimated_cost}€
                </span>
              </div>

              <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
                "{day.summary}"
              </p>

              <div className="grid gap-4">
                {day.activities.map((activity, aIdx) => (
                  <div key={aIdx} className="bg-white border rounded-2xl p-5 hover:border-indigo-200 transition-colors shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-widest ${
                          activity.type === 'adventure' ? 'bg-orange-100 text-orange-700' :
                          activity.type === 'food' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {activity.type}
                        </span>
                        {activity.source === 'groq' && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                            <Sparkles className="h-2.5 w-2.5" /> IA
                          </div>
                        )}
                      </div>
                      {activity.price_eur !== undefined && activity.price_eur > 0 && (
                        <span className="text-xs font-bold text-slate-900">{activity.price_eur}€</span>
                      )}
                    </div>
                    
                    <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                      {activity.name}
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </h4>
                    
                    <p className="text-sm text-slate-500 mb-4 line-clamp-2 md:line-clamp-none">
                      {activity.description}
                    </p>

                    <div className="flex items-center gap-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {activity.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                          <span className="truncate max-w-[150px]">{activity.location}</span>
                        </div>
                      )}
                      {activity.duration_hours !== undefined && activity.duration_hours > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-indigo-400" />
                          <span>{activity.duration_hours}h</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Final Summary Card */}
      <div className="mt-20 p-10 bg-slate-900 rounded-[40px] text-white text-center space-y-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.2),transparent)]" />
        <div className="relative z-10">
          <Sparkles className="h-10 w-10 text-indigo-400 mx-auto mb-4" />
          <h3 className="text-3xl font-black">Plan Completado</h3>
          <p className="text-slate-400 max-w-lg mx-auto">
            Este itinerario ha sido optimizado por nuestro agente para maximizar tu experiencia en {mission.travel_request.destination}.
          </p>
          <div className="flex justify-center gap-4 mt-8">
            <button className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-xl shadow-indigo-600/20">
              Descargar PDF
            </button>
            <button className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all">
              Compartir Viaje
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
