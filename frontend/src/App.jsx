import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plane, Hotel, Car, Navigation, Search, CheckCircle, 
  Loader2, Download, AlertCircle, MapPin, Calendar, 
  Users, Wallet, Globe, Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = "http://localhost:8000/api/v1";

function App() {
  const [loading, setLoading] = useState(false);
  const [missionId, setMissionId] = useState(null);
  const [missionData, setMissionData] = useState(null);
  const [error, setError] = useState(null);
  const [userResponse, setUserResponse] = useState("");
  const [isResuming, setIsResuming] = useState(false);
  
  const [formData, setFormData] = useState({
    query: "", // Free text
    destination: "Positano, Italia",
    origin: "Madrid",
    pax_adults: 6,
    check_in: "2026-06-03",
    check_out: "2026-06-10",
    budget: "Caro"
  });

  // Polling for status
  useEffect(() => {
    let interval;
    if (missionId && (!missionData || !['completed', 'failed', 'clarification_needed'].includes(missionData.status))) {
      interval = setInterval(async () => {
        try {
          const res = await axios.get(`${API_BASE}/mission/${missionId}`);
          setMissionData(res.data);
          if (res.data.status === 'clarification_needed') {
            clearInterval(interval);
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [missionId, missionData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMissionId(null);
    setMissionData(null);
    
    try {
      const res = await axios.post(`${API_BASE}/mission`, formData);
      setMissionId(res.data.mission_id);
    } catch (err) {
      setError(err.response?.data?.detail || "Error al iniciar la misión");
    } finally {
      setLoading(false);
    }
  };

  const handleClarificationSubmit = async (e) => {
    e.preventDefault();
    if (!userResponse.trim()) return;
    
    setIsResuming(true);
    try {
      await axios.post(`${API_BASE}/mission/${missionId}/message`, { text: userResponse });
      setUserResponse("");
      // Force status update to trigger polling again
      setMissionData(prev => ({ ...prev, status: 'pending' }));
    } catch (err) {
      setError("Error al enviar la respuesta.");
    } finally {
      setIsResuming(false);
    }
  };

  const getStatusIcon = (node) => {
    if (!missionData) return <Navigation className="opacity-20" />;
    if (missionData.nodes_executed?.includes(node)) return <CheckCircle className="text-emerald-400" />;
    if (missionData.current_node === node) return <Loader2 className="animate-spin text-accent" />;
    return <Navigation className="opacity-20" />;
  };

  return (
    <div className="min-h-screen w-full bg-[#030712] text-slate-100 p-4 md:p-8 relative overflow-hidden font-sans selection:bg-accent/30">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[150px] rounded-full animate-float" />

      <header className="max-w-7xl mx-auto mb-16 flex justify-between items-start pt-4">
        <div>
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-blue-400 font-bold tracking-[0.2em] mb-3 text-xs uppercase"
          >
            <Sparkles size={16} />
            AI Orchestration Engine v3.5
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
            Travel <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Maestro</span>
          </h1>
          <p className="mt-4 text-slate-400 font-medium max-w-md">Orquestación inteligente de viajes premium con sourcing real y validado.</p>
        </div>
        <div className="hidden lg:block">
           <div className="glass-effect p-4 rounded-2xl border border-white/5 backdrop-blur-3xl shadow-2xl">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">System Health</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <span className="text-xs font-bold text-emerald-400">Active Node Loop</span>
              </div>
           </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">
        {/* Left: Input Form */}
        <section className="lg:col-span-5 xl:col-span-4 space-y-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-effect rounded-[2.5rem] p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white/10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />
            
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <Search size={24} className="text-blue-400" />
              Planificar Viaje
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">Describe tu viaje (Opcional)</label>
                <textarea 
                  placeholder="Ej: Busco una villa de lujo en la Costa Amalfitana para mi familia de 6..."
                  value={formData.query} 
                  onChange={(e) => setFormData({...formData, query: e.target.value})}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 outline-none focus:border-blue-500/50 transition-all font-medium min-h-[100px] resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">Destino Principal</label>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-400 transition-colors" size={18} />
                  <input 
                    type="text" 
                    value={formData.destination} 
                    onChange={(e) => setFormData({...formData, destination: e.target.value})}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl pl-12 pr-5 py-4 outline-none focus:border-blue-500/50 transition-all font-bold placeholder:text-slate-700"
                    placeholder="Ciudad o País"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">Check-in</label>
                  <input 
                    type="date" 
                    value={formData.check_in} 
                    onChange={(e) => setFormData({...formData, check_in: e.target.value})}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 outline-none focus:border-blue-500/50 transition-all font-bold text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">Check-out</label>
                  <input 
                    type="date" 
                    value={formData.check_out} 
                    onChange={(e) => setFormData({...formData, check_out: e.target.value})}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 outline-none focus:border-blue-500/50 transition-all font-bold text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">Viajeros</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                    <input 
                      type="number" 
                      value={formData.pax_adults} 
                      onChange={(e) => setFormData({...formData, pax_adults: parseInt(e.target.value)})}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl pl-12 pr-5 py-4 outline-none focus:border-blue-500/50 transition-all font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">Estilo</label>
                  <select 
                    value={formData.budget} 
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 outline-none focus:border-blue-500/50 transition-all font-bold text-sm appearance-none cursor-pointer"
                  >
                    <option value="Barato">Económico</option>
                    <option value="Medio">Standard</option>
                    <option value="Caro">Premium / Lujo</option>
                  </select>
                </div>
              </div>

              <button 
                disabled={loading || (missionData && ['running', 'pending'].includes(missionData.status))}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black py-5 rounded-[1.5rem] shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-3 group mt-6 relative overflow-hidden active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : (
                  <>
                    <Search size={22} className="group-hover:scale-110 transition-transform" />
                    Iniciar Orquestación Real
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* Stepper Logic */}
          <div className="p-10 border border-white/5 rounded-[2.5rem] bg-black/30 backdrop-blur-md">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-8">Ciclo de Vida de la IA</h3>
            <div className="space-y-6">
              {[
                {id: 'planner', label: 'Estrategia'},
                {id: 'researcher', label: 'Contexto'},
                {id: 'flight_searcher', label: 'Logística Aérea'},
                {id: 'hotel_searcher', label: 'Sourcing Hoteles'},
                {id: 'orchestrator', label: 'Síntesis Final'}
              ].map((node) => (
                <div key={node.id} className="flex items-center gap-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${missionData?.current_node === node.id ? 'bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'bg-slate-900'}`}>
                    {getStatusIcon(node.id)}
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-sm font-bold tracking-tight ${missionData?.current_node === node.id ? 'text-white' : 'text-slate-500'}`}>
                      {node.label}
                    </span>
                    {missionData?.current_node === node.id && (
                      <span className="text-[9px] text-blue-400 font-black animate-pulse uppercase tracking-wider mt-0.5">En Proceso</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right: Results Board */}
        <section className="lg:col-span-7 xl:col-span-8">
          <AnimatePresence mode="wait">
            {!missionId ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full min-h-[600px] border border-white/5 bg-black/20 backdrop-blur-sm rounded-[3rem] flex flex-col items-center justify-center text-slate-700 gap-6 p-12 overflow-hidden relative"
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-blue-500/5 blur-[120px] rounded-full" />
                <div className="p-8 bg-slate-900/30 rounded-3xl border border-white/5 relative"><Plane size={64} className="text-slate-800" /></div>
                <div className="text-center relative">
                  <p className="font-black text-2xl tracking-tighter text-slate-800 uppercase mb-2">Sistema en Reposo</p>
                  <p className="text-sm font-medium text-slate-600 max-w-xs mx-auto">Prepare su solicitud de viaje premium para iniciar el sourcing automatizado v3.5</p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* INTERACTIVE CLARIFICATION AREA */}
                {missionData?.status === 'clarification_needed' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-blue-600/10 border-2 border-blue-500/30 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group"
                  >
                    <div className="absolute top-0 left-0 w-2 h-full bg-blue-500" />
                    <div className="flex gap-6 items-start">
                      <div className="p-4 bg-blue-500 rounded-2xl shadow-xl shadow-blue-500/20 shrink-0">
                        <Sparkles className="text-white" size={28} />
                      </div>
                      <div className="space-y-6 flex-1">
                        <div>
                          <h3 className="text-xl font-bold text-blue-400 mb-2">El Agente necesita más detalles</h3>
                          <p className="text-lg font-medium text-white leading-relaxed">
                            "{missionData.clarification_message}"
                          </p>
                        </div>
                        
                        <form onSubmit={handleClarificationSubmit} className="relative">
                          <input 
                            type="text"
                            autoFocus
                            placeholder="Responde aquí..."
                            value={userResponse}
                            onChange={(e) => setUserResponse(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-5 pr-16 outline-none focus:border-blue-400 transition-all font-bold text-white shadow-2xl"
                          />
                          <button 
                            disabled={isResuming}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-blue-500 hover:bg-blue-400 text-white rounded-xl transition-all active:scale-95 disabled:opacity-50"
                          >
                           {isResuming ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
                          </button>
                        </form>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Header Status */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900/30 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-xl gap-6">
                  <div className="flex gap-6 items-center">
                    <div className="relative">
                      <div className={`w-4 h-4 rounded-full ${missionData?.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'} animate-ping absolute top-0 left-0`}></div>
                      <div className={`w-4 h-4 rounded-full ${missionData?.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'} relative`}></div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Misión • <span className="text-slate-400">{missionId.substring(0, 8)}</span></p>
                      <h4 className="font-black text-2xl tracking-tighter uppercase">
                        {missionData?.status === 'completed' ? 'Sourcing Completado' : 
                         missionData?.status === 'clarification_needed' ? 'Esperando Respuesta' : 
                         'Sintetizando Propuesta...'}
                      </h4>
                    </div>
                  </div>
                  {missionData?.pdf_url && (
                    <a 
                      href={`http://localhost:8000${missionData.pdf_url}`} 
                      target="_blank" 
                      className="w-full md:w-auto bg-white text-slate-950 px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-blue-400 hover:text-white transition-all shadow-[0_20px_40px_-5px_rgba(255,255,255,0.1)] active:scale-95"
                    >
                      <Download size={20} />
                      DESCARGAR INFORME REAL
                    </a>
                  )}
                </div>

                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/20 p-8 rounded-[2rem] flex items-center gap-6 text-rose-400">
                    <div className="p-3 bg-rose-500/20 rounded-xl"><AlertCircle /></div>
                    <p className="font-bold tracking-tight">{error}</p>
                  </div>
                )}

                {missionData?.proposal && (
                  <div className="space-y-10">
                    {/* Summary Row */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      className="glass-effect p-12 rounded-[3rem] border border-white/5 relative overflow-hidden group shadow-2xl"
                    >
                      <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 blur-[80px] rounded-full group-hover:bg-blue-500/20 transition-all duration-700" />
                      <h3 className="text-2xl font-black mb-8 flex items-center gap-4 text-white tracking-tighter uppercase relative z-10">
                        <span className="p-3 bg-white/5 rounded-2xl"><Sparkles size={24} className="text-blue-400" /></span>
                        Visión Ejecutiva
                      </h3>
                      <div className="prose prose-invert text-slate-300 leading-[1.8] max-w-none text-lg relative z-10 font-medium" 
                           dangerouslySetInnerHTML={{ __html: missionData.proposal.expert_itinerary_summary.replace(/\n/g, '<br>') }}>
                      </div>
                    </motion.div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {[
                        { label: 'Vuelos Disp.', value: missionData.proposal.flights.length, icon: Plane, color: 'text-blue-400' },
                        { label: 'Sourcing Hoteles', value: missionData.proposal.accommodations.length, icon: Hotel, color: 'text-emerald-400' },
                        { label: 'Logística Local', value: missionData.proposal.transports.length, icon: Car, color: 'text-purple-400' },
                        { label: 'Inversión Est.', value: `${missionData.proposal.total_estimated_price.toLocaleString()}€`, icon: Wallet, color: 'text-white', primary: true }
                      ].map((stat, idx) => (
                        <div key={idx} className={`p-8 rounded-[2rem] border transition-all ${stat.primary ? 'bg-white text-slate-950 border-white shadow-2xl' : 'bg-slate-900/30 border-white/5 hover:border-white/10'}`}>
                          <stat.icon size={20} className={`${stat.primary ? 'text-slate-950/40' : stat.color} mb-4`} />
                          <p className="text-3xl font-black tracking-tighter mb-1">{stat.value}</p>
                          <p className={`text-[10px] font-black uppercase tracking-widest ${stat.primary ? 'opacity-40' : 'text-slate-500'}`}>{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Flight List */}
                    {missionData.proposal.flights.length > 0 && (
                      <div className="space-y-6">
                        <div className="flex items-center gap-4 px-4">
                          <h4 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Conexiones Aéreas</h4>
                          <div className="h-[1px] bg-white/5 flex-1" />
                        </div>
                        {missionData.proposal.flights.map((f, i) => (
                          <motion.div 
                            key={i} 
                            whileHover={{ scale: 1.01, x: 5 }}
                            className="flex flex-col md:flex-row justify-between md:items-center p-8 bg-black/40 border border-white/5 rounded-[2rem] hover:border-blue-500/30 transition-all gap-8"
                          >
                            <div className="flex gap-6 items-center">
                              <div className="p-5 bg-slate-900 rounded-2xl"><Plane size={32} className="text-blue-400" /></div>
                              <div>
                                <p className="font-black text-2xl tracking-tighter uppercase mb-1">{f.origin} <span className="text-slate-600 font-light mx-2">➔</span> {f.destination}</p>
                                <div className="flex gap-3 text-xs font-bold text-slate-500 tracking-wide uppercase">
                                  <span>{f.carrier}</span>
                                  <span className="opacity-20">|</span>
                                  <span>{f.flight_number}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-4">
                              <p className="text-4xl font-black tracking-tighter text-white">{f.price}€</p>
                              <a href={f.url} target="_blank" className="bg-blue-500/10 text-blue-400 px-5 py-2 rounded-xl text-xs font-black tracking-widest uppercase hover:bg-blue-500 hover:text-white transition-all active:scale-95">RESERVAR AHORA</a>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      <footer className="max-w-7xl mx-auto mt-32 py-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 px-4">
        <div className="flex flex-col gap-2 text-center md:text-left">
          <div className="font-black text-xl tracking-tighter uppercase text-white">Travel <span className="text-blue-400">Maestro</span></div>
          <div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase italic">The Ultimate Agentic Sourcing Machine</div>
        </div>
        <div className="flex gap-10">
          <div className="flex flex-col gap-3">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Connect</span>
             <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/10 cursor-pointer transition-all"><Globe size={18}/></div>
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/10 cursor-pointer transition-all"><MapPin size={18}/></div>
             </div>
          </div>
          <div className="flex flex-col gap-3">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System</span>
             <div className="flex items-center gap-3">
                <span className="flex items-center gap-2 text-xs font-bold text-emerald-400"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
                <span className="flex items-center gap-2 text-xs font-bold text-slate-400 h-8 px-4 bg-white/5 rounded-lg border border-white/10 uppercase tracking-widest">v3.5 Final</span>
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


export default App;
