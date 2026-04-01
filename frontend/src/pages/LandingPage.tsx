import React from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Rocket, Search, Bot, Calendar, Sparkles, MapPin,
  ShieldCheck, TrendingUp, ArrowRight, Plane, CheckCircle2,
  Star, Users, Zap, Globe
} from "lucide-react"

const STATS = [
  { value: "12K+", label: "Viajeros satisfechos" },
  { value: "48",   label: "Destinos disponibles" },
  { value: "4.9★", label: "Valoración media" },
  { value: "< 2m", label: "Plan listo en" },
]

const FEATURES = [
  {
    icon: Search,
    title: "Búsqueda en Tiempo Real",
    description: "Datos de vuelos y hoteles de plataformas líderes. Sin cachés obsoletas, siempre el precio actual.",
    featured: false,
  },
  {
    icon: Bot,
    title: "Inteligencia Adaptativa",
    description: "Nuestra IA no solo reserva, entiende. Analiza miles de variables para sugerir experiencias que encajan con tu ADN viajero.",
    featured: true,
  },
  {
    icon: Calendar,
    title: "Itinerarios Dinámicos",
    description: "Planes diarios optimizados por logística, clima y eventos locales. Deja que nosotros resolvamos la complejidad.",
    featured: false,
  },
]

const STEPS = [
  {
    number: "01",
    title: "Define tu viaje",
    description: "Indica destino, fechas, viajeros y estilo. Nuestro formulario inteligente capta todo en segundos.",
    icon: MapPin,
    color: "bg-violet-50 text-violet-600",
  },
  {
    number: "02",
    title: "El agente orquesta",
    description: "Llama-3.3 analiza opciones en tiempo real: vuelos, hoteles y actividades curadas para ti.",
    icon: Zap,
    color: "bg-fuchsia-50 text-fuchsia-600",
  },
  {
    number: "03",
    title: "Viaja sin preocupaciones",
    description: "Recibe un itinerario completo, listo para reservar, con links directos a cada plataforma.",
    icon: Plane,
    color: "bg-teal-50 text-teal-600",
  },
]

const TRUST_ITEMS = [
  { icon: ShieldCheck, label: "100% Seguro",   color: "text-emerald-500 bg-emerald-50" },
  { icon: Globe,       label: "Global",         color: "text-blue-500 bg-blue-50" },
  { icon: TrendingUp,  label: "Mejor Precio",   color: "text-amber-500 bg-amber-50" },
  { icon: Star,        label: "Premium",         color: "text-violet-500 bg-violet-50" },
]

const FOOTER_LINKS = {
  Producto:  ["Planificador", "Mis Viajes", "Precios", "API"],
  Empresa:   ["About", "Blog", "Careers", "Press"],
  Recursos:  ["Docs", "Ayuda", "Status", "Changelog"],
  Legal:     ["Privacidad", "Términos", "Cookies"],
}

export const LandingPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col bg-white overflow-hidden">

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center justify-center px-4 py-24 overflow-hidden bg-[#1E1B4B]">
        {/* Orbs */}
        <div className="absolute top-[-120px] left-[-80px] w-[600px] h-[600px] rounded-full bg-violet-700/30 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-160px] right-[-100px] w-[500px] h-[500px] rounded-full bg-fuchsia-700/20 blur-[140px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/10 border border-white/20 text-violet-200 text-xs font-black tracking-[0.2em] uppercase"
          >
            <Sparkles className="h-3.5 w-3.5 text-fuchsia-300" />
            Impulsado por Llama-3.3 · Groq · Claude
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tighter text-white leading-[0.9]"
          >
            El viaje de tu vida,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400">
              orquestado por IA
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/70 text-lg md:text-2xl max-w-3xl mx-auto leading-relaxed font-medium"
          >
            Vuelos reales, hoteles curados e itinerarios hiper-personalizados.
            Todo en menos de 2 minutos.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4"
          >
            <button
              onClick={() => navigate("/planner")}
              className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white rounded-3xl font-black text-xl flex items-center justify-center gap-3 transition-all shadow-2xl shadow-violet-900/50 group"
            >
              <Rocket className="h-6 w-6 group-hover:-translate-y-0.5 transition-transform" />
              Empezar Gratis
            </button>
            <button
              onClick={() => navigate("/planner")}
              className="w-full sm:w-auto px-10 py-5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-3xl font-black text-xl transition-all flex items-center justify-center gap-2"
            >
              Ver Demo
            </button>
          </motion.div>

          {/* Mini trust row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-6 pt-6"
          >
            {["Sin tarjeta de crédito", "Setup en 30 segundos", "Cancela cuando quieras"].map(t => (
              <span key={t} className="flex items-center gap-1.5 text-white/50 text-xs font-bold">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> {t}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30">
          <span className="text-[9px] font-black uppercase tracking-[0.3em]">Scroll</span>
          <div className="w-[2px] h-10 bg-gradient-to-b from-white/30 to-transparent rounded-full" />
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 py-10 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center text-white">
              <p className="text-4xl font-black tracking-tight">{s.value}</p>
              <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────── */}
      <section className="py-32 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <p className="text-xs font-black text-violet-600 uppercase tracking-[0.3em]">Por qué TravelPro</p>
            <h2 className="text-5xl font-black tracking-tight text-slate-900">
              Todo lo que necesitas,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-500">nada que no necesites</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`p-10 rounded-[2.5rem] flex flex-col gap-6 h-full ${
                  f.featured
                    ? "bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-2xl shadow-violet-200"
                    : "bg-white border border-slate-100 shadow-xl shadow-slate-200/40"
                }`}
              >
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${
                  f.featured ? "bg-white/20" : "bg-violet-50"
                }`}>
                  <f.icon className={`h-7 w-7 ${f.featured ? "text-white" : "text-violet-600"}`} />
                </div>
                <div className="space-y-3">
                  <h3 className={`text-2xl font-black tracking-tight ${f.featured ? "text-white" : "text-slate-900"}`}>
                    {f.title}
                  </h3>
                  <p className={`text-sm leading-relaxed font-medium ${f.featured ? "text-white/80" : "text-slate-500"}`}>
                    {f.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="py-32 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <p className="text-xs font-black text-fuchsia-500 uppercase tracking-[0.3em]">Cómo funciona</p>
            <h2 className="text-5xl font-black tracking-tight text-slate-900">
              De la idea al itinerario<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-500">en 3 pasos</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-16 left-[calc(16.66%+2rem)] right-[calc(16.66%+2rem)] h-[2px] bg-gradient-to-r from-violet-200 via-fuchsia-200 to-violet-200" />

            {STEPS.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="flex flex-col items-center text-center gap-6"
              >
                <div className={`relative h-16 w-16 rounded-2xl flex items-center justify-center shadow-xl ${step.color}`}>
                  <step.icon className="h-8 w-8" />
                  <span className="absolute -top-2.5 -right-2.5 h-6 w-6 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-black text-slate-900">{step.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium max-w-xs mx-auto">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST GRID + CTA INLINE ───────────────────────────────────── */}
      <section className="py-24 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
              <Sparkles className="h-52 w-52 text-violet-500" />
            </div>

            <div className="max-w-xl space-y-6 relative z-10">
              <div className="flex items-center gap-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-amber-400 fill-amber-400" />
                ))}
                <span className="text-slate-400 text-sm font-bold ml-1">4.9 de 12.000+ reseñas</span>
              </div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                La experiencia del{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-500 underline decoration-violet-200 underline-offset-8">
                  futuro
                </span>{" "}
                ya está aquí.
              </h2>
              <p className="text-slate-500 text-lg font-medium">
                Únete a miles de viajeros que han dejado de buscar para empezar a viajar. TravelPro es el orquestador final.
              </p>
              <button
                onClick={() => navigate("/planner")}
                className="inline-flex items-center gap-3 text-violet-600 font-black uppercase tracking-widest text-sm bg-violet-50 px-8 py-3 rounded-2xl hover:bg-violet-100 transition-all border border-violet-100 group"
              >
                Empezar Ahora <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
              {TRUST_ITEMS.map((item) => (
                <div
                  key={item.label}
                  className={`p-6 ${item.color.split(" ")[1]} rounded-3xl flex flex-col items-center justify-center gap-3 ring-1 ring-slate-100 hover:scale-105 transition-transform`}
                >
                  <item.icon className={`h-8 w-8 ${item.color.split(" ")[0]}`} />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────── */}
      <section className="py-36 px-4 bg-[#0F0524] relative overflow-hidden">
        <div className="absolute top-[-200px] right-[-100px] w-[700px] h-[700px] rounded-full bg-violet-700/20 blur-[160px] pointer-events-none" />
        <div className="absolute bottom-[-200px] left-[-100px] w-[500px] h-[500px] rounded-full bg-fuchsia-700/15 blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-10 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-violet-900/50">
              <Rocket className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-6xl md:text-7xl font-black tracking-tighter text-white leading-[0.9] mb-6">
              El viaje de tu vida<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                empieza aquí
              </span>
            </h2>
            <p className="text-white/60 text-xl font-medium max-w-2xl mx-auto mb-10">
              Más de 12.000 viajeros ya confían en TravelPro. Es tu turno.
            </p>
            <button
              onClick={() => navigate("/planner")}
              className="px-14 py-6 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white rounded-3xl font-black text-2xl shadow-2xl shadow-violet-900/50 transition-all hover:scale-105"
            >
              Lanzar mi misión
            </button>
            <p className="text-white/30 text-xs font-bold mt-6 uppercase tracking-widest">
              Sin tarjeta · Resultados en &lt; 2 minutos
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="bg-[#0F0524] border-t border-white/10 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-10 mb-16">
            {/* Brand col */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500">
                  <Plane className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-black text-white">TravelPro</span>
              </div>
              <p className="text-white/40 text-sm font-medium leading-relaxed max-w-xs">
                Orquestando experiencias únicas con inteligencia artificial desde 2026.
              </p>
              <div className="flex gap-3">
                {["Llama-3.3", "Groq", "LangGraph"].map(t => (
                  <span key={t} className="text-[10px] text-white/30 border border-white/10 rounded-full px-3 py-1 font-bold">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Nav cols */}
            {Object.entries(FOOTER_LINKS).map(([section, links]) => (
              <div key={section} className="space-y-4">
                <h4 className="text-white font-black text-sm uppercase tracking-widest">{section}</h4>
                <ul className="space-y-2.5">
                  {links.map(link => (
                    <li key={link}>
                      <span className="text-white/40 text-sm font-medium hover:text-white/70 cursor-pointer transition-colors">
                        {link}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Copyright bar */}
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/30 text-xs font-medium">
              © 2026 TravelPro Orchestrator · Potenciado por{" "}
              <span className="text-violet-400 font-bold">Llama-3.3 & Claude</span>
            </p>
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-white/20" />
              <span className="text-white/20 text-xs font-bold">12.000+ viajeros activos</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
