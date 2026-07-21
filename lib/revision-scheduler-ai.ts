import { getSupabaseAdmin } from "./supabase-server"
import { callAIWithFallback, cleanJsonText } from "./ai"
import { createRevision, getRevisions } from "./revision-db"
import type { RevisionSchedule } from "@/types"

const INTERVALS = [1, 3, 7, 14, 30] // Spaced repetition stages

function getLocalIsoDate(date: Date = new Date()) {
  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60 * 1000)
  return localDate.toISOString().split("T")[0]
}

export interface AIParsedRevisionInfo {
  subject: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  priority: "low" | "medium" | "high"
  estimated_minutes: number
  tips: string[]
}

export async function analyzeTopicForRevision(topic: string): Promise<AIParsedRevisionInfo> {
  const prompt = `Analyze the topic "${topic}" to determine:
1. The academic/technical subject it belongs to (e.g. Computer Science, Mathematics, Biology, etc.)
2. The difficulty level for a student: "Beginner", "Intermediate", or "Advanced".
3. The revision priority: "low", "medium", or "high".
4. The estimated duration in minutes for a focused revision session (between 15 and 60 minutes).
5. A list of 2 short study tips or key concepts to review.

Return ONLY a valid JSON object. Do not include any markdown, code blocks, backticks, or explanatory text before or after the JSON.
The JSON object must have exactly the following structure:
{
  "subject": "Subject Name",
  "difficulty": "Beginner" | "Intermediate" | "Advanced",
  "priority": "low" | "medium" | "high",
  "estimated_minutes": 30,
  "tips": ["Tip 1", "Tip 2"]
}`

  try {
    const raw = await callAIWithFallback(prompt)
    const cleaned = cleanJsonText(raw)
    const parsed = JSON.parse(cleaned)

    let difficulty: "Beginner" | "Intermediate" | "Advanced" = "Intermediate"
    const pDiff = String(parsed.difficulty || "").trim().toLowerCase()
    if (pDiff === "beginner") difficulty = "Beginner"
    else if (pDiff === "advanced") difficulty = "Advanced"

    let priority: "low" | "medium" | "high" = "medium"
    const pPrior = String(parsed.priority || "").trim().toLowerCase()
    if (pPrior === "low") priority = "low"
    else if (pPrior === "high") priority = "high"

    return {
      subject: String(parsed.subject || "General Studies").trim(),
      difficulty,
      priority,
      estimated_minutes: Math.max(10, Math.min(120, Number(parsed.estimated_minutes) || 20)),
      tips: Array.isArray(parsed.tips) ? parsed.tips.map(String) : [],
    }
  } catch (error) {
    console.warn("[analyzeTopicForRevision] AI analyzer failed, using fallback:", error)
    return {
      subject: "General Studies",
      difficulty: "Intermediate",
      priority: "medium",
      estimated_minutes: 20,
      tips: [
        "Review your study notes and practice recall exercises.",
        "Take a practice quiz on this topic to check your understanding.",
      ],
    }
  }
}

export async function generateRevisionsFromActivity(userId: string): Promise<{ generatedCount: number }> {
  const admin = await getSupabaseAdmin()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 14)
  const cutoffIso = cutoff.toISOString()

  // Fetch recent user learning activity (last 14 days)
  const [
    { data: chats },
    { data: notes },
    { data: flashcards },
    { data: quizzes },
    { data: voices },
    existingRevisions,
  ] = await Promise.all([
    admin.from("chat_sessions").select("topic, title, last_message_at").eq("user_id", userId).gte("last_message_at", cutoffIso),
    admin.from("saved_notes").select("source_title, created_at").eq("user_id", userId).gte("created_at", cutoffIso),
    admin.from("saved_flashcard_sets").select("topic, created_at").eq("user_id", userId).gte("created_at", cutoffIso),
    admin.from("saved_quiz_attempts").select("topic, created_at").eq("user_id", userId).gte("created_at", cutoffIso),
    admin.from("saved_voice_history").select("title, prompt, created_at").eq("user_id", userId).gte("created_at", cutoffIso),
    getRevisions(userId),
  ])

  // Track unique topics and the last studied date
  const topicsMap = new Map<string, { topic: string; lastStudied: Date }>()

  function addTopic(topicName: string | undefined, dateStr: string) {
    if (!topicName || topicName.trim() === "") return
    const normalized = topicName.trim().toLowerCase()
    const date = new Date(dateStr)
    const existing = topicsMap.get(normalized)
    if (!existing || date > existing.lastStudied) {
      topicsMap.set(normalized, { topic: topicName.trim(), lastStudied: date })
    }
  }

  // Parse topics from all activity types
  ;(chats || []).forEach((item) => addTopic(item.topic || item.title, item.last_message_at))
  ;(notes || []).forEach((item) => addTopic(item.source_title, item.created_at))
  ;(flashcards || []).forEach((item) => addTopic(item.topic, item.created_at))
  ;(quizzes || []).forEach((item) => addTopic(item.topic, item.created_at))
  ;(voices || []).forEach((item) => addTopic(item.title || item.prompt, item.created_at))

  // Exclude topics that already have revision schedule tasks
  const scheduledTopics = new Set(existingRevisions.map((r) => r.topic.trim().toLowerCase()))
  scheduledTopics.forEach((t) => topicsMap.delete(t))

  let generatedCount = 0

  for (const [_, info] of topicsMap) {
    // Analyze the topic using AI (or fallback)
    const aiResult = await analyzeTopicForRevision(info.topic)

    // Schedule Stage 1 for study_date + 1 day
    const studyDateStr = getLocalIsoDate(info.lastStudied)
    const scheduledDate = new Date(info.lastStudied)
    scheduledDate.setDate(scheduledDate.getDate() + 1)
    const scheduledDateStr = getLocalIsoDate(scheduledDate)

    const notesContent = aiResult.tips.map((tip) => `• ${tip}`).join("\n")

    try {
      await createRevision(userId, {
        topic: info.topic,
        subject: aiResult.subject,
        study_date: studyDateStr,
        scheduled_date: scheduledDateStr,
        revision_stage: 1,
        priority: aiResult.priority,
        estimated_minutes: aiResult.estimated_minutes,
        status: "pending",
        notes: `Revision tips:\n${notesContent}`,
      })
      generatedCount++
    } catch (err) {
      console.error(`[generateRevisionsFromActivity] Failed to create revision for topic ${info.topic}:`, err)
    }
  }

  return { generatedCount }
}

export async function generateNextRevisionStage(
  userId: string,
  completedRevision: RevisionSchedule,
  completedAt: Date = new Date()
): Promise<RevisionSchedule | null> {
  const currentStage = completedRevision.revision_stage
  if (currentStage >= 5) {
    return null // Complete revision loop finished
  }

  const nextStage = currentStage + 1
  const baseGap = INTERVALS[nextStage - 1] - INTERVALS[currentStage - 1] // Days between stages

  // Topic difficulty factor
  // Beginner -> concepts are lighter, wait longer (longer interval)
  // Advanced -> concepts are heavier, review sooner (shorter interval)
  // Intermediate -> baseline interval
  let difficulty: "Beginner" | "Intermediate" | "Advanced" = "Intermediate"
  
  // Try to determine difficulty level from notes or analysis history
  const noteLower = (completedRevision.notes || "").toLowerCase()
  if (noteLower.includes("difficulty: beginner")) difficulty = "Beginner"
  else if (noteLower.includes("difficulty: advanced")) difficulty = "Advanced"

  let intervalMultiplier = 1.0
  if (difficulty === "Advanced") {
    intervalMultiplier = 0.8
  } else if (difficulty === "Beginner") {
    intervalMultiplier = 1.2
  }

  // Completion consistency check
  // If completed overdue by > 1 day, user struggled to review on time, so review sooner
  const scheduledDate = new Date(completedRevision.scheduled_date)
  const isOverdue = completedAt.getTime() - scheduledDate.getTime() > 24 * 60 * 60 * 1000
  if (isOverdue) {
    intervalMultiplier *= 0.7
  }

  const calculatedGap = Math.max(1, Math.round(baseGap * intervalMultiplier))

  const nextScheduledDate = new Date(completedAt)
  nextScheduledDate.setDate(nextScheduledDate.getDate() + calculatedGap)
  const scheduledDateStr = getLocalIsoDate(nextScheduledDate)

  // AI custom stage tips recommendation
  const prompt = `Personalize revision tips for Stage ${nextStage} of topic "${completedRevision.topic}" in "${completedRevision.subject}".
The user completed the previous stage, and the topic difficulty is estimated as "${difficulty}".

Return ONLY a valid JSON object. Do not include any markdown, code blocks, backticks, or explanatory text before or after the JSON.
The JSON object must have exactly the following structure:
{
  "estimated_minutes": 30,
  "tips": ["Tip 1", "Tip 2"]
}`

  let nextEstMinutes = completedRevision.estimated_minutes
  let nextTips = [
    `Complete active recall exercise for Stage ${nextStage}.`,
    `Do a quick quiz or try teaching the concept from memory.`,
  ]

  try {
    const raw = await callAIWithFallback(prompt)
    const cleaned = cleanJsonText(raw)
    const parsed = JSON.parse(cleaned)
    nextEstMinutes = Math.max(10, Math.min(120, Number(parsed.estimated_minutes) || completedRevision.estimated_minutes))
    if (Array.isArray(parsed.tips) && parsed.tips.length > 0) {
      nextTips = parsed.tips.map(String)
    }
  } catch (error) {
    console.warn("[generateNextRevisionStage] AI stage generator failed, using default tips:", error)
    // Fallback based on stage
    if (nextStage === 2) {
      nextEstMinutes = 20
      nextTips = ["Review notes briefly then answer active recall questions.", "Explain the core concepts out loud."]
    } else if (nextStage === 3) {
      nextEstMinutes = 30
      nextTips = ["Do a mock quiz or check flashcards.", "Focus on areas you missed in previous stages."]
    } else if (nextStage === 4) {
      nextEstMinutes = 40
      nextTips = ["Summarize the topic on one page from memory.", "Solve advanced problems related to this topic."]
    } else if (nextStage === 5) {
      nextEstMinutes = 50
      nextTips = ["Teach the topic to a peer or draft a cheat sheet.", "Run a final cumulative check of flashcards."]
    }
  }

  const nextNotes = `Difficulty: ${difficulty}\nStage ${nextStage} tips:\n${nextTips.map((t) => `• ${t}`).join("\n")}`

  return await createRevision(userId, {
    topic: completedRevision.topic,
    subject: completedRevision.subject,
    study_date: completedRevision.study_date,
    scheduled_date: scheduledDateStr,
    revision_stage: nextStage,
    priority: completedRevision.priority,
    estimated_minutes: nextEstMinutes,
    status: "pending",
    notes: nextNotes,
  })
}
