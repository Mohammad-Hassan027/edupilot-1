export type PaidPlanId = "pro" | "premium"
export type PlanId = "free" | PaidPlanId

export interface LearningPlan {
  id: PlanId
  name: string
  price: number
  period: string
  description: string
  features: string[]
  limitations?: string[]
  popular?: boolean
  cta: string
}

export const LEARNING_PLANS: LearningPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "forever",
    description: "Best for exploring EduPilot",
    features: [
      "Unlimited AI Tutor",
      "Unlimited Notes",
    ],
    limitations: [
      "No Study Planner",
      "No Analytics",
      "No Voice Assistant",
      "No AI Flashcards",
      "No AI Quiz",
    ],
    cta: "Current Plan",
  },
  {
    id: "pro",
    name: "Pro",
    price: 199,
    period: "/mo",
    description: "Unlock Flashcards and AI Voice",
    features: [
      "14-day free trial",
      "Unlimited AI Tutor",
      "Unlimited Notes",
      "Unlimited Flashcards",
      "Unlimited AI Voice",
    ],
    limitations: ["Planner not included"],
    popular: true,
    cta: "Start 14-Day Trial",
  },
  {
    id: "premium",
    name: "Premium",
    price: 499,
    period: "/mo",
    description: "Everything included",
    features: [
      "14-day free trial",
      "Unlimited AI Tutor",
      "Unlimited Notes",
      "Unlimited Flashcards",
      "Unlimited AI Voice",
      "Unlimited Quiz",
      "Study Planner included",
    ],
    cta: "Start 14-Day Trial",
  },
]

export function getPlanById(planId: string | null | undefined) {
  return LEARNING_PLANS.find((plan) => plan.id === planId) ?? LEARNING_PLANS[0]
}

export type FeatureAccessLevel = "free" | "pro" | "premium"

export function hasPaidAccess(subscription: {
  status?: string | null
  plan_id?: string | null
  trial_active?: boolean | null
  trial_expiry?: string | null
  subscription_end?: string | null
} | null | undefined) {
  if (!subscription) return false

  const now = Date.now()
  const hasLiveTrial = Boolean(
    subscription.trial_active &&
      subscription.trial_expiry &&
      new Date(subscription.trial_expiry).getTime() > now &&
      (subscription.plan_id === "pro" || subscription.plan_id === "premium")
  )

  const hasActiveSubscription = Boolean(
    subscription.status === "active" &&
      (subscription.plan_id === "pro" || subscription.plan_id === "premium") &&
      (!subscription.subscription_end || new Date(subscription.subscription_end).getTime() > now)
  )

  return hasLiveTrial || hasActiveSubscription
}


export function hasProAccess(subscription: {
  status?: string | null
  plan_id?: string | null
  trial_active?: boolean | null
  trial_expiry?: string | null
  subscription_end?: string | null
} | null | undefined) {
  return hasPaidAccess(subscription)
}

export function hasPremiumAccess(subscription: {
  status?: string | null
  plan_id?: string | null
  trial_active?: boolean | null
  trial_expiry?: string | null
  subscription_end?: string | null
} | null | undefined) {
  if (!subscription) return false

  const now = Date.now()
  const hasLivePremiumTrial = Boolean(
    subscription.plan_id === "premium" &&
    subscription.trial_active &&
    subscription.trial_expiry &&
    new Date(subscription.trial_expiry).getTime() > now
  )

  const hasActivePremiumSubscription = Boolean(
    subscription.plan_id === "premium" &&
    subscription.status === "active" &&
    (!subscription.subscription_end || new Date(subscription.subscription_end).getTime() > now)
  )

  return hasLivePremiumTrial || hasActivePremiumSubscription
}

export function canAccessFeature(
  subscription: {
    status?: string | null
    plan_id?: string | null
    trial_active?: boolean | null
    trial_expiry?: string | null
    subscription_end?: string | null
  } | null | undefined,
  feature: "flashcards" | "ai_voice" | "quiz" | "planner"
) {
  if (feature === "flashcards" || feature === "ai_voice") {
    return hasProAccess(subscription)
  }

  if (feature === "quiz") {
    return hasPremiumAccess(subscription)
  }

  if (feature === "planner") {
    return hasPremiumAccess(subscription)
  }

  return false
}
