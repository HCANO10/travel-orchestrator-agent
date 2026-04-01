import React, { useState } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { useMission } from "../hooks/useMission"
import { TravelRequestDTO } from "../lib/types"
import { 
  Calendar, MapPin, Clock, Info, 
  ChevronRight, ArrowLeft, Loader2, Sparkles, Plane, Rocket, Users, Briefcase
} from "lucide-react"

export const PlannerPage: React.FC = () => {
  const navigate = useNavigate()
  const { startMission, loading, error } = useMission()
  
  const [formData, setFormData] = useState<Partial<TravelRequestDTO>>({
    origin: "",
    destination: "",
    outbound_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    return_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    num_passengers: 2,
    travel_style: "mixed",
    interests: [],
    needs_car_rental: false
  })

  const [dateError, setDateError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setDateError(null)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const outbound = new Date(formData.outbound_date!)
    const returnD = new Date(formData.return_date!)

    if (outbound < today) {
      setDateError("La fecha de salida no puede ser anterior a hoy.")
      return
    }
    if (returnD <= outbound) {
      setDateError("La fecha de vuelta debe ser posterior a la de salida.")
      return
    }

    const mission_id = await startMission(formData as TravelRequestDTO)
    if (mission_id) {
      navigate(`/mission/${mission_id}`)
    }
  }

  const handleInterestChange = (interest: string) => {
    const current = formData.interests || []
    if (current.includes(interest)) {
      setFormData({ ...formData, interests: current.filter(i => i !== interest) })
    } else {
      setFormData({ ...formData, interests: [...current, interest] })
    }
  }

  const availableInterests = ["Cultura", "Gastronomía", "Aventura", "Relax", "Historia", "Naturaleza", "Arte", "Compras"]

  return (
    <div className="min-h-[calc(100vh-64px)] py-20 px-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-violet-200 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-fuchsia-100 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto space-y-12 relative">
        <div className="space-y-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-50 text-violet-600 text-xs font-bold uppercase tracking-wider"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Planificador Inteligente v4.0
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900">
            Tu próximo <span className="text-transparent bg-clip-text vivid-gradient">gran viaje</span> empieza aquí.
          </h1>
          <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto font-medium">
            Define tu destino y deja que nuestro agente orquestador diseñe una experiencia a medida en segundos.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card bg-white/90 p-8 md:p-12 rounded-[2.5rem] space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2 ml-1">
                <MapPin className="h-4 w-4 text-violet-500" /> Origen
              </label>
              <input 
                required
                className="w-full p-4 bg-slate-50/50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                placeholder="Ej: Madrid, España"
                value={formData.origin}
                onChange={e => setFormData({ ...formData, origin: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2 ml-1">
                <MapPin className="h-4 w-4 text-fuchsia-500" /> Destino
              </label>
              <input 
                required
                className="w-full p-4 bg-slate-50/50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                placeholder="Ej: Costa Amalfitana, Italia"
                value={formData.destination}
                onChange={e => setFormData({ ...formData, destination: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-50 pt-10">
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2 ml-1">
                <Calendar className="h-4 w-4 text-sky-500" /> Fechas de Viaje
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="date"
                  required
                  className="w-full p-4 bg-slate-50/50 border border-slate-100 rounded-2xl outline-none text-sm font-medium"
                  value={formData.outbound_date}
                  onChange={e => setFormData({ ...formData, outbound_date: e.target.value })}
                />
                <input 
                  type="date"
                  required
                  className="w-full p-4 bg-slate-50/50 border border-slate-100 rounded-2xl outline-none text-sm font-medium"
                  value={formData.return_date}
                  onChange={e => setFormData({ ...formData, return_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 ml-1">
                  <Users className="h-4 w-4 text-indigo-500" /> Viajeros
                </label>
                <select 
                  className="w-full p-4 bg-slate-50/50 border border-slate-100 rounded-2xl outline-none font-medium appearance-none"
                  value={formData.num_passengers}
                  onChange={e => setFormData({ ...formData, num_passengers: parseInt(e.target.value) })}
                >
                  {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Viajero' : 'Viajeros'}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 ml-1">
                  <Briefcase className="h-4 w-4 text-amber-500" /> Estilo
                </label>
                <select 
                  className="w-full p-4 bg-slate-50/50 border border-slate-100 rounded-2xl outline-none font-medium appearance-none uppercase text-xs tracking-wider"
                  value={formData.travel_style}
                  onChange={e => setFormData({ ...formData, travel_style: e.target.value as any })}
                >
                  <option value="mixed">Mixto</option>
                  <option value="cultural">Cultural</option>
                  <option value="relax">Relajado</option>
                  <option value="adventure">Aventura</option>
                  <option value="gastronomic">Gastronómico</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-slate-50 pt-10">
            <label className="text-sm font-bold text-slate-700 ml-1">Preferencias e Intereses</label>
            <div className="flex flex-wrap gap-3">
              {availableInterests.map(interest => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => handleInterestChange(interest)}
                  className={`px-6 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
                    formData.interests?.includes(interest) 
                      ? 'bg-violet-600 text-white border-violet-600 shadow-xl shadow-violet-200' 
                      : 'bg-white text-slate-500 border-slate-100 hover:border-violet-300'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {(error || dateError) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-bold flex items-center gap-2"
            >
              <Info className="h-4 w-4" />
              {dateError ?? error}
            </motion.div>
          )}

          <button 
            disabled={loading}
            type="submit"
            className="w-full py-5 vivid-gradient vivid-gradient-hover disabled:from-slate-400 disabled:to-slate-400 text-white rounded-[1.5rem] font-black text-xl shadow-2xl shadow-violet-200 flex items-center justify-center gap-3 mt-6 uppercase tracking-widest transition-all"
          >
            {loading ? <Loader2 className="animate-spin h-6 w-6" /> : <Rocket className="h-6 w-6" />}
            {loading ? "Iniciando Misión..." : "Lanzar Orquestador"}
          </button>
        </form>
      </div>
    </div>
  )
}

