import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { api } from "../lib/api"
import { MissionState } from "../lib/types"
import {
  Plane, MapPin, Calendar, CheckCircle2,
  Loader2, AlertCircle, ArrowRight, Clock, Users, Sparkles
} from "lucide-react"

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  done:      { label: "Completado",  color: "bg-emerald-50 text-emerald-600 ring-emerald-100" },
  error:     { label: "Error",       color: "bg-rose-50 text-rose-600 ring-rose-100" },
  clarifying:{ label: "En espera",   color: "bg-amber-50 text-amber-600 ring-amber-100" },
  searching: { label: "Buscando…",   color: "bg-sky-50 text-sky-600 ring-sky-100" },
  planning:  { label: "Planificando",color: "bg-violet-50 text-violet-600 ring-violet-100" },
  init:      { label: "Iniciando",   color: "bg-slate-50 text-slate-500 ring-slate-100" },
}

export const MyTripsPage: React.FC = () => {
  const [trips, setTrips] = useState<MissionState[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadTrips = async () => {
      try {
        // Retrieve stored mission IDs from localStorage
        const raw = localStorage.getItem("travelPro_missions")
        const ids: string[] = raw ? JSON.parse(raw) : []

        if (ids.length === 0) {
          setTrips([])
          return
        }

        const results = await Promise.allSettled(ids.map(id => api.getMission(id)))
        const loaded = results
          .filter((r): r is PromiseFulfilledResult<MissionState> => r.status === "fulfilled")
          .map(r => r.value)

        setTrips(loaded)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    loadTrips()
  }, [])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
          <p className="font-bold uppercase tracking-widest text-xs">Cargando viajes…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] py-20 px-4 bg-slate-50">
      <div className="max-w-5xl mx-auto space-y-12">

        {/* Header */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-50 text-violet-600 text-xs font-black uppercase tracking-wider"
          >
            <Sparkles className="h-3.5 w-3.5" /> Mis Viajes
          </motion.div>
          <h1 className="text-5xl font-black tracking-tight text-slate-900">
            Historial de <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-500">Misiones</span>
          </h1>
          <p className="text-slate-500 text-lg font-medium">
            Aquí encontrarás todos los viajes que has planificado con TravelPro.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-bold flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && trips.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-32 text-center space-y-8"
          >
            <div className="h-24 w-24 rounded-full bg-violet-50 flex items-center justify-center mx-auto">
              <Plane className="h-12 w-12 text-violet-300" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900">Sin viajes todavía</h3>
              <p className="text-slate-500 font-medium">Crea tu primera misión y aparecerá aquí.</p>
            </div>
            <Link
              to="/planner"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-black rounded-2xl shadow-xl shadow-violet-200 hover:scale-105 transition-all"
            >
              Planificar ahora <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        )}

        {/* Trips grid */}
        <AnimatePresence>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trips.map((trip, i) => {
              const statusInfo = STATUS_LABEL[trip.status] ?? STATUS_LABEL.init
              const dest = trip.travel_request?.destination ?? "Destino desconocido"
              const outbound = trip.travel_request?.outbound_date
              const passengers = trip.travel_request?.num_passengers

              return (
                <motion.div
                  key={trip.id || i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col gap-6 group hover:shadow-2xl hover:shadow-violet-100/50 transition-all"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between">
                    <div className="h-12 w-12 rounded-2xl bg-violet-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Plane className="h-6 w-6 text-violet-600" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Destination */}
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-violet-600 transition-colors leading-tight">
                      {dest}
                    </h3>
                    {trip.travel_request?.origin && (
                      <p className="text-slate-400 text-sm font-medium mt-1">
                        desde {trip.travel_request.origin}
                      </p>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="grid grid-cols-2 gap-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {outbound && (
                      <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(outbound).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                      </div>
                    )}
                    {passengers && (
                      <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl">
                        <Users className="h-3.5 w-3.5" />
                        {passengers} viajero{passengers !== 1 ? "s" : ""}
                      </div>
                    )}
                    {trip.nodes_completed?.length > 0 && (
                      <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        {trip.nodes_completed.length} nodos
                      </div>
                    )}
                    {trip.total_estimated_budget != null && (
                      <div className="flex items-center gap-2 bg-violet-50 p-3 rounded-xl text-violet-600">
                        <MapPin className="h-3.5 w-3.5" />
                        ~{trip.total_estimated_budget}€
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <Link
                    to={`/mission/${trip.id}`}
                    className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-violet-200/50 hover:scale-[1.02] transition-all"
                  >
                    Ver misión <ArrowRight className="h-4 w-4" />
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </AnimatePresence>

        {trips.length > 0 && (
          <div className="text-center pt-6">
            <Link
              to="/planner"
              className="inline-flex items-center gap-2 px-8 py-3 bg-white border border-slate-100 text-violet-600 font-black rounded-2xl hover:bg-violet-50 transition-all shadow-sm"
            >
              + Nueva misión
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
