import {
  computeNextReview,
  isCardDue,
  RATING_TO_QUALITY,
  type ReviewRating as SpacedRepetitionRating,
} from "@/lib/spaced-repetition"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import type { Credits, Subscription, Profile, FeatureKey } from "@/types"
import { FREE_CREDITS as FREE_CREDIT_VALUES } from "@/types"

export type SavedNoteTab = {
  type: "summary" | "concepts" | "bullets" | "revision"
  title: string
  content: string
}

export type SavedNoteRecord = {
  id: string
  user_id: string
  source_type: string
  source_title: string
  source_label: string | null
  source_hint: string | null
  tabs: SavedNoteTab[]
  created_at: string
  updated_at: string
}

export type FlashcardReviewRating = SpacedRepetitionRating

export type SavedFlashcard = {
  front: string
  back: string
  interval: number
  easeFactor: number
  repetitions: number
  nextReviewAt: string
  lastReviewedAt: string | null
}

export type FlashcardSourceType = "topic" | "note" | "chat"

export type SavedFlashcardSetRecord = {
  id: string
  user_id: string
  topic: string
  card_count: number
  cards: SavedFlashcard[]
  source_type: FlashcardSourceType
  source_id: string | null
  created_at: string
  updated_at: string
}

function withDefaultReviewState(card: { front: string; back: string }): SavedFlashcard {
  return {
    front: card.front,
    back: card.back,
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewAt: new Date().toISOString(),
    lastReviewedAt: null,
  }
}

export async function saveFlashcardSet(
  userId: string,
  input: {
    topic: string
    cards: Array<{ front: string; back: string }>
    sourceType?: FlashcardSourceType
    sourceId?: string | null
  }
) {
  const admin = await getSupabaseAdmin()

  const payload = {
    user_id: userId,
    topic: input.topic,
    card_count: input.cards.length,
    cards: input.cards.map(withDefaultReviewState),
    source_type: input.sourceType || "topic",
    source_id: input.sourceId || null,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await admin
    .from("saved_flashcard_sets")
    .insert(payload)
    .select("*")
    .single()

  if (error) {
    throw new Error(`Failed to save flashcard set: ${error.message}`)
  }

  return data as SavedFlashcardSetRecord
}

// Spaced-repetition scheduling for flashcard reviews. The SM-2 math itself
// lives in lib/spaced-repetition.ts as a pure, independently testable
// function; this wrapper loads/saves the card state and logs the review to
// flashcard_reviews for history.
export async function updateFlashcardReview(
  userId: string,
  setId: string,
  cardIndex: number,
  rating: FlashcardReviewRating
) {
  const admin = await getSupabaseAdmin()

  const { data: existing, error: fetchError } = await admin
    .from("saved_flashcard_sets")
    .select("*")
    .eq("user_id", userId)
    .eq("id", setId)
    .maybeSingle()

  if (fetchError) {
    throw new Error(`Failed to load flashcard set: ${fetchError.message}`)
  }

  if (!existing) {
    throw new Error("Flashcard set not found")
  }

  const set = existing as SavedFlashcardSetRecord
  const cards = [...set.cards]
  const card = cards[cardIndex]

  if (!card) {
    throw new Error("Flashcard not found in set")
  }

  const now = new Date()
  const schedule = computeNextReview(
    {
      interval: card.interval ?? 0,
      easeFactor: card.easeFactor ?? 2.5,
      repetitions: card.repetitions ?? 0,
    },
    rating,
    now
  )

  const updatedCard: SavedFlashcard = {
    ...card,
    interval: schedule.interval,
    easeFactor: schedule.easeFactor,
    repetitions: schedule.repetitions,
    nextReviewAt: schedule.nextReviewAt,
    lastReviewedAt: now.toISOString(),
  }

  cards[cardIndex] = updatedCard

  const { data, error } = await admin
    .from("saved_flashcard_sets")
    .update({ cards, updated_at: now.toISOString() })
    .eq("user_id", userId)
    .eq("id", setId)
    .select("*")
    .single()

  if (error) {
    throw new Error(`Failed to update flashcard review: ${error.message}`)
  }

  // Best-effort review history log. This table may not exist yet if the
  // migration hasn't been applied — never let logging failures break the
  // primary scheduling update.
  try {
    const { error: logError } = await admin.from("flashcard_reviews").insert({
      user_id: userId,
      set_id: setId,
      card_index: cardIndex,
      rating,
      quality: RATING_TO_QUALITY[rating],
      interval_days: schedule.interval,
      ease_factor: schedule.easeFactor,
      repetitions: schedule.repetitions,
      reviewed_at: now.toISOString(),
    })
    if (logError) console.error("[flashcards] Failed to log review history:", logError.message)
  } catch (err) {
    console.error("[flashcards] Failed to log review history:", err)
  }

  return data as SavedFlashcardSetRecord
}

export type DueFlashcard = {
  setId: string
  topic: string
  cardIndex: number
  front: string
  back: string
  interval: number
  easeFactor: number
  repetitions: number
  nextReviewAt: string
  lastReviewedAt: string | null
}

// Cards are stored per-set as a JSONB array (see SavedFlashcard), so "due"
// cards are computed by loading each user's sets and filtering/flattening
// their cards client-side rather than a single SQL WHERE clause. This keeps
// the query correct without depending on the optional get_due_flashcards
// SQL helper (see migration-flashcard-spaced-repetition.sql) being applied.
export async function getDueFlashcards(userId: string, before: Date = new Date()): Promise<DueFlashcard[]> {
  const sets = await getSavedFlashcardSets(userId, 100)

  const due: DueFlashcard[] = []

  for (const set of sets) {
    set.cards.forEach((card, cardIndex) => {
      if (!isCardDue(card.nextReviewAt, before)) return

      due.push({
        setId: set.id,
        topic: set.topic,
        cardIndex,
        front: card.front,
        back: card.back,
        interval: card.interval ?? 0,
        easeFactor: card.easeFactor ?? 2.5,
        repetitions: card.repetitions ?? 0,
        nextReviewAt: card.nextReviewAt ?? set.created_at,
        lastReviewedAt: card.lastReviewedAt ?? null,
      })
    })
  }

  due.sort((a, b) => new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime())

  return due
}

export async function getSavedFlashcardSets(userId: string, limit = 12) {
  const admin = await getSupabaseAdmin()

  const { data, error } = await admin
    .from("saved_flashcard_sets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    const message = error.message?.toLowerCase() || ""
    if (message.includes("saved_flashcard_sets")) {
      return []
    }
    throw new Error(`Failed to load flashcard history: ${error.message}`)
  }

  return (data || []) as SavedFlashcardSetRecord[]
}

export async function getSavedFlashcardSetById(userId: string, setId: string) {
  const admin = await getSupabaseAdmin()

  const { data, error } = await admin
    .from("saved_flashcard_sets")
    .select("*")
    .eq("user_id", userId)
    .eq("id", setId)
    .maybeSingle()

  if (error) {
    const message = error.message?.toLowerCase() || ""
    if (message.includes("saved_flashcard_sets")) {
      return null
    }
    throw new Error(`Failed to load flashcard set: ${error.message}`)
  }

  return (data || null) as SavedFlashcardSetRecord | null
}

export type SavedVoiceHistoryRecord = {
  id: string
  user_id: string
  prompt: string
  title: string
  response: string
  created_at: string
  updated_at: string
}

export async function saveVoiceHistory(
  userId: string,
  input: {
    prompt: string
    title: string
    response: string
  }
) {
  const admin = await getSupabaseAdmin()

  const payload = {
    user_id: userId,
    prompt: input.prompt,
    title: input.title,
    response: input.response,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await admin
    .from("saved_voice_history")
    .insert(payload)
    .select("*")
    .single()

  if (error) {
    throw new Error(`Failed to save voice history: ${error.message}`)
  }

  return data as SavedVoiceHistoryRecord
}

export async function getSavedVoiceHistory(userId: string, limit = 12) {
  const admin = await getSupabaseAdmin()

  const { data, error } = await admin
    .from("saved_voice_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    const message = error.message?.toLowerCase() || ""
    if (message.includes("saved_voice_history")) {
      return []
    }
    throw new Error(`Failed to load voice history: ${error.message}`)
  }

  return (data || []) as SavedVoiceHistoryRecord[]
}

export async function getSavedVoiceHistoryById(userId: string, historyId: string) {
  const admin = await getSupabaseAdmin()

  const { data, error } = await admin
    .from("saved_voice_history")
    .select("*")
    .eq("user_id", userId)
    .eq("id", historyId)
    .maybeSingle()

  if (error) {
    const message = error.message?.toLowerCase() || ""
    if (message.includes("saved_voice_history")) {
      return null
    }
    throw new Error(`Failed to load voice history item: ${error.message}`)
  }

  return (data || null) as SavedVoiceHistoryRecord | null
}

export async function deleteSavedVoiceHistory(userId: string, historyId: string) {
  const admin = await getSupabaseAdmin()

  const { error } = await admin
    .from("saved_voice_history")
    .delete()
    .eq("user_id", userId)
    .eq("id", historyId)

  if (error) {
    throw new Error(`Failed to delete voice history: ${error.message}`)
  }

  return { success: true }
}

export type SavedQuizOption = {
  id: string
  text: string
}

export type QuizQuestionType = "mcq" | "short_answer"

export type SavedQuizQuestion = {
  id: string
  type?: QuizQuestionType
  question: string
  options: SavedQuizOption[]
  correctOptionId: string | null
  expectedAnswer?: string | null
  explanation?: string | null
}

export type SavedQuizAnswer = {
  questionId: string
  selectedOptionId: string | null
  textAnswer?: string | null
  isCorrect: boolean
  feedback?: string | null
}

export type QuizDifficultyLevel = "easy" | "medium" | "hard"
export type QuizSourceType = "topic" | "note" | "chat" | "flashcards"

export type SavedQuizAttemptRecord = {
  id: string
  user_id: string
  topic: string
  difficulty: QuizDifficultyLevel
  total_questions: number
  score: number
  percentage: number
  questions: SavedQuizQuestion[]
  answers: SavedQuizAnswer[]
  source_type: QuizSourceType
  source_id: string | null
  created_at: string
  updated_at: string
}

export async function saveQuizAttempt(
  userId: string,
  input: {
    topic: string
    difficulty?: QuizDifficultyLevel
    questions: SavedQuizQuestion[]
    answers: SavedQuizAnswer[]
    score: number
    totalQuestions: number
    percentage: number
    sourceType?: QuizSourceType
    sourceId?: string | null
  }
) {
  const admin = await getSupabaseAdmin()

  const payload = {
    user_id: userId,
    topic: input.topic,
    difficulty: input.difficulty || "medium",
    total_questions: input.totalQuestions,
    score: input.score,
    percentage: input.percentage,
    questions: input.questions,
    answers: input.answers,
    source_type: input.sourceType || "topic",
    source_id: input.sourceId || null,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await admin
    .from("saved_quiz_attempts")
    .insert(payload)
    .select("*")
    .single()

  if (error) {
    throw new Error(`Failed to save quiz attempt: ${error.message}`)
  }

  return data as SavedQuizAttemptRecord
}

export async function getSavedQuizAttempts(userId: string, limit = 12) {
  const admin = await getSupabaseAdmin()

  const { data, error } = await admin
    .from("saved_quiz_attempts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    const message = error.message?.toLowerCase() || ""
    if (message.includes("saved_quiz_attempts")) {
      return []
    }
    throw new Error(`Failed to load quiz history: ${error.message}`)
  }

  return (data || []) as SavedQuizAttemptRecord[]
}

export async function getSavedQuizAttemptById(userId: string, attemptId: string) {
  const admin = await getSupabaseAdmin()

  const { data, error } = await admin
    .from("saved_quiz_attempts")
    .select("*")
    .eq("user_id", userId)
    .eq("id", attemptId)
    .maybeSingle()

  if (error) {
    const message = error.message?.toLowerCase() || ""
    if (message.includes("saved_quiz_attempts")) {
      return null
    }
    throw new Error(`Failed to load quiz attempt: ${error.message}`)
  }

  return (data || null) as SavedQuizAttemptRecord | null
}

export async function deleteSavedQuizAttempt(userId: string, attemptId: string) {
  const admin = await getSupabaseAdmin()

  const { error } = await admin
    .from("saved_quiz_attempts")
    .delete()
    .eq("user_id", userId)
    .eq("id", attemptId)

  if (error) {
    throw new Error(`Failed to delete quiz attempt: ${error.message}`)
  }

  return { success: true }
}

export type QuizTopicStats = {
  topic: string
  attempts: number
  averagePercentage: number
  bestPercentage: number
  lastAttemptAt: string
}

export async function getQuizTopicStats(userId: string): Promise<QuizTopicStats[]> {
  const admin = await getSupabaseAdmin()

  const { data, error } = await admin
    .from("saved_quiz_attempts")
    .select("topic, percentage, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    const message = error.message?.toLowerCase() || ""
    if (message.includes("saved_quiz_attempts")) return []
    throw new Error(`Failed to load quiz stats: ${error.message}`)
  }

  const byTopic = new Map<string, { percentages: number[]; lastAttemptAt: string }>()

  for (const row of data || []) {
    const existing = byTopic.get(row.topic)
    if (existing) {
      existing.percentages.push(Number(row.percentage))
    } else {
      byTopic.set(row.topic, { percentages: [Number(row.percentage)], lastAttemptAt: row.created_at })
    }
  }

  return Array.from(byTopic.entries())
    .map(([topic, stats]) => ({
      topic,
      attempts: stats.percentages.length,
      averagePercentage: Number(
        (stats.percentages.reduce((sum, value) => sum + value, 0) / stats.percentages.length).toFixed(1)
      ),
      bestPercentage: Math.max(...stats.percentages),
      lastAttemptAt: stats.lastAttemptAt,
    }))
    .sort((a, b) => new Date(b.lastAttemptAt).getTime() - new Date(a.lastAttemptAt).getTime())
}

export type SavedPlannerTask = {
  id: string
  title: string
  time: string
  duration: string
  subject: string
  completed: boolean
  day: number
}

export type SavedStudyPlanRecord = {
  id: string
  user_id: string
  title: string
  goal: string | null
  selected_day: number
  tasks: SavedPlannerTask[]
  created_at: string
  updated_at: string
}

export async function saveStudyPlan(
  userId: string,
  input: {
    planId?: string | null
    title: string
    goal?: string | null
    selectedDay: number
    tasks: SavedPlannerTask[]
  }
) {
  const admin = await getSupabaseAdmin()

  const payload = {
    user_id: userId,
    title: input.title,
    goal: input.goal ?? null,
    selected_day: input.selectedDay,
    tasks: input.tasks,
    updated_at: new Date().toISOString(),
  }

  if (input.planId) {
    const { data, error } = await admin
      .from("saved_study_plans")
      .update(payload)
      .eq("user_id", userId)
      .eq("id", input.planId)
      .select("*")
      .single()

    if (error) {
      throw new Error(`Failed to update study plan: ${error.message}`)
    }

    return data as SavedStudyPlanRecord
  }

  const { data, error } = await admin
    .from("saved_study_plans")
    .insert({
      ...payload,
      created_at: new Date().toISOString(),
    })
    .select("*")
    .single()

  if (error) {
    throw new Error(`Failed to save study plan: ${error.message}`)
  }

  return data as SavedStudyPlanRecord
}

export async function getSavedStudyPlans(userId: string, limit = 12) {
  const admin = await getSupabaseAdmin()

  const { data, error } = await admin
    .from("saved_study_plans")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(limit)

  if (error) {
    const message = error.message?.toLowerCase() || ""
    if (message.includes("saved_study_plans")) {
      return []
    }
    throw new Error(`Failed to load planner history: ${error.message}`)
  }

  return (data || []) as SavedStudyPlanRecord[]
}

export async function getSavedStudyPlanById(userId: string, planId: string) {
  const admin = await getSupabaseAdmin()

  const { data, error } = await admin
    .from("saved_study_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("id", planId)
    .maybeSingle()

  if (error) {
    const message = error.message?.toLowerCase() || ""
    if (message.includes("saved_study_plans")) {
      return null
    }
    throw new Error(`Failed to load study plan: ${error.message}`)
  }

  return (data || null) as SavedStudyPlanRecord | null
}

export async function deleteSavedStudyPlan(userId: string, planId: string) {
  const admin = await getSupabaseAdmin()

  const { error } = await admin
    .from("saved_study_plans")
    .delete()
    .eq("user_id", userId)
    .eq("id", planId)

  if (error) {
    throw new Error(`Failed to delete study plan: ${error.message}`)
  }

  return { success: true }
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export async function createProfile(userId: string, email: string, fullName?: string) {
  const admin = await getSupabaseAdmin()

  const payload = {
    id: userId,
    user_id: userId,
    email,
    full_name: fullName ?? email.split("@")[0],
    avatar_url: null,
    bio: null,
    plan: "free",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const inserted = await admin
    .from("profiles")
    .insert(payload)
    .select("*")
    .single()

  if (!inserted.error) {
    return inserted.data as Profile
  }

  const fallback = await admin
    .from("profiles")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single()

  if (fallback.error) {
    throw new Error(`Profile creation failed: ${fallback.error.message}`)
  }

  return fallback.data as Profile
}

export async function getProfile(userId: string) {
  const admin = await getSupabaseAdmin()

  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) return null
  return data as Profile | null
}

export async function upsertProfile(userId: string, updates: Partial<Profile>) {
  const admin = await getSupabaseAdmin()

  const existingProfile = await getProfile(userId)

  const payload = {
    id: userId,
    user_id: userId,
    email: updates.email ?? existingProfile?.email ?? null,
    full_name: updates.full_name ?? existingProfile?.full_name ?? null,
    avatar_url:
      Object.prototype.hasOwnProperty.call(updates, "avatar_url")
        ? (updates.avatar_url ?? null)
        : (existingProfile?.avatar_url ?? null),
    bio:
      Object.prototype.hasOwnProperty.call(updates, "bio")
        ? (updates.bio ?? null)
        : (existingProfile?.bio ?? null),
    contact:
      Object.prototype.hasOwnProperty.call(updates, "contact")
        ? (updates.contact ?? null)
        : ((existingProfile as any)?.contact ?? null),
    first_name:
      Object.prototype.hasOwnProperty.call(updates, "first_name")
        ? (updates.first_name ?? null)
        : ((existingProfile as any)?.first_name ?? null),
    last_name:
      Object.prototype.hasOwnProperty.call(updates, "last_name")
        ? (updates.last_name ?? null)
        : ((existingProfile as any)?.last_name ?? null),
    role:
      Object.prototype.hasOwnProperty.call(updates, "role")
        ? (updates.role ?? null)
        : ((existingProfile as any)?.role ?? "student"),
    plan:
      Object.prototype.hasOwnProperty.call(updates, "plan")
        ? (updates.plan ?? "free")
        : ((existingProfile as any)?.plan ?? "free"),
    credits:
      Object.prototype.hasOwnProperty.call(updates, "credits")
        ? (updates.credits ?? 50)
        : ((existingProfile as any)?.credits ?? 50),
    created_at: existingProfile?.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await admin
    .from("profiles")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single()

  if (error) {
    throw new Error(`Profile update failed: ${error.message}`)
  }

  return data as Profile
}

// ─── Credits ─────────────────────────────────────────────────────────────────

export async function createCredits(userId: string) {
  const admin = await getSupabaseAdmin()

  const payload = {
    user_id: userId,
    ai_chat_remaining: FREE_CREDIT_VALUES.ai_chat,
    flashcards_remaining: FREE_CREDIT_VALUES.flashcards,
    study_plan_remaining: FREE_CREDIT_VALUES.study_plan,
    created_at: new Date().toISOString(),
  }

  const inserted = await admin
    .from("credits")
    .insert(payload)
    .select("*")
    .single()

  if (!inserted.error) {
    return inserted.data as Credits
  }

  const fallback = await admin
    .from("credits")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single()

  if (fallback.error) {
    throw new Error(`Credits creation failed: ${fallback.error.message}`)
  }

  return fallback.data as Credits
}

export async function getCredits(userId: string) {
  const admin = await getSupabaseAdmin()

  const { data, error } = await admin
    .from("credits")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) return null
  return data as Credits | null
}

export async function deductCredit(userId: string, feature: FeatureKey): Promise<boolean> {
  const admin = await getSupabaseAdmin()

  // Atomic, conditional decrement via the deduct_credit() SQL function.
  // The DB-side WHERE <col> > 0 guard makes concurrent calls on the last credit
  // resolve to exactly one success and one failure (no read-then-write race).
  const { data, error } = await admin.rpc("deduct_credit", {
    p_user_id: userId,
    p_feature: feature,
  })

  if (error) {
    console.error("[deductCredit] RPC error:", error.message)
    return false
  }

  return data === true
}

export async function refillCreditsForTrial(userId: string) {
  const admin = await getSupabaseAdmin()

  const { error } = await admin
    .from("credits")
    .update({
      ai_chat_remaining: 9999,
      flashcards_remaining: 9999,
      study_plan_remaining: 9999,
    })
    .eq("user_id", userId)

  if (error) {
    throw new Error(`Credits refill failed: ${error.message}`)
  }
}

// ─── Subscription ─────────────────────────────────────────────────────────────

export async function createSubscription(userId: string) {
  const admin = await getSupabaseAdmin()
  const now = new Date().toISOString()

  const payload = {
    user_id: userId,
    plan: "free",
    plan_id: "free",
    status: "free",
    credits: 0,
    start_date: null,
    end_date: null,
    current_period_end: null,
    trial_active: false,
    trial_start: null,
    trial_expiry: null,
    subscription_start: null,
    subscription_end: null,
    created_at: now,
    updated_at: now,
  }

  const inserted = await admin
    .from("subscriptions")
    .insert(payload)
    .select("*")
    .single()

  if (!inserted.error) {
    return inserted.data as Subscription
  }

  const fallback = await admin
    .from("subscriptions")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single()

  if (fallback.error) {
    throw new Error(`Subscription creation failed: ${fallback.error.message}`)
  }

  return fallback.data as Subscription
}

export async function getLatestPaidPlan(userId: string): Promise<"pro" | "premium" | "free"> {
  const admin = await getSupabaseAdmin()

  const { data, error } = await admin
    .from("payments")
    .select("plan_id,status,created_at")
    .eq("user_id", userId)
    .eq("status", "captured")
    .order("created_at", { ascending: false })
    .limit(1)

  if (error || !data || data.length === 0) return "free"

  const planId = data[0]?.plan_id
  return planId === "pro" || planId === "premium" ? planId : "free"
}

function getPlanRank(planId: string | null | undefined) {
  if (planId === "premium") return 2
  if (planId === "pro") return 1
  return 0
}

async function syncSubscriptionPlanFromPayments(userId: string, planId: "free" | "pro" | "premium") {
  const admin = await getSupabaseAdmin()
  const now = new Date()
  const nowIso = now.toISOString()
  const expiry = new Date(now)
  expiry.setDate(expiry.getDate() + 14)

  const payload = {
    user_id: userId,
    plan: planId,
    plan_id: planId,
    status: planId === "free" ? "free" : "trial",
    credits: 0,
    start_date: planId === "free" ? null : nowIso,
    end_date: null,
    current_period_end: planId === "free" ? null : expiry.toISOString(),
    trial_active: planId !== "free",
    trial_start: planId === "free" ? null : nowIso,
    trial_expiry: planId === "free" ? null : expiry.toISOString(),
    subscription_start: planId === "free" ? null : nowIso,
    subscription_end: null,
    updated_at: nowIso,
  }

  const existing = await admin
    .from("subscriptions")
    .select("id,user_id")
    .eq("user_id", userId)
    .maybeSingle()

  if (existing.data?.id) {
    const { data, error } = await admin
      .from("subscriptions")
      .update(payload)
      .eq("user_id", userId)
      .select("*")
      .single()

    if (error) {
      throw new Error(`Subscription update failed: ${error.message}`)
    }

    return data as Subscription
  }

  const { data, error } = await admin
    .from("subscriptions")
    .insert({
      ...payload,
      created_at: nowIso,
    })
    .select("*")
    .single()

  if (!error) {
    return data as Subscription
  }

  const fallback = await admin
    .from("subscriptions")
    .upsert(
      {
        ...payload,
        created_at: nowIso,
      },
      { onConflict: "user_id" }
    )
    .select("*")
    .single()

  if (fallback.error) {
    throw new Error(`Subscription sync failed: ${fallback.error.message}`)
  }

  return fallback.data as Subscription
}

export async function activatePlanSubscription(userId: string, planId: "pro" | "premium") {
  return syncSubscriptionPlanFromPayments(userId, planId)
}

export async function getSubscription(userId: string) {
  const admin = await getSupabaseAdmin()

  const { data, error } = await admin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  const latestPaidPlan = await getLatestPaidPlan(userId)

  if (error || !data) {
    if (latestPaidPlan !== "free") {
      return await syncSubscriptionPlanFromPayments(userId, latestPaidPlan)
    }
    return null
  }

  const currentPlan = (data as Record<string, unknown>).plan_id as string | null | undefined

  if (getPlanRank(latestPaidPlan) > getPlanRank(currentPlan)) {
    return await syncSubscriptionPlanFromPayments(userId, latestPaidPlan)
  }

  if (currentPlan === "pro" || currentPlan === "premium" || currentPlan === "free") {
    return data as Subscription
  }

  return {
    ...(data as Record<string, unknown>),
    plan_id: latestPaidPlan,
    plan: latestPaidPlan,
  } as Subscription
}

export async function activateTrial(userId: string, planId: "pro" | "premium") {
  return activatePlanSubscription(userId, planId)
}

export async function isTrialActive(userId: string): Promise<boolean> {
  const sub = await getSubscription(userId)

  if (!sub || !sub.trial_active || !sub.trial_expiry) {
    return false
  }

  return new Date(sub.trial_expiry) > new Date()
}

export type UsageLogRecord = {
  id: string
  user_id: string
  feature: string
  metadata: Record<string, unknown> | null
  created_at: string
}

export async function getRecentUsageLogs(userId: string, limit = 20) {
  try {
    const admin = await getSupabaseAdmin()

    const { data, error } = await admin
      .from("usage_logs")
      .select("id, user_id, feature, metadata, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to load usage logs: ${error.message}`)
    }

    return (data || []) as UsageLogRecord[]
  } catch {
    return []
  }
}

// ─── Usage Logs ──────────────────────────────────────────────────────────────

export async function logUsage(
  userId: string,
  feature: string,
  action: string,
  metadata?: Record<string, unknown>
) {
  try {
    const admin = await getSupabaseAdmin()

    await admin.from("usage_logs").insert({
      user_id: userId,
      feature,
      metadata: {
        action,
        ...(metadata ?? {}),
      },
      created_at: new Date().toISOString(),
    })
  } catch {
    // silent
  }
}

// ─── Payments ────────────────────────────────────────────────────────────────

export async function createPaymentRecord(
  userId: string,
  razorpayOrderId: string,
  amount: number,
  planId: string
) {
  const admin = await getSupabaseAdmin()

  const primaryInsert = await admin
    .from("payments")
    .insert({
      user_id: userId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: null,
      razorpay_signature: null,
      amount,
      currency: "INR",
      status: "created",
      plan_id: planId,
      refunded: false,
      updated_at: new Date().toISOString(),
      provider: "razorpay",
    })
    .select("*")
    .single()

  if (!primaryInsert.error) {
    return primaryInsert.data
  }

  const fallbackInsert = await admin
    .from("payments")
    .insert({
      user_id: userId,
      amount,
      currency: "INR",
      status: "created",
      plan_id: planId,
      provider: `razorpay:${razorpayOrderId}`,
      created_at: new Date().toISOString(),
    })
    .select("*")
    .single()

  if (fallbackInsert.error) {
    throw new Error(`Payment record creation failed: ${fallbackInsert.error.message}`)
  }

  return fallbackInsert.data
}

export async function updatePaymentRecord(
  razorpayOrderId: string,
  updates: {
    razorpay_payment_id?: string
    razorpay_signature?: string
    status?: "captured" | "failed" | "refunded"
    refunded?: boolean
  }
) {
  const admin = await getSupabaseAdmin()

  const primaryUpdate = await admin
    .from("payments")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("razorpay_order_id", razorpayOrderId)

  if (!primaryUpdate.error) {
    return
  }

  const fallbackPayload: Record<string, unknown> = {
    status: updates.status,
    refunded: updates.refunded,
    provider: updates.razorpay_payment_id
      ? `razorpay:${razorpayOrderId}:${updates.razorpay_payment_id}`
      : `razorpay:${razorpayOrderId}`,
    updated_at: new Date().toISOString(),
  }

  const fallbackUpdate = await admin
    .from("payments")
    .update(fallbackPayload)
    .eq("provider", `razorpay:${razorpayOrderId}`)

  if (fallbackUpdate.error) {
    throw new Error(`Payment update failed: ${fallbackUpdate.error.message}`)
  }
}


// ─── Saved Notes ─────────────────────────────────────────────────────────────

function isMissingColumnError(message?: string | null) {
  if (!message) return false

  return (
    message.includes("schema cache") ||
    message.includes("Could not find the") ||
    message.includes("column") ||
    message.includes("does not exist")
  )
}

export async function saveGeneratedNote(
  userId: string,
  payload: {
    sourceType: string
    sourceTitle: string
    sourceLabel?: string | null
    sourceHint?: string | null
    tabs: SavedNoteTab[]
  }
) {
  const admin = await getSupabaseAdmin()
  const now = new Date().toISOString()

  const attempts = [
    {
      user_id: userId,
      source_type: payload.sourceType,
      source_title: payload.sourceTitle,
      source_label: payload.sourceLabel ?? null,
      source_hint: payload.sourceHint ?? null,
      tabs: payload.tabs,
      created_at: now,
      updated_at: now,
    },
    {
      user_id: userId,
      source_type: payload.sourceType,
      source_title: payload.sourceTitle,
      tabs: payload.tabs,
      created_at: now,
      updated_at: now,
    },
    {
      user_id: userId,
      source_type: payload.sourceType,
      tabs: payload.tabs,
      created_at: now,
      updated_at: now,
    },
    {
      user_id: userId,
      source_type: payload.sourceType,
      tabs: payload.tabs,
    },
  ]

  let lastError: string | null = null

  for (const insertPayload of attempts) {
    const { data, error } = await admin
      .from("saved_notes")
      .insert(insertPayload)
      .select("*")
      .single()

    if (!error) {
      return data as SavedNoteRecord
    }

    lastError = error.message

    if (!isMissingColumnError(error.message)) {
      throw new Error(`Saved note creation failed: ${error.message}`)
    }
  }

  throw new Error(`Saved note creation failed: ${lastError ?? "Unknown database error"}`)
}

export async function getSavedNoteById(userId: string, noteId: string) {
  const admin = await getSupabaseAdmin()

  const { data, error } = await admin
    .from("saved_notes")
    .select("*")
    .eq("user_id", userId)
    .eq("id", noteId)
    .maybeSingle()

  if (error) return null
  return data as SavedNoteRecord | null
}

export async function getSavedNotes(userId: string, limit = 5) {
  const admin = await getSupabaseAdmin()

  const { data, error } = await admin
    .from("saved_notes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) return []
  return (data || []) as SavedNoteRecord[]
}

export async function deleteSavedNote(userId: string, noteId: string) {
  const admin = await getSupabaseAdmin()

  const { error } = await admin
    .from("saved_notes")
    .delete()
    .eq("user_id", userId)
    .eq("id", noteId)

  if (error) {
    throw new Error(`Failed to delete note: ${error.message}`)
  }

  return { success: true }
}

// ─── Shared note/chat content resolution (for AI features built on top of
// existing notes or chat sessions, e.g. flashcards, concept maps) ────────────

export type StudySourceType = "note" | "chat"

export async function resolveStudySourceContent(
  userId: string,
  sourceType: StudySourceType,
  sourceId: string
): Promise<{ title: string; content: string } | null> {
  if (sourceType === "note") {
    const note = await getSavedNoteById(userId, sourceId)
    if (!note) return null

    const content = note.tabs.map((tab) => `${tab.title}\n${tab.content}`).join("\n\n")
    return { title: note.source_title, content }
  }

  const admin = await getSupabaseAdmin()
  const { data: messages, error } = await admin
    .from("chat_messages")
    .select("role, content")
    .eq("session_id", sourceId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true })

  if (error || !messages?.length) return null

  const content = messages.map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.content}`).join("\n\n")

  const { data: session } = await admin
    .from("chat_sessions")
    .select("title, topic")
    .eq("id", sourceId)
    .eq("user_id", userId)
    .maybeSingle()

  return { title: session?.title || session?.topic || "Chat Session", content }
}

// ─── Concept Maps ─────────────────────────────────────────────────────────────

export type ConceptMapNode = {
  id: string
  label: string
  excerpt: string
}

export type ConceptMapEdge = {
  id: string
  source: string
  target: string
  label?: string
}

export type SavedConceptMapRecord = {
  id: string
  user_id: string
  title: string
  source_type: StudySourceType
  source_id: string
  nodes: ConceptMapNode[]
  edges: ConceptMapEdge[]
  created_at: string
  updated_at: string
}

export async function saveConceptMap(
  userId: string,
  input: {
    title: string
    sourceType: StudySourceType
    sourceId: string
    nodes: ConceptMapNode[]
    edges: ConceptMapEdge[]
  }
) {
  const admin = await getSupabaseAdmin()

  const payload = {
    user_id: userId,
    title: input.title,
    source_type: input.sourceType,
    source_id: input.sourceId,
    nodes: input.nodes,
    edges: input.edges,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await admin
    .from("concept_maps")
    .insert(payload)
    .select("*")
    .single()

  if (error) {
    throw new Error(`Failed to save concept map: ${error.message}`)
  }

  return data as SavedConceptMapRecord
}

export async function getSavedConceptMaps(userId: string, limit = 12) {
  const admin = await getSupabaseAdmin()

  const { data, error } = await admin
    .from("concept_maps")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    const message = error.message?.toLowerCase() || ""
    if (message.includes("concept_maps")) return []
    throw new Error(`Failed to load concept map history: ${error.message}`)
  }

  return (data || []) as SavedConceptMapRecord[]
}

export async function getSavedConceptMapById(userId: string, mapId: string) {
  const admin = await getSupabaseAdmin()

  const { data, error } = await admin
    .from("concept_maps")
    .select("*")
    .eq("user_id", userId)
    .eq("id", mapId)
    .maybeSingle()

  if (error) {
    const message = error.message?.toLowerCase() || ""
    if (message.includes("concept_maps")) return null
    throw new Error(`Failed to load concept map: ${error.message}`)
  }

  return (data || null) as SavedConceptMapRecord | null
}

export async function deleteSavedConceptMap(userId: string, mapId: string) {
  const admin = await getSupabaseAdmin()

  const { error } = await admin
    .from("concept_maps")
    .delete()
    .eq("user_id", userId)
    .eq("id", mapId)

  if (error) {
    throw new Error(`Failed to delete concept map: ${error.message}`)
  }

  return { success: true }
}

// ─── Topic Analysis History ──────────────────────────────────────────────────

export type TopicAnalysisHistoryRecord = {
  id: string
  user_id: string
  topic: string
  analysis_json: any
  created_at: string
}

export async function getTopicAnalysisHistory(userId: string, limit = 15) {
  const admin = await getSupabaseAdmin()

  const { data, error } = await admin
    .from("topic_analysis_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    const message = error.message?.toLowerCase() || ""
    if (message.includes("topic_analysis_history")) return []
    throw new Error(`Failed to load topic analysis history: ${error.message}`)
  }

  return (data || []) as TopicAnalysisHistoryRecord[]
}

export async function getTopicAnalysisById(userId: string, analysisId: string) {
  const admin = await getSupabaseAdmin()

  const { data, error } = await admin
    .from("topic_analysis_history")
    .select("*")
    .eq("user_id", userId)
    .eq("id", analysisId)
    .maybeSingle()

  if (error) {
    const message = error.message?.toLowerCase() || ""
    if (message.includes("topic_analysis_history")) return null
    throw new Error(`Failed to load topic analysis: ${error.message}`)
  }

  return (data || null) as TopicAnalysisHistoryRecord | null
}

export async function saveTopicAnalysis(userId: string, topic: string, analysisJson: any) {
  const admin = await getSupabaseAdmin()

  const payload = {
    user_id: userId,
    topic,
    analysis_json: analysisJson,
    created_at: new Date().toISOString(),
  }

  const { data, error } = await admin
    .from("topic_analysis_history")
    .insert(payload)
    .select("*")
    .single()

  if (error) {
    throw new Error(`Failed to save topic analysis: ${error.message}`)
  }

  return data as TopicAnalysisHistoryRecord
}

export async function deleteTopicAnalysis(userId: string, analysisId: string) {
  const admin = await getSupabaseAdmin()

  const { error } = await admin
    .from("topic_analysis_history")
    .delete()
    .eq("user_id", userId)
    .eq("id", analysisId)

  if (error) {
    throw new Error(`Failed to delete topic analysis: ${error.message}`)
  }

  return { success: true }
}