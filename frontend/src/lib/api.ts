import { MissionState, TravelProposalSummary, TravelRequestDTO } from "./types"

const API_BASE = import.meta.env.VITE_API_URL || "/api/v1/travel"

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = "ApiError"
  }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const detail = errorData.detail || "Error en la petición API"
    const message = response.status === 404
      ? "Esta misión ya no existe en el servidor (el servidor se reinició). Crea una nueva misión."
      : detail
    throw new ApiError(response.status, message)
  }

  return response.json()
}

export const api = {
  /** Crea una nueva misión y devuelve el mission_id */
  async createMission(request: TravelRequestDTO, userId?: string): Promise<{ mission_id: string; status: string }> {
    const prompt = `Planifica un viaje desde ${request.origin} a ${request.destination} del ${request.outbound_date} al ${request.return_date} para ${request.num_passengers} personas. Estilo: ${request.travel_style}. Intereses: ${request.interests.join(", ")}.`
    const user_id = userId ?? `anon_${Date.now()}`
    const data = await apiFetch<{ mission_id: string; status: string; message: string }>("/plan", {
      method: "POST",
      body: JSON.stringify({ user_id, prompt }),
    })
    return { mission_id: data.mission_id, status: data.status }
  },

  /** Obtiene el estado completo de una misión */
  async getMission(id: string): Promise<MissionState> {
    const data = await apiFetch<{ state: MissionState; progress_percent: number }>(`/mission/${id}`)
    return data.state
  },

  /** Obtiene el resumen final de una misión completada */
  async getMissionSummary(id: string): Promise<TravelProposalSummary> {
    return apiFetch(`/mission/${id}/summary`)
  },

  /** Envía respuestas a preguntas de aclaración */
  async answerClarification(id: string, answers: Record<string, any>): Promise<{ status: string }> {
    return apiFetch(`/mission/${id}/answer`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    })
  },
}
