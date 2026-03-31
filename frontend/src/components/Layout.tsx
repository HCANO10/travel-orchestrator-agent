import React, { useState } from "react"
import { Link, Outlet, useNavigate } from "react-router-dom"
import { Plane, Menu, X, Rocket } from "lucide-react"

export const Layout: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-slate-900 text-white backdrop-blur supports-[backdrop-filter]:bg-slate-900/95">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Plane className="h-6 w-6 text-indigo-400" />
            <span className="text-xl font-bold tracking-tight">TravelPro</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link to="/planner" className="hover:text-indigo-400 transition-colors">
              Nueva Misión
            </Link>
            <button 
              onClick={() => navigate("/planner")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-semibold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
            >
              <Rocket className="h-4 w-4" />
              Comenzar
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900 p-4 space-y-4">
            <Link 
              to="/planner" 
              className="block text-lg font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Nueva Misión
            </Link>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by TravelPro Agent v4.0. Respaldo por Groq Llama-3.3.
          </p>
        </div>
      </footer>
    </div>
  )
}
