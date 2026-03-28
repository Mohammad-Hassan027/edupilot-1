export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { getRecentUsageLogs } from "@/lib/database"

type NotificationType = "success" | "warning" | "info" | "achievement"

type NotificationItem = {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: string
  createdAt: string
  read: boolean
}

function formatRelativeTime(dateString: string) {
  const now = new Date().getTime()
  const then = new Date(dateString).getTime()

  if (Number.isNaN(then)) return "Just now"

  const diffMs = now - then
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return "Just now"
  if (diffMinutes < 60) return `${diffMinutes} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
}

function toSafeString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}

function mapUsageLogToNotification(log: {
  id: string
  feature: string
  metadata: Record<string, unknown> | null
  created_at: string
}): NotificationItem {
  const metadata = (log.metadata || {}) as Record<string, unknown>
  const action = toSafeString(metadata.action, "")
  const topic = toSafeString(metadata.topic, "your topic")
  const titleValue = toSafeString(metadata.title, "your study plan")
  const score = Number(metadata.score ?? 0)
  const totalQuestions = Number(metadata.totalQuestions ?? 0)
  const percentage = Number(metadata.percentage ?? 0)
  const taskCount = Number(metadata.taskCount ?? 0)

  let type: NotificationType = "info"
  let title = "New Activity"
  let message = "A new activity was recorded in your EduPilot account."

  if (log.feature === "ai_chat" && action === "question_asked") {
    type = "info"
    title = "AI Tutor Activity"
    message = `You asked AI Tutor about "${topic}".`
  } else if (log.feature === "ai_file_analysis" && action === "question_asked") {
    type = "info"
    title = "File Analysis Activity"
    message = `You analyzed a file in AI Tutor for "${topic}".`
  } else if (log.feature === "ai_web_search" && action === "question_asked") {
    type = "info"
    title = "Web Search Activity"
    message = `You used AI Tutor web search for "${topic}".`
  } else if (log.feature === "notes" && action === "notes_generated") {
    type = "success"
    title = "Notes Generated"
    message = `Your notes for "${topic}" were created successfully.`
  } else if (log.feature === "flashcards" && action === "flashcards_generated") {
    type = "success"
    title = "Flashcards Ready"
    message = `Your flashcards for "${topic}" were generated successfully.`
  } else if (log.feature === "ai_voice" && action === "voice_prompt_completed") {
    type = "success"
    title = "AI Voice Completed"
    message = `AI Voice completed a response for "${topic}".`
  } else if (log.feature === "quiz" && action === "quiz_generated") {
    type = "info"
    title = "Quiz Generated"
    message = `Your quiz for "${topic}" is ready.`
  } else if (log.feature === "quiz" && action === "quiz_completed") {
    type = percentage >= 80 ? "achievement" : "success"
    title = "Quiz Completed"
    message = `You completed "${topic}" and scored ${score}/${totalQuestions} (${percentage}%).`
  } else if (log.feature === "study_plan" && action === "planner_saved") {
    type = "success"
    title = "Study Plan Saved"
    message =
      taskCount > 0
        ? `"${titleValue}" was saved with ${taskCount} task${taskCount > 1 ? "s" : ""}.`
        : `"${titleValue}" was saved successfully.`
  }

  return {
    id: log.id,
    type,
    title,
    message,
    timestamp: formatRelativeTime(log.created_at),
    createdAt: log.created_at,
    read: false,
  }
}

export async function GET() {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ notifications: [] })
    }

    const logs = await getRecentUsageLogs(user.id, 25)

    const notifications = logs.map(mapUsageLogToNotification)

    return NextResponse.json({ notifications })
  } catch (err) {
    console.error("[user/notifications] Error:", err)
    return NextResponse.json({ notifications: [] })
  }
}