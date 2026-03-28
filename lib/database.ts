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

export type SavedFlashcard = {
  front: string
  back: string
}

export type SavedFlashcardSetRecord = {
  id: string
  user_id: string
  topic: string
  card_count: number
  cards: SavedFlashcard[]
  created_at: string
  updated_at: string
}

export async function saveFlashcardSet(
  userId: string,
  input: {
    topic: string
    cards: SavedFlashcard[]
  }
) {
  const admin = await getSupabaseAdmin()

  const payload = {
    user_id: userId,
    topic: input.topic,
    card_count: input.cards.length,
    cards: input.cards,
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

export type SavedQuizQuestion = {
  id: string
  question: string
  options: SavedQuizOption[]
  correctOptionId: string
  explanation?: string | null
}

export type SavedQuizAnswer = {
  questionId: string
  selectedOptionId: string | null
  isCorrect: boolean
}

export type SavedQuizAttemptRecord = {
  id: string
  user_id: string
  topic: string
  total_questions: number
  score: number
  percentage: number
  questions: SavedQuizQuestion[]
  answers: SavedQuizAnswer[]
  created_at: string
  updated_at: string
}

export async function saveQuizAttempt(
  userId: string,
  input: {
    topic: string
    questions: SavedQuizQuestion[]
    answers: SavedQuizAnswer[]
    score: number
    totalQuestions: number
    percentage: number
  }
) {
  const admin = await getSupabaseAdmin()

  const payload = {
    user_id: userId,
    topic: input.topic,
    total_questions: input.totalQuestions,
    score: input.score,
    percentage: input.percentage,
    questions: input.questions,
    answers: input.answers,
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
  const credits = await getCredits(userId)

  if (!credits) return false

  const remainingKey = `${feature}_remaining` as keyof Credits
  const remaining = Number(credits[remainingKey] ?? 0)

  if (remaining <= 0) return false

  const { error } = await admin
    .from("credits")
    .update({
      [remainingKey]: remaining - 1,
    })
    .eq("user_id", userId)

  return !error
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