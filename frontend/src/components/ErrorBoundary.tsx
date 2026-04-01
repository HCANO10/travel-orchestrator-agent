import React from "react"

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-xl border border-slate-100 text-center space-y-6">
            <div className="h-16 w-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900">Algo salió mal</h2>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              {this.state.error?.message || "Error inesperado en la aplicación."}
            </p>
            <button
              onClick={() => window.location.href = "/"}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-black rounded-2xl"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
