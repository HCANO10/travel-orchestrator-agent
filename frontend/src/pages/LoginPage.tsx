import React, { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { Plane, Eye, EyeOff, Loader2, ArrowRight, MapPin, Zap, Globe } from "lucide-react"

type Tab = "login" | "register"

export function LoginPage() {
  const [tab, setTab] = useState<Tab>("login")
  const { user, signIn, signUp, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from?.pathname ?? "/planner"

  // Login state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [showLoginPwd, setShowLoginPwd] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)

  // Register state
  const [fullName, setFullName] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [regPasswordConfirm, setRegPasswordConfirm] = useState("")
  const [showRegPwd, setShowRegPwd] = useState(false)
  const [showRegConfirm, setShowRegConfirm] = useState(false)
  const [regLoading, setRegLoading] = useState(false)
  const [regSuccess, setRegSuccess] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    if (user) navigate(from, { replace: true })
  }, [user, navigate, from])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoginLoading(true)
    const { error } = await signIn(loginEmail, loginPassword)
    if (error) {
      setError("Credenciales incorrectas. Verifica tu email y contraseña.")
    }
    setLoginLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!fullName || !regEmail || !regPassword) {
      setError("Rellena todos los campos obligatorios.")
      return
    }
    if (regPassword !== regPasswordConfirm) {
      setError("Las contraseñas no coinciden.")
      return
    }
    if (regPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.")
      return
    }
    setRegLoading(true)
    const { error } = await signUp(regEmail, regPassword, fullName)
    if (error) {
      setError(error)
    } else {
      setRegSuccess(true)
    }
    setRegLoading(false)
  }

  const handleGoogle = async () => {
    setError(null)
    setGoogleLoading(true)
    const { error } = await signInWithGoogle()
    if (error) {
      setError("Google no disponible. Usa email y contraseña.")
      setGoogleLoading(false)
    }
    // On success, browser redirects to /auth/callback
  }

  const inputCls =
    "w-full h-12 rounded-xl bg-slate-50 border border-slate-200 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"

  return (
    <div className="flex min-h-screen w-full">
      {/* Left: Form */}
      <div className="flex flex-col flex-1 justify-center px-6 py-12 lg:px-20 xl:px-28 bg-white">
        <div className="mx-auto w-full max-w-[420px]">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2.5 rounded-xl vivid-gradient text-white shadow-lg shadow-violet-200">
              <Plane className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                TravelPro
              </h1>
              <p className="text-[12px] text-slate-500">AI Travel Orchestrator</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-8">
            {(["login", "register"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); setRegSuccess(false) }}
                className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                  tab === t
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t === "login" ? "Acceder" : "Registro"}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* LOGIN */}
          {tab === "login" && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Bienvenido de vuelta</h2>
                <p className="text-sm text-slate-500 mt-1">Accede a tu cuenta para planificar tu próximo viaje</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-slate-700">Correo electrónico</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className={inputCls}
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-slate-700">Contraseña</label>
                  <div className="relative">
                    <input
                      type={showLoginPwd ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`${inputCls} pr-11`}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPwd(!showLoginPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showLoginPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full h-12 vivid-gradient vivid-gradient-hover text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loginLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <><span>Acceder</span><ArrowRight className="h-4 w-4" /></>
                  )}
                </button>
              </form>

              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[12px] text-slate-400 font-medium">o continúa con</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                disabled={googleLoading}
                className="w-full h-11 flex items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {googleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
                      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
                      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 2.58 9 2.58Z" fill="#EA4335"/>
                    </svg>
                    Continuar con Google
                  </>
                )}
              </button>
            </>
          )}

          {/* REGISTER */}
          {tab === "register" && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Crear cuenta</h2>
                <p className="text-sm text-slate-500 mt-1">Regístrate gratis y empieza a planificar</p>
              </div>

              {regSuccess ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center space-y-2">
                  <div className="text-3xl">✈️</div>
                  <p className="text-sm font-bold text-green-800">Cuenta creada con éxito</p>
                  <p className="text-[13px] text-green-700">
                    Revisa tu email para confirmar tu cuenta y luego inicia sesión.
                  </p>
                  <button
                    onClick={() => { setTab("login"); setRegSuccess(false); setLoginEmail(regEmail) }}
                    className="mt-2 text-sm text-violet-600 font-semibold hover:underline"
                  >
                    Ir a iniciar sesión →
                  </button>
                </div>
              ) : (
                <>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-slate-700">Nombre completo</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="María García"
                        className={inputCls}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-slate-700">Correo electrónico</label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className={inputCls}
                        autoComplete="email"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-slate-700">Contraseña</label>
                      <div className="relative">
                        <input
                          type={showRegPwd ? "text" : "password"}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className={`${inputCls} pr-11`}
                          autoComplete="new-password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPwd(!showRegPwd)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showRegPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-slate-700">Confirmar contraseña</label>
                      <div className="relative">
                        <input
                          type={showRegConfirm ? "text" : "password"}
                          value={regPasswordConfirm}
                          onChange={(e) => setRegPasswordConfirm(e.target.value)}
                          placeholder="••••••••"
                          className={`${inputCls} pr-11`}
                          autoComplete="new-password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegConfirm(!showRegConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showRegConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={regLoading}
                      className="w-full h-12 vivid-gradient vivid-gradient-hover text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {regLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Crear cuenta"}
                    </button>
                  </form>

                  <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-[12px] text-slate-400 font-medium">o regístrate con</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogle}
                    disabled={googleLoading}
                    className="w-full h-11 flex items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {googleLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
                          <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
                          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 2.58 9 2.58Z" fill="#EA4335"/>
                        </svg>
                        Continuar con Google
                      </>
                    )}
                  </button>
                </>
              )}
            </>
          )}

          <p className="mt-8 text-center text-xs text-slate-400">
            © 2026 TravelPro · Potenciado por IA
          </p>
        </div>
      </div>

      {/* Right: Visual panel */}
      <div className="hidden lg:flex lg:w-[520px] relative overflow-hidden bg-[#0F0524]">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/50 via-fuchsia-900/30 to-[#0F0524]" />
        <div className="absolute top-20 right-10 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-48 h-48 bg-fuchsia-600/20 rounded-full blur-3xl" />

        <div className="relative z-10 w-full h-full flex flex-col justify-end p-12">
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-[32px] font-extrabold text-white leading-tight tracking-tight">
                Planifica tu viaje
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">
                  con inteligencia artificial
                </span>
              </h3>
              <p className="text-[15px] text-slate-400 leading-relaxed max-w-[360px]">
                Describe tu viaje ideal y nuestro orquestador de agentes IA encontrará
                los mejores vuelos, hoteles e itinerarios personalizados.
              </p>
            </div>

            <div className="flex gap-8">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-violet-500/20 mt-0.5">
                  <Zap className="h-3.5 w-3.5 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Segundos</p>
                  <p className="text-xs text-slate-500 mt-0.5">Planificación IA</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-fuchsia-500/20 mt-0.5">
                  <Globe className="h-3.5 w-3.5 text-fuchsia-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">200+</p>
                  <p className="text-xs text-slate-500 mt-0.5">Destinos</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 mt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">100%</p>
                  <p className="text-xs text-slate-500 mt-0.5">Personalizado</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
