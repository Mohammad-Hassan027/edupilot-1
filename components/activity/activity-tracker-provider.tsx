"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { usePathname } from "next/navigation"

type ActivityTrackerContextValue = {
  currentSessionSeconds: number
  isActivelyTracking: boolean
}

const ActivityTrackerContext = createContext<ActivityTrackerContextValue>({
  currentSessionSeconds: 0,
  isActivelyTracking: false,
})

const INACTIVITY_TIMEOUT_MS = 60_000
const HEARTBEAT_INTERVAL_MS = 30_000
const SECOND_TICK_MS = 1_000

function createSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `session_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

export function ActivityTrackerProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const sessionIdRef = useRef<string>(createSessionId())
  const pendingSecondsRef = useRef(0)
  const heartbeatRef = useRef<number | null>(null)
  const lastActivityAtRef = useRef(Date.now())
  const isPageVisibleRef = useRef(true)
  const currentPathRef = useRef(pathname)

  const [currentSessionSeconds, setCurrentSessionSeconds] = useState(0)
  const [isActivelyTracking, setIsActivelyTracking] = useState(true)

  const flushPendingSeconds = useCallback(
    (ended = false) => {
      const seconds = pendingSecondsRef.current
      if (seconds <= 0) {
        if (ended && typeof navigator !== "undefined" && navigator.sendBeacon) {
          const payload = JSON.stringify({
            sessionId: sessionIdRef.current,
            path: currentPathRef.current,
            seconds: 0,
            ended: true,
          })
          navigator.sendBeacon("/api/activity/track", new Blob([payload], { type: "application/json" }))
        }
        return
      }

      pendingSecondsRef.current = 0
      const payload = JSON.stringify({
        sessionId: sessionIdRef.current,
        path: currentPathRef.current,
        seconds,
        ended,
      })

      if (ended && typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon("/api/activity/track", new Blob([payload], { type: "application/json" }))
        return
      }

      fetch("/api/activity/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: ended,
      }).catch(() => undefined)
    },
    []
  )

  const markActive = useCallback(() => {
    lastActivityAtRef.current = Date.now()
    if (document.visibilityState === "visible") {
      isPageVisibleRef.current = true
      setIsActivelyTracking(true)
    }
  }, [])


  useEffect(() => {
    const activityEvents: Array<keyof WindowEventMap> = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "focus"]

    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === "visible"
      isPageVisibleRef.current = isVisible
      if (isVisible) {
        markActive()
      } else {
        setIsActivelyTracking(false)
        flushPendingSeconds(false)
      }
    }

    activityEvents.forEach((eventName) => window.addEventListener(eventName, markActive, { passive: true }))
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, markActive))
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [flushPendingSeconds, markActive])

  useEffect(() => {
    const interval = window.setInterval(() => {
      const isActiveNow = isPageVisibleRef.current && Date.now() - lastActivityAtRef.current < INACTIVITY_TIMEOUT_MS
      setIsActivelyTracking(isActiveNow)

      if (!isActiveNow) return

      pendingSecondsRef.current += 1
      setCurrentSessionSeconds((prev) => prev + 1)
    }, SECOND_TICK_MS)

    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    heartbeatRef.current = window.setInterval(() => flushPendingSeconds(false), HEARTBEAT_INTERVAL_MS)
    return () => {
      if (heartbeatRef.current) {
        window.clearInterval(heartbeatRef.current)
      }
    }
  }, [flushPendingSeconds])

  useEffect(() => {
    return () => flushPendingSeconds(true)
  }, [flushPendingSeconds])

  useEffect(() => {
    const handleBeforeUnload = () => flushPendingSeconds(true)
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [flushPendingSeconds])

  useEffect(() => {
    if (currentPathRef.current !== pathname) {
      flushPendingSeconds(false)
      currentPathRef.current = pathname
    }
  }, [pathname, flushPendingSeconds])

  const value = useMemo(
    () => ({ currentSessionSeconds, isActivelyTracking }),
    [currentSessionSeconds, isActivelyTracking]
  )

  return <ActivityTrackerContext.Provider value={value}>{children}</ActivityTrackerContext.Provider>
}

export function useActivityTracker() {
  return useContext(ActivityTrackerContext)
}
