import { MissionState, TravelProposalSummary, TravelRequestDTO } from "./types"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = "ApiError"
  }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new ApiError(response.status, errorData.detail || "Error en la petición API")
  }

  return response.json()
}

export const api = {
  async createMission(request: TravelRequestDTO): Promise<{ mission_id: string; status: string }> {
    return apiFetch("/mission", {
      method: "POST",
      body: JSON.stringify(request),
    })
  },

  async getMission(id: string): Promise<MissionState> {
    const data = await apiFetch<{ state: MissionState; progress_percent: number }>(`/mission/${id}`)
    return data.state
  },

  async getMissionSummary(id: string): Promise<TravelProposalSummary> {
    return apiFetch(`/mission/${id}/summary`)
  },

  async answerClarification(id: string, answers: Record<string, any>): Promise<MissionState> {
    return apiFetch(`/mission/${id}/answer`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    })
  },
}
