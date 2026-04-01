import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { Loader2 } from "lucide-react"

export function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/planner", { replace: true })
      } else {
        navigate("/login?error=auth", { replace: true })
      }
    })
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600 mx-auto" />
        <p className="text-sm text-slate-500">Verificando sesión...</p>
      </div>
    </div>
  )
}
