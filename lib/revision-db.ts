import { getSupabaseAdmin } from "./supabase-server"
import type { RevisionSchedule, RevisionStats } from "@/types"

function toLocalDayKey(dateInput: string | Date) {
  const d = new Date(dateInput)
  if (Number.isNaN(d.getTime())) return ""
  // Format as YYYY-MM-DD using timezone-safe offset math
  const offset = d.getTimezoneOffset()
  const localDate = new Date(d.getTime() - offset * 60 * 1000)
  return localDate.toISOString().split("T")[0]
}

export async function getRevisions(userId: string): Promise<RevisionSchedule[]> {
  const admin = await getSupabaseAdmin()
  const { data, error } = await admin
    .from("revision_schedule")
    .select("*")
    .eq("user_id", userId)
    .order("scheduled_date", { ascending: true })

  if (error) {
    throw new Error(`Failed to load revisions: ${error.message}`)
  }

  return (data || []) as RevisionSchedule[]
}

export async function getRevisionById(userId: string, id: string): Promise<RevisionSchedule | null> {
  const admin = await getSupabaseAdmin()
  const { data, error } = await admin
    .from("revision_schedule")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load revision: ${error.message}`)
  }

  return data as RevisionSchedule | null
}

export async function createRevision(
  userId: string,
  input: {
    topic: string
    subject: string
    study_date: string
    scheduled_date: string
    revision_stage: number
    priority: "low" | "medium" | "high"
    estimated_minutes: number
    status?: "pending" | "completed"
    completed_at?: string | null
    notes?: string | null
  }
): Promise<RevisionSchedule> {
  const admin = await getSupabaseAdmin()
  const payload = {
    user_id: userId,
    topic: input.topic,
    subject: input.subject,
    study_date: input.study_date,
    scheduled_date: input.scheduled_date,
    revision_stage: input.revision_stage,
    priority: input.priority,
    estimated_minutes: input.estimated_minutes,
    status: input.status || "pending",
    completed_at: input.completed_at || null,
    notes: input.notes || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await admin
    .from("revision_schedule")
    .insert(payload)
    .select("*")
    .single()

  if (error) {
    throw new Error(`Failed to create revision schedule: ${error.message}`)
  }

  return data as RevisionSchedule
}

export async function updateRevision(
  userId: string,
  id: string,
  updates: Partial<Omit<RevisionSchedule, "id" | "user_id" | "created_at">>
): Promise<RevisionSchedule> {
  const admin = await getSupabaseAdmin()
  const payload = {
    ...updates,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await admin
    .from("revision_schedule")
    .update(payload)
    .eq("user_id", userId)
    .eq("id", id)
    .select("*")
    .single()

  if (error) {
    throw new Error(`Failed to update revision: ${error.message}`)
  }

  return data as RevisionSchedule
}

export async function deleteRevision(userId: string, id: string): Promise<void> {
  const admin = await getSupabaseAdmin()
  const { error } = await admin
    .from("revision_schedule")
    .delete()
    .eq("user_id", userId)
    .eq("id", id)

  if (error) {
    throw new Error(`Failed to delete revision: ${error.message}`)
  }
}

export async function getRevisionStats(userId: string): Promise<RevisionStats> {
  const revisions = await getRevisions(userId)
  const todayStr = toLocalDayKey(new Date())

  let pendingCount = 0
  let completedCount = 0
  let completedTodayCount = 0
  let overdueCount = 0
  let upcomingCount = 0

  const completedDates = new Set<string>()

  for (const rev of revisions) {
    const isCompleted = rev.status === "completed"
    if (isCompleted) {
      completedCount++
      if (rev.completed_at) {
        const completedDay = toLocalDayKey(rev.completed_at)
        completedDates.add(completedDay)
        if (completedDay === todayStr) {
          completedTodayCount++
        }
      }
    } else {
      pendingCount++
      const dueDay = rev.scheduled_date // YYYY-MM-DD
      if (dueDay < todayStr) {
        overdueCount++
      } else if (dueDay === todayStr) {
        // counted as today's pending
      } else {
        upcomingCount++
      }
    }
  }

  // Calculate streak based on consecutive completed days
  const sortedDates = Array.from(completedDates).sort().reverse()
  let streakCount = 0

  if (sortedDates.length > 0) {
    const today = new Date(todayStr)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = toLocalDayKey(yesterday)

    const firstDate = sortedDates[0]
    if (firstDate === todayStr || firstDate === yesterdayStr) {
      streakCount = 1
      let current = new Date(firstDate)

      for (let i = 1; i < sortedDates.length; i++) {
        const prev = new Date(current)
        prev.setDate(prev.getDate() - 1)
        const expectedStr = toLocalDayKey(prev)

        if (sortedDates[i] === expectedStr) {
          streakCount++
          current = new Date(sortedDates[i])
        } else {
          break
        }
      }
    }
  }

  return {
    pendingCount,
    completedCount,
    completedTodayCount,
    overdueCount,
    upcomingCount,
    streakCount,
  }
}
