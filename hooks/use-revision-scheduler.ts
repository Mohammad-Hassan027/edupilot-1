import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import type { RevisionSchedule, RevisionStats } from "@/types"

function getLocalDateStr() {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  const localDate = new Date(now.getTime() - offset * 60 * 1000)
  return localDate.toISOString().split("T")[0]
}

export function useRevisionScheduler() {
  const [revisions, setRevisions] = useState<{
    today: RevisionSchedule[]
    overdue: RevisionSchedule[]
    upcoming: RevisionSchedule[]
    completed: RevisionSchedule[]
  }>({
    today: [],
    overdue: [],
    upcoming: [],
    completed: [],
  })
  const [stats, setStats] = useState<RevisionStats>({
    pendingCount: 0,
    completedCount: 0,
    completedTodayCount: 0,
    overdueCount: 0,
    upcomingCount: 0,
    streakCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Notification States
  const [notificationStatus, setNotificationStatus] = useState<
    "default" | "granted" | "denied" | "unsupported"
  >("default")

  const fetchRevisions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const localDate = getLocalDateStr()
      const response = await fetch(`/api/revision/upcoming?date=${localDate}`, {
        cache: "no-store",
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load revisions")
      }

      setRevisions({
        today: result.data.today || [],
        overdue: result.data.overdue || [],
        upcoming: result.data.upcoming || [],
        completed: result.data.completed || [],
      })
      setStats(result.data.stats)
    } catch (err) {
      console.error("[useRevisionScheduler] fetch error:", err)
      setError(err instanceof Error ? err.message : "Failed to load revisions")
    } finally {
      setLoading(false)
    }
  }, [])

  const generateSchedule = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/revision/generate", {
        method: "POST",
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to generate schedule")
      }

      const generated = result.generatedCount
      if (generated > 0) {
        toast.success(`Generated ${generated} new revision task${generated > 1 ? "s" : ""} from your study activity!`)
      } else {
        toast.info("Your revision schedule is already up to date based on your recent activity.")
      }

      // Dispatch event to refresh header notifications dropdown list
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("edupilot-notifications-refresh"))
      }

      await fetchRevisions()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate schedule")
    } finally {
      setLoading(false)
    }
  }

  const markComplete = async (id: string) => {
    // Optimistic Update
    const allToday = [...revisions.today]
    const allOverdue = [...revisions.overdue]
    const allUpcoming = [...revisions.upcoming]
    const allCompleted = [...revisions.completed]

    let foundItem: RevisionSchedule | null = null
    let listName: "today" | "overdue" | "upcoming" = "today"

    const tIndex = allToday.findIndex((r) => r.id === id)
    if (tIndex !== -1) {
      foundItem = allToday[tIndex]
      listName = "today"
      allToday.splice(tIndex, 1)
    } else {
      const oIndex = allOverdue.findIndex((r) => r.id === id)
      if (oIndex !== -1) {
        foundItem = allOverdue[oIndex]
        listName = "overdue"
        allOverdue.splice(oIndex, 1)
      } else {
        const uIndex = allUpcoming.findIndex((r) => r.id === id)
        if (uIndex !== -1) {
          foundItem = allUpcoming[uIndex]
          listName = "upcoming"
          allUpcoming.splice(uIndex, 1)
        }
      }
    }

    if (!foundItem) return

    // Optimistically push to completed list
    const completedOptimisticItem: RevisionSchedule = {
      ...foundItem,
      status: "completed",
      completed_at: new Date().toISOString(),
    }
    allCompleted.unshift(completedOptimisticItem)

    setRevisions({
      today: allToday,
      overdue: allOverdue,
      upcoming: allUpcoming,
      completed: allCompleted,
    })

    try {
      const response = await fetch(`/api/revision/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to complete revision task")
      }

      toast.success("Revision completed!")
      
      if (result.nextRevision) {
        toast.info(`Scheduled Stage ${result.nextRevision.revision_stage} review for ${result.nextRevision.scheduled_date}`)
      }

      // Dispatch event to refresh header notifications dropdown list
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("edupilot-notifications-refresh"))
      }

      await fetchRevisions()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark complete")
      // Revert optimistic update
      await fetchRevisions()
    }
  }

  const deleteRevisionTask = async (id: string) => {
    try {
      const response = await fetch(`/api/revision/${id}`, {
        method: "DELETE",
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to delete revision task")
      }

      toast.success("Revision task deleted.")
      await fetchRevisions()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete task")
    }
  }

  const updateNotes = async (id: string, notes: string | null) => {
    try {
      const response = await fetch(`/api/revision/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to save notes")
      }

      setRevisions((prev) => {
        const updateItem = (item: RevisionSchedule) =>
          item.id === id ? { ...item, notes } : item

        return {
          today: prev.today.map(updateItem),
          overdue: prev.overdue.map(updateItem),
          upcoming: prev.upcoming.map(updateItem),
          completed: prev.completed.map(updateItem),
        }
      })
      toast.success("Notes updated successfully.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update notes")
    }
  }

  // Check notification permission support
  const checkNotificationPermission = useCallback(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationStatus("unsupported")
      return
    }
    setNotificationStatus(Notification.permission as any)
  }, [])

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Browser notifications are not supported on this browser.")
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      setNotificationStatus(permission as any)
      if (permission === "granted") {
        toast.success("Notifications enabled successfully!")
        return true
      } else if (permission === "denied") {
        toast.error("Notification permission denied. Enable it in browser settings.")
      }
    } catch (err) {
      console.error("[useRevisionScheduler] Permission error:", err)
    }
    return false
  }

  // Trigger reminders
  const triggerReminderNotification = useCallback(
    (pendingCount: number) => {
      if (
        typeof window === "undefined" ||
        !("Notification" in window) ||
        Notification.permission !== "granted" ||
        pendingCount <= 0
      ) {
        return
      }

      const todayKey = getLocalDateStr()
      const notifiedKey = `edupilot_revision_notified_${todayKey}`
      const alreadyNotified = window.localStorage.getItem(notifiedKey)

      if (alreadyNotified === "true") return

      try {
        const title = "EduPilot Study Reminders"
        const options = {
          body: `You have ${pendingCount} revision task${pendingCount > 1 ? "s" : ""} scheduled for review today. Keep up your learning streak!`,
          icon: "/favicon.ico",
        }

        const notification = new Notification(title, options)
        notification.onclick = () => {
          window.focus()
          window.location.href = "/revision"
        }

        window.localStorage.setItem(notifiedKey, "true")
      } catch (err) {
        console.error("[triggerReminderNotification] failed to trigger:", err)
      }
    },
    []
  )

  useEffect(() => {
    void fetchRevisions()
    checkNotificationPermission()
  }, [fetchRevisions, checkNotificationPermission])

  // Trigger reminder when revisions load and there are today's/overdue items
  useEffect(() => {
    if (!loading && (revisions.today.length > 0 || revisions.overdue.length > 0)) {
      triggerReminderNotification(revisions.today.length + revisions.overdue.length)
    }
  }, [loading, revisions.today, revisions.overdue, triggerReminderNotification])

  return {
    revisions,
    stats,
    loading,
    error,
    generateSchedule,
    markComplete,
    deleteRevisionTask,
    updateNotes,
    refresh: fetchRevisions,
    notificationStatus,
    requestNotificationPermission,
  }
}
