import React, { useState } from "react"
import { Link, Outlet, useNavigate } from "react-router-dom"
import { Plane, Menu, X, Rocket, LogOut, User } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"

export const Layout: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    navigate("/login")
  }

  const userInitial = user?.user_metadata?.full_name?.[0]
    ?? user?.email?.[0]?.toUpperCase()
    ?? "U"

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Navbar */}
      <header className="nav-glass">
        <div className="container mx-auto px-4 flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="p-2 rounded-xl vivid-gradient text-white shadow-lg shadow-violet-200 group-hover:scale-110 transition-transform">
              <Plane className="h-5 w-5" />
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
              TravelPro
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold">
            <Link to="/planner" className="text-slate-600 hover:text-violet-600 transition-colors">
              Explorar
            </Link>
            <Link to="/my-trips" className="text-slate-600 hover:text-violet-600 transition-colors">
              Mis Viajes
            </Link>
            <button
              onClick={() => navigate("/planner")}
              className="vivid-gradient vivid-gradient-hover text-white px-6 py-2.5 rounded-xl font-bold shadow-xl shadow-violet-200 flex items-center gap-2 text-sm"
            >
              <Rocket className="h-4 w-4" />
              Nueva Misión
            </button>
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full vivid-gradient flex items-center justify-center text-white text-xs font-bold">
                  {userInitial}
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-slate-600 hover:text-violet-600 transition-colors"
              >
                <User className="h-4 w-4" />
                Entrar
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-slate-600"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-lg p-6 space-y-4 shadow-2xl">
            <Link
              to="/planner"
              className="block text-lg font-bold text-slate-900"
              onClick={() => setIsMenuOpen(false)}
            >
              Explorar Destinos
            </Link>
            <Link
              to="/my-trips"
              className="block text-lg font-bold text-slate-900"
              onClick={() => setIsMenuOpen(false)}
            >
              Mis Viajes
            </Link>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-12">
        <div className="container mx-auto px-4 flex flex-col items-center justify-between gap-6 md:flex-row">
          <p className="text-sm font-medium text-slate-500">
            © 2026 TravelPro Orchestrator. Potenciado por <span className="text-violet-600 font-bold">Llama-3.3</span>.
          </p>
        </div>
      </footer>
    </div>
  )

}
