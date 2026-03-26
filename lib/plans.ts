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
    description: "Everything unlimited, excluding Study Planner",
    features: [
      "14-day free trial",
      "Unlimited AI Tutor",
      "Unlimited Notes",
      "Unlimited Flashcards",
      "Unlimited Quiz",
      "Unlimited AI Voice",
      "Analytics included",
    ],
    limitations: ["Study Planner not included"],
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
      "Unlimited Quiz",
      "Unlimited AI Voice",
      "Study Planner included",
      "Analytics included",
    ],
    cta: "Start 14-Day Trial",
  },
]

export function getPlanById(planId: string | null | undefined) {
  return LEARNING_PLANS.find((plan) => plan.id === planId) ?? LEARNING_PLANS[0]
}

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
