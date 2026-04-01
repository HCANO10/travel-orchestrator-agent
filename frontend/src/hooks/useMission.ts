import { useState, useEffect, useCallback, useRef } from "react"
import { api } from "../lib/api"
import { MissionState, TravelProposalSummary, TravelRequestDTO } from "../lib/types"

export function useMission(missionId?: string) {
  const [mission, setMission] = useState<MissionState | null>(null)
  const [summary, setSummary] = useState<TravelProposalSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const refreshMission = useCallback(async (id: string) => {
    try {
      const state = await api.getMission(id)
      setMission(state)
      
      if (state.status === "done") {
        const summaryData = await api.getMissionSummary(id)
        setSummary(summaryData)
      }
    } catch (err: any) {
      setError(err.message)
    }
  }, [])

  const startMission = async (request: TravelRequestDTO) => {
    setLoading(true)
    setError(null)
    try {
      const { mission_id } = await api.createMission(request)
      // Persist mission_id in localStorage for /my-trips history
      const raw = localStorage.getItem("travelPro_missions")
      const ids: string[] = raw ? JSON.parse(raw) : []
      if (!ids.includes(mission_id)) {
        ids.unshift(mission_id)
        localStorage.setItem("travelPro_missions", JSON.stringify(ids.slice(0, 50)))
      }
      await refreshMission(mission_id)
      return mission_id
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const submitAnswers = async (id: string, answers: Record<string, any>) => {
    setLoading(true)
    try {
      const state = await api.answerClarification(id, answers)
      setMission(state)
      await refreshMission(id)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (missionId && !mission) {
      refreshMission(missionId)
    }
  }, [missionId, refreshMission, mission])

  return {
    mission,
    summary,
    loading,
    error,
    refreshMission,
    startMission,
    submitAnswers,
  }
}
