import { getSupabaseAdmin } from "@/lib/supabase-server"
import type { Credits, Subscription, Profile, FeatureKey } from "@/types"

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
      ai_chat_remaining: 20,
      ai_chat_used: 0,
      flashcards_remaining: 20,
      flashcards_used: 0,
      study_plan_remaining: 20,
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
  const { data, error } = await admin
    .from("subscriptions")
    .insert({
      user_id: userId,
      status: "free",
      plan_id: "free",
      trial_active: false,
      trial_start: null,
      trial_expiry: null,
      subscription_start: null,
      subscription_end: null,
    })
    .select()
    .single()

  if (error) throw new Error(`Subscription creation failed: ${error.message}`)
  return data as Subscription
}

export async function getSubscription(userId: string) {
  const admin = await getSupabaseAdmin()
  const { data, error } = await admin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (error) return null
  return data as Subscription
}

export async function activateTrial(userId: string) {
  const admin = await getSupabaseAdmin()
  const now = new Date()
  const expiry = new Date(now)
  expiry.setDate(expiry.getDate() + 14)

  const { data, error } = await admin
    .from("subscriptions")
    .update({
      status: "trial",
      trial_active: true,
      trial_start: now.toISOString(),
      trial_expiry: expiry.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("user_id", userId)
    .select()
    .single()

  if (error) throw new Error(`Trial activation failed: ${error.message}`)
  return data as Subscription
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
