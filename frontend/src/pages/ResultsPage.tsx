import React from "react"
import { useParams, Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useMission } from "../hooks/useMission"
import { 
  Plane, Hotel, MapPin, Calendar, Users, 
  Loader2, CheckCircle2, AlertCircle, TrendingUp,
  ArrowRight, ExternalLink, Info, Sparkles, Navigation
} from "lucide-react"
import { useAgentStream } from "../hooks/useAgentStream"
import { AgentTracker } from "../components/AgentTracker"
import { VividCard } from "../components/VividCard"
import { TripMap } from "../components/TripMap"

const FlightCard = ({ flight, index }: { flight: any, index: number }) => (
  <VividCard delay={index * 0.1} className="p-0 overflow-hidden group">
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-violet-50 flex items-center justify-center ring-1 ring-violet-100 group-hover:scale-110 transition-transform">
            <Plane className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <h4 className="font-black text-slate-900 text-lg">{flight.airline}</h4>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <span>{flight.source}</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>Directo</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-transparent bg-clip-text vivid-gradient tracking-tight">
            {flight.price_per_person}€
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Por persona</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between bg-slate-50/50 rounded-2xl p-6 mb-6">
        <div className="text-center">
          <p className="text-2xl font-black text-slate-800">
            {new Date(flight.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{flight.origin_airport}</p>
        </div>
        
        <div className="flex-1 px-8 flex flex-col items-center">
          <span className="text-[10px] text-slate-400 font-black mb-2 uppercase tracking-tighter">
            {Math.floor(flight.duration_minutes / 60)}h {flight.duration_minutes % 60}m
          </span>
          <div className="w-full h-[2px] bg-slate-200 relative">
            <div className="absolute top-1/2 left-0 -translate-y-1/2 h-2 w-2 rounded-full bg-slate-300 ring-4 ring-white" />
            <div className="absolute top-1/2 right-0 -translate-y-1/2 h-2 w-2 rounded-full bg-violet-400 ring-4 ring-white shadow-lg shadow-violet-200" />
            <Navigation className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 text-slate-300 bg-white p-0.5 rounded-full" />
          </div>
        </div>

        <div className="text-center">
          <p className="text-2xl font-black text-slate-800">
            {new Date(flight.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{flight.destination_airport}</p>
        </div>
      </div>

      {flight.booking_link && (
        <a 
          href={flight.booking_link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full py-4 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-black flex items-center justify-center gap-3 transition-all border-2 border-slate-100 hover:border-violet-200 shadow-sm"
        >
          Sellar Reserva <ExternalLink className="h-4 w-4 text-violet-500" />
        </a>
      )}
    </div>
  </VividCard>
)

const HotelCard = ({ hotel, index }: { hotel: any, index: number }) => (
  <VividCard delay={index * 0.1} className="p-0 overflow-hidden flex flex-col h-full group">
    <div className="p-6 flex-1">
      <div className="flex justify-between items-start mb-4">
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ${
          hotel.tier === 'premium' ? 'bg-amber-50 text-amber-600 ring-amber-100' : 
          hotel.tier === 'comfort' ? 'bg-sky-50 text-sky-600 ring-sky-100' : 'bg-emerald-50 text-emerald-600 ring-emerald-100'
        }`}>
          {hotel.tier === 'premium' ? 'Lujo' : 
          hotel.tier === 'comfort' ? 'Confort' : 'Económico'}
        </span>
        <div className="text-right">
          <span className="text-2xl font-black text-slate-900">{hotel.price_per_night}€</span>
          <span className="text-[10px] font-bold text-slate-400 block uppercase">/noche</span>
        </div>
      </div>
      
      <h4 className="font-black text-slate-900 text-xl mb-2 group-hover:text-violet-600 transition-colors leading-tight">{hotel.name}</h4>
      <div className="flex items-center gap-2 text-slate-400 font-medium text-sm mb-6">
        <MapPin className="h-4 w-4 text-slate-300" />
        <span className="truncate">{hotel.address}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-6 py-4 border-y border-slate-50 mb-6 bg-slate-50/30 -mx-6 px-6">
        <div>
          <p className="text-[10px] uppercase text-slate-400 font-black mb-1 tracking-wider">Total Estancia</p>
          <p className="font-black text-slate-900 text-lg leading-none">{hotel.total_stay_price}€</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-slate-400 font-black mb-1 tracking-wider">Noches</p>
          <p className="font-black text-slate-900 text-lg leading-none">{hotel.nights}</p>
        </div>
      </div>
    </div>

    <div className="p-4 bg-slate-50/50 border-t border-slate-50">
      {hotel.booking_link && (
        <a 
          href={hotel.booking_link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full py-3.5 vivid-gradient text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-200/50 hover:scale-[1.02]"
        >
          Reservar en {hotel.source.charAt(0).toUpperCase() + hotel.source.slice(1)}
        </a>
      )}
    </div>
  </VividCard>
)

export const ResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { mission, loading, error: missionError, refreshMission } = useMission(id)
  const { status, completedNodes, error: streamError } = useAgentStream(id || '')

  React.useEffect(() => {
    if (status === 'done' && id) {
      refreshMission(id)
    }
  }, [status, id, refreshMission])

  if (missionError) {
    return (
      <div className="container py-20 text-center">
        <div className="inline-flex h-20 w-20 rounded-full bg-rose-50 items-center justify-center mb-6">
          <AlertCircle className="h-10 w-10 text-rose-500" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-4">Error en la misión</h2>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">{missionError}</p>
        <Link to="/" className="px-8 py-3 vivid-gradient text-white font-black rounded-xl shadow-xl shadow-violet-200">Volver al inicio</Link>
      </div>
    )
  }

  const isComplete = mission?.status === "done"
  const isClarifying = mission?.status === "clarifying"

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-10 min-h-[calc(100vh-64px)]">
      <div className="flex flex-col lg:flex-row gap-10">
        
        {/* LEFT PANEL: Mission Control Sidebar */}
        <aside className="lg:w-[380px] flex-shrink-0">
          <div className="lg:sticky lg:top-24 space-y-6">
            
            {/* Status Card */}
            <div className="glass-card bg-white p-6 rounded-3xl ring-1 ring-slate-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Sparkles className="h-20 w-20 vivid-gradient" />
              </div>
              
              <div className="flex items-center gap-3 mb-6">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                  isComplete ? 'bg-emerald-50 text-emerald-600' : 'bg-violet-50 text-violet-600'
                }`}>
                  {isComplete ? <CheckCircle2 className="h-6 w-6" /> : <Loader2 className="h-6 w-6 animate-spin" />}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Misión</h3>
                  <p className="text-xl font-black text-slate-900 leading-none">
                    {isComplete ? "Completada" : "En Proceso..."}
                  </p>
                </div>
              </div>

              {mission && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-violet-500" />
                      <span className="text-sm font-bold text-slate-600">{mission.travel_request?.destination ?? "—"}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <div className="bg-slate-50 p-3 rounded-2xl">
                      <p className="mb-1 opacity-60">Desde</p>
                      <p className="text-slate-700">
                        {mission.travel_request?.outbound_date
                          ? new Date(mission.travel_request.outbound_date).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl">
                      <p className="mb-1 opacity-60">Viajeros</p>
                      <p className="text-slate-700">{mission.travel_request?.num_passengers ?? "—"}</p>
                    </div>
                  </div>

                  {isComplete && (
                   <div className="pt-2">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1 text-center">Presupuesto Estimado</p>
                     <div className="py-4 vivid-gradient text-white text-center rounded-2xl shadow-xl shadow-violet-200">
                       <span className="text-3xl font-black tracking-tighter">~{mission.total_estimated_budget ?? 0}€</span>
                     </div>
                   </div>
                  )}
                </div>
              )}
            </div>

            {/* Trip Map */}
            {mission?.travel_request?.origin && mission?.travel_request?.destination && (
              <div className="glass-card bg-white p-4 rounded-3xl ring-1 ring-slate-100">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2 px-1">
                  <MapPin className="h-3.5 w-3.5" /> Ruta del Viaje
                </h4>
                <TripMap
                  origin={mission.travel_request.origin}
                  destination={mission.travel_request.destination}
                />
              </div>
            )}

            {/* Agent Thinking Progress */}
            <div className="glass-card bg-white p-6 rounded-3xl ring-1 ring-slate-100">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Navigation className="h-3.5 w-3.5" /> Bitácora del Agente
              </h4>
              <AgentTracker status={status} completedNodes={completedNodes} />
            </div>
            
            {isClarifying && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 bg-indigo-50 border-2 border-indigo-200 rounded-3xl text-center space-y-4 shadow-xl shadow-indigo-100"
              >
                <Info className="h-8 w-8 text-indigo-600 mx-auto" />
                <h3 className="font-black text-indigo-900 leading-tight">Acción Requerida</h3>
                <p className="text-indigo-700 text-xs font-bold leading-relaxed">El agente ha encontrado opciones que requieren tu validación personal.</p>
                <Link 
                  to={`/mission/${id}/clarify`} 
                  className="w-full py-3 bg-indigo-600 text-white text-xs font-black rounded-xl inline-block shadow-lg shadow-indigo-600/20 uppercase tracking-wider"
                >
                  Responder ahora
                </Link>
              </motion.div>
            )}
          </div>
        </aside>

        {/* RIGHT PANEL: Scrollable Content Area */}
        <main className="flex-1 space-y-12 min-w-0">
          
          {/* Intro Context */}
          {mission?.research_context && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative p-10 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden"
            >
              <div className="absolute top-0 right-0 px-8 py-4 opacity-5 rotate-12">
                <Sparkles className="h-32 w-32" />
              </div>
              <div className="relative z-10 flex gap-6 items-start">
                <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0 animate-bounce transition-all duration-1000">
                  <Info className="h-7 w-7 text-indigo-600" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    Visión Estratégica del Agente
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  </h2>
                  <p className="text-slate-500 italic leading-relaxed text-xl font-medium font-serif">
                    "{mission.research_context}"
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Flights Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tighter uppercase">
                <div className="h-8 w-8 bg-violet-600 rounded-lg flex items-center justify-center">
                  <Plane className="h-5 w-5 text-white" />
                </div>
                Vuelos Encontrados
              </h3>
              {mission && (
                <span className="bg-slate-100 text-slate-500 px-4 py-1 rounded-full text-xs font-black border border-slate-200">
                  {mission.flights?.length ?? 0} OPCIONES
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <AnimatePresence>
                {mission?.flights?.length ? (
                  mission.flights.map((f, i) => (
                    <FlightCard key={f.id} flight={f} index={i} />
                  ))
                ) : (
                  <div className="col-span-full py-20 glass-card bg-white border-2 border-dashed border-slate-100 flex flex-col items-center justify-center space-y-4 opacity-60">
                    <Loader2 className="h-10 w-10 text-violet-400 animate-spin" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Escaneando corredores aéreos...</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Accommodations Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tighter uppercase">
                <div className="h-8 w-8 bg-sky-600 rounded-lg flex items-center justify-center">
                  <Hotel className="h-5 w-5 text-white" />
                </div>
                Alojamientos Curados
              </h3>
              {isComplete && (
                <Link to={`/mission/${id}/itinerary`} className="text-xs font-black text-violet-600 hover:text-violet-700 flex items-center gap-2 group uppercase tracking-widest bg-violet-50 px-4 py-2 rounded-full transition-all hover:pr-6">
                  Itinerario Detallado <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence>
                {mission?.accommodations_comfort?.length ? (
                  mission.accommodations_comfort.map((h, i) => (
                    <HotelCard key={h.id} hotel={h} index={i} />
                  ))
                ) : (
                  <div className="col-span-full py-20 glass-card bg-white border-2 border-dashed border-slate-100 flex flex-col items-center justify-center space-y-4 opacity-60">
                    <Loader2 className="h-10 w-10 text-sky-400 animate-spin" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Validando disponibilidad hotelera...</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </section>

        </main>
      </div>
    </div>
  )
}
