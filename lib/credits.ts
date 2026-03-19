import { getCredits, getSubscription, deductCredit, isTrialActive } from "@/lib/database"
import type { FeatureKey } from "@/types"

export interface CreditCheckResult {
  allowed: boolean
  reason?: "no_credits" | "trial_active" | "has_credits" | "unlimited"
  remaining: number
}

/**
 * Check if a user can use a feature and deduct a credit.
 * Returns whether the action is allowed.
 */
export async function consumeCredit(
  userId: string,
  feature: FeatureKey
): Promise<CreditCheckResult> {
  // Trial users get unlimited access
  const trialActive = await isTrialActive(userId)
  if (trialActive) {
    return { allowed: true, reason: "trial_active", remaining: 9999 }
  }

  const credits = await getCredits(userId)
  if (!credits) return { allowed: false, reason: "no_credits", remaining: 0 }

  const remainingKey = `${feature}_remaining` as keyof typeof credits
  const remaining = credits[remainingKey] as number

  if (remaining <= 0) {
    return { allowed: false, reason: "no_credits", remaining: 0 }
  }

  const deducted = await deductCredit(userId, feature)
  if (!deducted) return { allowed: false, reason: "no_credits", remaining: 0 }

  return { allowed: true, reason: "has_credits", remaining: remaining - 1 }
}

/**
 * Check remaining credits without deducting.
 */
export async function checkCredits(
  userId: string,
  feature: FeatureKey
): Promise<{ remaining: number; trialActive: boolean }> {
  const trialActive = await isTrialActive(userId)
  if (trialActive) return { remaining: 9999, trialActive: true }

  const credits = await getCredits(userId)
  if (!credits) return { remaining: 0, trialActive: false }

  const remainingKey = `${feature}_remaining` as keyof typeof credits
  return {
    remaining: credits[remainingKey] as number,
    trialActive: false,
  }
}
