import React, { useState } from "react"
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
    <div className="container py-12 px-4 max-w-3xl">
      <div className="space-y-6 mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Nueva Misión de Viaje</h1>
        <p className="text-muted-foreground text-lg">
          Completa los detalles básicos y nuestro agente orquestador empezará a buscar las mejores opciones para ti.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border rounded-2xl p-8 shadow-xl space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-indigo-500" /> Origen
            </label>
            <input 
              required
              className="w-full p-3 bg-background border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="Ej: Madrid, ES"
              value={formData.origin}
              onChange={e => setFormData({ ...formData, origin: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-rose-500" /> Destino
            </label>
            <input 
              required
              className="w-full p-3 bg-background border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="Ej: Amalfi Coast, IT"
              value={formData.destination}
              onChange={e => setFormData({ ...formData, destination: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" /> Fecha Salida
            </label>
            <input 
              type="date"
              required
              className="w-full p-3 bg-background border rounded-xl outline-none"
              value={formData.outbound_date}
              onChange={e => setFormData({ ...formData, outbound_date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" /> Fecha Regreso
            </label>
            <input 
              type="date"
              required
              className="w-full p-3 bg-background border rounded-xl outline-none"
              value={formData.return_date}
              onChange={e => setFormData({ ...formData, return_date: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" /> Pasajeros
            </label>
            <select 
              className="w-full p-3 bg-background border rounded-xl outline-none"
              value={formData.num_passengers}
              onChange={e => setFormData({ ...formData, num_passengers: parseInt(e.target.value) })}
            >
              {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Persona' : 'Personas'}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-amber-500" /> Estilo de Viaje
            </label>
            <select 
              className="w-full p-3 bg-background border rounded-xl outline-none"
              value={formData.travel_style}
              onChange={e => setFormData({ ...formData, travel_style: e.target.value as any })}
            >
              <option value="relaxed">Relajado</option>
              <option value="active">Activo</option>
              <option value="mixed">Mixto</option>
              <option value="cultural">Cultural</option>
              <option value="adventure">Aventura</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-semibold">Intereses Específicos</label>
          <div className="flex flex-wrap gap-2">
            {availableInterests.map(interest => (
              <button
                key={interest}
                type="button"
                onClick={() => handleInterestChange(interest)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                  formData.interests?.includes(interest) 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20' 
                    : 'bg-background text-slate-500 border-slate-200 hover:border-indigo-400'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-sm font-medium">
            Error: {error}
          </div>
        )}

        <button 
          disabled={loading}
          type="submit"
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white rounded-xl font-bold text-lg shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Rocket className="h-5 w-5" />}
          {loading ? "Iniciando Misión..." : "Lanzar Agente de Viajes"}
        </button>
      </form>
    </div>
  )
}
