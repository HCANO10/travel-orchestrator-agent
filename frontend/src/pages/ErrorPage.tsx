import React from "react"
import { Link, useRouteError } from "react-router-dom"
import { AlertCircle, Home, ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"

export const ErrorPage: React.FC = () => {
  const routeError = useRouteError() as { status?: number; statusText?: string; message?: string } | null

  const is404 = routeError?.status === 404
  const title = is404 ? "Página no encontrada" : "Error inesperado"
  const description = is404
    ? "La página que buscas no existe o ha sido movida."
    : routeError?.message || routeError?.statusText || "Ha ocurrido un error inesperado. Intenta de nuevo."

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full text-center space-y-8"
      >
        <div className="inline-flex h-24 w-24 rounded-full bg-rose-50 items-center justify-center mx-auto">
          <AlertCircle className="h-12 w-12 text-rose-500" />
        </div>

        <div className="space-y-3">
          <p className="text-xs font-black text-rose-400 uppercase tracking-[0.3em]">
            {is404 ? "Error 404" : "Error"}
          </p>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">{title}</h1>
          <p className="text-slate-500 text-lg font-medium max-w-sm mx-auto leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <Link
            to="/"
            className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-black rounded-2xl shadow-xl shadow-violet-200 transition-all hover:scale-105"
          >
            <Home className="h-4 w-4" /> Ir al inicio
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
