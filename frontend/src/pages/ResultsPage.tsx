import React from "react"
import { useParams, Link } from "react-router-dom"
import { useMission } from "../hooks/useMission"
import { 
  Plane, Hotel, MapPin, Calendar, Users, 
  Loader2, CheckCircle2, AlertCircle, TrendingUp,
  ArrowRight, ExternalLink, Info
} from "lucide-react"

const FlightCard = ({ flight }: { flight: any }) => (
  <div className="bg-card border rounded-xl p-6 hover:shadow-md transition-all group">
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
          <Plane className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h4 className="font-bold text-slate-900">{flight.airline}</h4>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{flight.source}</p>
        </div>
      </div>
      <div className="text-right">
        <span className="text-2xl font-black text-indigo-600">{flight.price_per_person}€</span>
        <p className="text-[10px] text-muted-foreground uppercase">Por persona</p>
      </div>
    </div>
    
    <div className="flex items-center justify-between text-sm py-4 border-y border-dashed border-slate-100 mb-4">
      <div className="text-center">
        <p className="font-bold">{new Date(flight.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        <p className="text-xs text-muted-foreground">{flight.origin_airport}</p>
      </div>
      <div className="flex-1 px-4 flex flex-col items-center">
        <span className="text-[10px] text-slate-400 font-medium mb-1">{Math.floor(flight.duration_minutes / 60)}h {flight.duration_minutes % 60}m</span>
        <div className="w-full h-[1px] bg-slate-200 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-slate-400" />
        </div>
      </div>
      <div className="text-center">
        <p className="font-bold">{new Date(flight.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        <p className="text-xs text-muted-foreground">{flight.destination_airport}</p>
      </div>
    </div>

    {flight.booking_link && (
      <a 
        href={flight.booking_link} 
        target="_blank" 
        rel="noopener noreferrer"
        className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all border border-slate-200"
      >
        Reservar ahora <ExternalLink className="h-3 w-3" />
      </a>
    )}
  </div>
)

const HotelCard = ({ hotel }: { hotel: any }) => (
  <div className="bg-card border rounded-xl overflow-hidden hover:shadow-md transition-all">
    <div className="p-6">
      <div className="flex justify-between items-start mb-2">
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
          hotel.tier === 'premium' ? 'bg-amber-100 text-amber-700' : 
          hotel.tier === 'comfort' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
        }`}>
          {hotel.tier}
        </span>
        <span className="text-lg font-bold text-slate-900">{hotel.price_per_night}€<span className="text-xs font-normal text-muted-foreground">/noche</span></span>
      </div>
      <h4 className="font-bold text-slate-800 text-lg mb-1 leading-tight">{hotel.name}</h4>
      <div className="flex items-center gap-1 text-slate-500 text-xs mb-4">
        <MapPin className="h-3 w-3" />
        <span className="truncate">{hotel.address}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-50 mb-4 bg-slate-50/50 -mx-6 px-6">
        <div>
          <p className="text-[10px] uppercase text-muted-foreground font-bold">Total Estancia</p>
          <p className="font-bold text-indigo-600">{hotel.total_stay_price}€</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-muted-foreground font-bold">Noches</p>
          <p className="font-bold">{hotel.nights}</p>
        </div>
      </div>

      {hotel.booking_link && (
        <a 
          href={hotel.booking_link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/10"
        >
          Ver en {hotel.source.charAt(0).toUpperCase() + hotel.source.slice(1)} <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  </div>
)

export const ResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { mission, loading, error, pollingActive } = useMission(id)

  if (!mission) {
    return (
      <div className="container h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">Buscando misión en órbita...</p>
      </div>
    )
  }

  const isComplete = mission.status === "done"
  const isClarifying = mission.status === "clarifying"

  return (
    <div className="container py-10 px-4">
      {/* Header Summary */}
      <div className="bg-slate-900 rounded-3xl p-8 mb-10 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Plane className="h-32 w-32 -rotate-12" />
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
              isComplete ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              mission.status === 'error' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              {isComplete ? <CheckCircle2 className="h-3 w-3" /> : pollingActive ? <Loader2 className="h-3 w-3 animate-spin" /> : <AlertCircle className="h-3 w-3" />}
              {mission.status.toUpperCase()}
            </span>
            <span className="text-slate-400 text-xs font-medium uppercase tracking-widest border border-white/10 px-3 py-1 rounded-full">
              ID: {mission.id.slice(0,8)}...
            </span>
          </div>

          <h2 className="text-4xl font-black mb-4">Propuesta: {mission.travel_request.destination}</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-indigo-400" />
              </div>
              <div>
                <p className="text-slate-500 text-[10px] font-bold uppercase">Fechas</p>
                <p className="font-semibold">{new Date(mission.travel_request.outbound_date).toLocaleDateString()} - {new Date(mission.travel_request.return_date).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
                <Users className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <p className="text-slate-500 text-[10px] font-bold uppercase">Pasajeros</p>
                <p className="font-semibold">{mission.travel_request.num_passengers}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-teal-400" />
              </div>
              <div>
                <p className="text-slate-500 text-[10px] font-bold uppercase">Estilo</p>
                <p className="font-semibold capitalize">{mission.travel_request.travel_style}</p>
              </div>
            </div>
            {isComplete && (
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <span className="font-bold text-emerald-400 text-xs">€</span>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] font-bold uppercase">Presupuesto</p>
                  <p className="font-black text-emerald-400 text-lg">~{mission.total_estimated_budget}€</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {mission.research_context && (
        <div className="mb-12 p-6 glass rounded-2xl flex gap-4 items-center">
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
            <Info className="h-6 w-6 text-indigo-600" />
          </div>
          <p className="text-slate-700 italic leading-relaxed text-lg">"{mission.research_context}"</p>
        </div>
      )}

      {isClarifying && (
        <div className="mb-12 bg-indigo-50 border border-indigo-200 p-8 rounded-3xl text-center space-y-6">
          <h3 className="text-2xl font-bold text-indigo-900">Nuestra IA necesita unos detalles más</h3>
          <p className="text-indigo-700 max-w-xl mx-auto">Para que tu viaje sea perfecto, responde a estas preguntas del agente:</p>
          <div className="flex justify-center">
             <Link to={`/mission/${id}/clarify`} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-xl shadow-indigo-600/20">Responder Preguntas</Link>
          </div>
        </div>
      )}

      {/* Main Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Flights Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black flex items-center gap-2 uppercase tracking-tight">
              <Plane className="h-6 w-6 text-indigo-600" /> Vuelos
            </h3>
            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-xs font-bold">{mission.flights.length}</span>
          </div>
          {mission.flights.length > 0 ? (
            <div className="space-y-4">
              {mission.flights.map(f => <FlightCard key={f.id} flight={f} />)}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl p-10 text-center border border-dashed border-slate-200">
              <Loader2 className="h-8 w-8 text-slate-300 animate-spin mx-auto mb-4" />
              <p className="text-slate-400 font-medium">Buscando las mejores rutas comerciales...</p>
            </div>
          )}
        </div>

        {/* Hotels Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black flex items-center gap-2 uppercase tracking-tight">
              <Hotel className="h-6 w-6 text-indigo-600" /> Alojamientos recomendados
            </h3>
            {isComplete && (
              <Link to={`/mission/${id}/itinerary`} className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group">
                Ver Itinerario Completo <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mission.accommodations_comfort.length > 0 ? (
              mission.accommodations_comfort.slice(0,4).map(h => <HotelCard key={h.id} hotel={h} />)
            ) : (
              <div className="col-span-full bg-slate-50 rounded-2xl p-20 text-center border border-dashed border-slate-200">
                 <Loader2 className="h-8 w-8 text-slate-300 animate-spin mx-auto mb-4" />
                 <p className="text-slate-400 font-medium">Verificando disponibilidad de hoteles premium...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
