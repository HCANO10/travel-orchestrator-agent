import { useState, useEffect, useCallback, useRef } from "react"
import { api } from "../lib/api"
import { MissionState, TravelProposalSummary, TravelRequestDTO } from "../lib/types"

export function useMission(missionId?: string) {
  const [mission, setMission] = useState<MissionState | null>(null)
  const [summary, setSummary] = useState<TravelProposalSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pollingActive, setPollingActive] = useState(false)
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
      setPollingActive(false)
    }
  }, [])

  const fetchStatus = useCallback(async (id: string) => {
    try {
      const state = await api.getMission(id)
      setMission(state)
      
      if (state.status === "done") {
        const summaryData = await api.getMissionSummary(id)
        setSummary(summaryData)
        stopPolling()
      } else if (state.status === "error") {
        stopPolling()
      }
    } catch (err: any) {
      setError(err.message)
      stopPolling()
    }
  }, [stopPolling])

  const startPolling = useCallback((id: string) => {
    stopPolling()
    setPollingActive(true)
    fetchStatus(id)
    pollIntervalRef.current = setInterval(() => fetchStatus(id), 2000)
  }, [fetchStatus, stopPolling])

  const startMission = async (request: TravelRequestDTO) => {
    setLoading(true)
    setError(null)
    try {
      const { mission_id } = await api.createMission(request)
      startPolling(mission_id)
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
      startPolling(id)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (missionId && !mission) {
      startPolling(missionId)
    }
    return () => stopPolling()
  }, [missionId, startPolling, stopPolling, mission])

  return {
    mission,
    summary,
    loading,
    error,
    pollingActive,
    startMission,
    submitAnswers,
    stopPolling,
  }
}
