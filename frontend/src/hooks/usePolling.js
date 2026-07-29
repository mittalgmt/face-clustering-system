import { useState, useEffect, useRef, useCallback } from 'react'
import { getJob } from '../api/jobsApi'

const TERMINAL_STATUSES = ['COMPLETED', 'FAILED']
const POLL_INTERVAL_MS = 2000

/**
 * Polls the job endpoint every 2 seconds until job reaches a terminal status.
 * @param {string|null} jobId
 * @returns {{ job, loading, error, refetch }}
 */
export function usePolling(jobId) {
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const intervalRef = useRef(null)
  const activeJobId = useRef(null)

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const fetchOnce = useCallback(async (id) => {
    try {
      const data = await getJob(id)
      setJob(data)
      setError(null)

      // Stop polling once terminal
      if (TERMINAL_STATUSES.includes(data.status)) {
        stopPolling()
      }

      return data
    } catch (err) {
      setError(err.message)
      stopPolling()
      return null
    }
  }, [stopPolling])

  useEffect(() => {
    if (!jobId) return

    // Reset state when jobId changes
    setJob(null)
    setError(null)
    setLoading(true)
    stopPolling()
    activeJobId.current = jobId

    // Immediate first fetch
    fetchOnce(jobId).then((data) => {
      setLoading(false)
      if (data && !TERMINAL_STATUSES.includes(data.status)) {
        // Start polling
        intervalRef.current = setInterval(() => {
          if (activeJobId.current === jobId) {
            fetchOnce(jobId)
          }
        }, POLL_INTERVAL_MS)
      }
    })

    return () => stopPolling()
  }, [jobId, fetchOnce, stopPolling])

  const refetch = useCallback(() => {
    if (jobId) fetchOnce(jobId)
  }, [jobId, fetchOnce])

  return { job, loading, error, refetch }
}
