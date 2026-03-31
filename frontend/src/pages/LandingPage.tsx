import React from "react"
import { useNavigate } from "react-router-dom"
import { Rocket, Search, Bot, Calendar, Sparkles, MapPin, ShieldCheck, TrendingUp } from "lucide-react"

const FeatureCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <div className="glass p-6 rounded-xl flex flex-col gap-4 text-white hover:scale-105 transition-transform duration-300">
    <div className="h-12 w-12 rounded-lg bg-indigo-500/20 flex items-center justify-center">
      <Icon className="h-6 w-6 text-indigo-400" />
    </div>
    <h3 className="text-xl font-semibold">{title}</h3>
    <p className="text-slate-400 text-sm">{description}</p>
  </div>
)

export const LandingPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden bg-slate-950">
        {/* Background Gradients */}
        <div className="absolute inset-x-0 top-0 h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(67,56,202,0.15),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.1),transparent_50%)]" />
        
        <div className="container relative z-10 text-center px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-8">
            <Sparkles className="h-3 w-3" />
            <span>IMPULSADO POR LLAMA 3.3 Y GROQ</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-white mb-6 drop-shadow-2xl">
            Tu agencia de viajes <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 animate-gradient">
              totalmente autónoma
            </span>
          </h1>
          
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Vuelos reales, hoteles verificados e itinerarios hiper-personalizados en segundos. Olvida la planificación tediosa, deja que TravelPro lo haga por ti.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate("/planner")}
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-600/20 group"
            >
              Empezar planificación gratuita
              <Rocket className="h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
            <button 
              className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-bold text-lg transition-all"
            >
              Ver demostración
            </button>
          </div>
        </div>

        {/* Floating elements animation placeholder */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500 animate-bounce">
          <span className="text-xs font-medium uppercase tracking-widest">Explorar más</span>
          <div className="w-1 h-8 bg-gradient-to-b from-indigo-500 to-transparent rounded-full" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-950 border-t border-white/5">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Experiencia Premium de Viaje</h2>
            <div className="h-1 w-20 bg-indigo-500 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Search}
              title="Búsqueda en Tiempo Real"
              description="Acceso directo a datos de vuelos y hoteles de plataformas líderes. Sin datos estáticos, siempre actualizado."
            />
            <FeatureCard 
              icon={Bot}
              title="Inteligencia Adaptativa"
              description="Nuestra IA analiza tus preferencias para sugerir destinos y actividades que encajan con tu estilo de vida."
            />
            <FeatureCard 
              icon={Calendar}
              title="Itinerarios Dinámicos"
              description="Planes diarios optimizados por ubicación, clima y horarios de apertura. Logística resuelta."
            />
          </div>

          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
            <div className="flex items-center justify-center gap-2 text-white/60">
              <ShieldCheck className="h-5 w-5" />
              <span className="font-semibold text-sm">Reservas Seguras</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-white/60">
              <MapPin className="h-5 w-5" />
              <span className="font-semibold text-sm">Destinos Globales</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-white/60">
              <TrendingUp className="h-5 w-5" />
              <span className="font-semibold text-sm">Precios Competitivos</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-white/60">
              <Sparkles className="h-5 w-5" />
              <span className="font-semibold text-sm">Experiencia Única</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
