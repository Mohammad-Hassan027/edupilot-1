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


// ─── Profile ─────────────────────────────────────────────────────────────────

export async function createProfile(userId: string, email: string, fullName?: string) {
  const admin = await getSupabaseAdmin()
  const { data, error } = await admin
    .from("profiles")
    .insert({
      user_id: userId,
      full_name: fullName ?? email.split("@")[0],
      avatar_url: null,
      bio: null,
    })
    .select()
    .single()

  if (error) throw new Error(`Profile creation failed: ${error.message}`)
  return data as Profile
}

export async function getProfile(userId: string) {
  const admin = await getSupabaseAdmin()
  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (error) return null
  return data as Profile
}

export async function upsertProfile(userId: string, updates: Partial<Profile>) {
  const admin = await getSupabaseAdmin()
  const { data, error } = await admin
    .from("profiles")
    .upsert({ user_id: userId, ...updates, updated_at: new Date().toISOString() })
    .select()
    .single()

  if (error) throw new Error(`Profile update failed: ${error.message}`)
  return data as Profile
}

// ─── Credits ─────────────────────────────────────────────────────────────────

export async function createCredits(userId: string) {
  const admin = await getSupabaseAdmin()
  const { data, error } = await admin
    .from("credits")
    .insert({
      user_id: userId,
      ai_chat_remaining: FREE_CREDIT_VALUES.ai_chat,
      ai_chat_used: 0,
      flashcards_remaining: FREE_CREDIT_VALUES.flashcards,
      flashcards_used: 0,
      study_plan_remaining: FREE_CREDIT_VALUES.study_plan,
      study_plan_used: 0,
    })
    .select()
    .single()

  if (error) throw new Error(`Credits creation failed: ${error.message}`)
  return data as Credits
}

export async function getCredits(userId: string) {
  const admin = await getSupabaseAdmin()
  const { data, error } = await admin
    .from("credits")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (error) return null
  return data as Credits
}

export async function deductCredit(userId: string, feature: FeatureKey): Promise<boolean> {
  const admin = await getSupabaseAdmin()
  const credits = await getCredits(userId)
  if (!credits) return false

  const remainingKey = `${feature}_remaining` as keyof Credits
  const usedKey = `${feature}_used` as keyof Credits

  const remaining = credits[remainingKey] as number
  if (remaining <= 0) return false

  const { error } = await admin
    .from("credits")
    .update({
      [remainingKey]: remaining - 1,
      [usedKey]: (credits[usedKey] as number) + 1,
      updated_at: new Date().toISOString(),
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
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)

  if (error) throw new Error(`Credits refill failed: ${error.message}`)
}

// ─── Subscription ─────────────────────────────────────────────────────────────

export async function createSubscription(userId: string) {
  const admin = await getSupabaseAdmin()
  const baseRecord = {
    user_id: userId,
    status: "free",
    trial_active: false,
    trial_start: null,
    trial_expiry: null,
    subscription_start: null,
    subscription_end: null,
  }

  let data: unknown = null
  let error: { message: string } | null = null

  const withPlan = await admin
    .from("subscriptions")
    .insert({ ...baseRecord, plan_id: "free" })
    .select()
    .single()

  data = withPlan.data
  error = withPlan.error

  if (error?.message?.includes("plan_id")) {
    const legacyInsert = await admin
      .from("subscriptions")
      .insert(baseRecord)
      .select()
      .maybeSingle()

    data = legacyInsert.data
    error = legacyInsert.error
  }

  if (error) throw new Error(`Subscription creation failed: ${error.message}`)
  return { ...((data as Record<string, unknown>) ?? {}), plan_id: "free" } as Subscription
}

export async function getLatestPaidPayment(userId: string): Promise<{ plan_id: "pro" | "premium"; created_at: string } | null> {
  const admin = await getSupabaseAdmin()
  const { data, error } = await admin
    .from("payments")
    .select("plan_id,status,created_at")
    .eq("user_id", userId)
    .in("status", ["captured", "refunded"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  if (data.plan_id !== "pro" && data.plan_id !== "premium") return null

  return {
    plan_id: data.plan_id,
    created_at: data.created_at,
  }
}

export async function getLatestPaidPlan(userId: string): Promise<"pro" | "premium" | "free"> {
  const latestPayment = await getLatestPaidPayment(userId)
  return latestPayment?.plan_id ?? "free"
}

export async function getSubscription(userId: string) {
  const admin = await getSupabaseAdmin()
  const { data, error } = await admin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  const latestPayment = await getLatestPaidPayment(userId)
  const now = Date.now()
  const fallbackTrialExpiry = latestPayment
    ? new Date(new Date(latestPayment.created_at).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()
    : null
  const fallbackTrialActive = Boolean(fallbackTrialExpiry && new Date(fallbackTrialExpiry).getTime() > now)

  if (error && !data) return null
  if (!data) {
    if (!latestPayment) return null
    return {
      id: "legacy-fallback",
      user_id: userId,
      status: fallbackTrialActive ? "trial" : "active",
      plan_id: latestPayment.plan_id,
      trial_active: fallbackTrialActive,
      trial_start: latestPayment.created_at,
      trial_expiry: fallbackTrialExpiry,
      subscription_start: latestPayment.created_at,
      subscription_end: null,
      created_at: latestPayment.created_at,
      updated_at: latestPayment.created_at,
    } as Subscription
  }

  const record = data as Record<string, unknown>
  const planId = record.plan_id
  if (planId === "pro" || planId === "premium" || planId === "free") {
    return data as Subscription
  }

  if (!latestPayment) {
    return { ...data, plan_id: "free" } as Subscription
  }

  return {
    ...data,
    plan_id: latestPayment.plan_id,
    status: (record.status as Subscription["status"] | null) ?? (fallbackTrialActive ? "trial" : "active"),
    trial_active: typeof record.trial_active === "boolean" ? record.trial_active : fallbackTrialActive,
    trial_start: (record.trial_start as string | null) ?? latestPayment.created_at,
    trial_expiry: (record.trial_expiry as string | null) ?? fallbackTrialExpiry,
    subscription_start: (record.subscription_start as string | null) ?? latestPayment.created_at,
    subscription_end: (record.subscription_end as string | null) ?? null,
  } as Subscription
}

export async function activateTrial(userId: string, planId: "pro" | "premium") {
  const admin = await getSupabaseAdmin()
  const now = new Date()
  const expiry = new Date(now)
  expiry.setDate(expiry.getDate() + 14)

  const baseUpdates = {
    status: "trial",
    trial_active: true,
    trial_start: now.toISOString(),
    trial_expiry: expiry.toISOString(),
    updated_at: now.toISOString(),
  }

  let data: unknown = null
  let error: { message: string } | null = null

  const attemptWithPlan = await admin
    .from("subscriptions")
    .update({
      ...baseUpdates,
      plan_id: planId,
    })
    .eq("user_id", userId)
    .select()
    .maybeSingle()

  data = attemptWithPlan.data
  error = attemptWithPlan.error

  if (error?.message?.includes("plan_id")) {
    const legacyAttempt = await admin
      .from("subscriptions")
      .update(baseUpdates)
      .eq("user_id", userId)
      .select()
      .single()

    data = legacyAttempt.data
    error = legacyAttempt.error
  }

  if (!error && !data) {
    await createSubscription(userId)

    const retry = await admin
      .from("subscriptions")
      .update({
        ...baseUpdates,
        plan_id: planId,
      })
      .eq("user_id", userId)
      .select()
      .maybeSingle()

    data = retry.data
    error = retry.error

    if (error?.message?.includes("plan_id")) {
      const legacyRetry = await admin
        .from("subscriptions")
        .update(baseUpdates)
        .eq("user_id", userId)
        .select()
        .maybeSingle()

      data = legacyRetry.data
      error = legacyRetry.error
    }
  }

  if (error) throw new Error(`Trial activation failed: ${error.message}`)

  return { ...((data as Record<string, unknown>) ?? {}), plan_id: planId } as Subscription
}

export async function isTrialActive(userId: string): Promise<boolean> {
  const sub = await getSubscription(userId)
  if (!sub || !sub.trial_active || !sub.trial_expiry) return false
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
      action,
      metadata: metadata ?? null,
      created_at: new Date().toISOString(),
    })
  } catch {
    // Non-throwing — log failures are silent
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
  const { data, error } = await admin
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
    })
    .select()
    .single()

  if (error) throw new Error(`Payment record creation failed: ${error.message}`)
  return data
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
  const { error } = await admin
    .from("payments")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("razorpay_order_id", razorpayOrderId)

  if (error) throw new Error(`Payment update failed: ${error.message}`)
}


// ─── Saved Notes ───────────────────────────────────────────────────────────
// ─── Saved Notes ───────────────────────────────────────────────────────────

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
    .single()

  if (error) return null
  return data as SavedNoteRecord
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