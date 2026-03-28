"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Check, Sparkles, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PaymentModal } from "@/components/billing/payment-modal"
import { useUser } from "@/hooks/use-user"
import { LEARNING_PLANS, type LearningPlan } from "@/lib/plans"
import { cn } from "@/lib/utils"

const faqs = [
  {
    question: "Can I change plans later?",
    answer: "Yes, you can upgrade later. Free users can move to Pro, and Pro users can move to Premium.",
  },
  {
    question: "Do Pro and Premium include a free trial?",
    answer: "Yes. Both paid plans start with a 14-day free trial, and in test mode only ₹1 is charged for account verification.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept Razorpay-supported test payments including cards, UPI, and net banking in test mode.",
  },
  {
    question: "When does the plan activate?",
    answer: "As soon as Razorpay reports a successful ₹1 verification payment, the selected plan is activated across the app.",
  },
]

const featureLabels: Record<string, string> = {
  flashcards: "Flashcards",
  "ai-voice": "AI Voice",
  ai_voice: "AI Voice",
  quiz: "Quiz",
  planner: "Planner",
}

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly")
  const [selectedPlan, setSelectedPlan] = useState<LearningPlan | null>(null)
  const searchParams = useSearchParams()
  const requestedPlan = searchParams.get("plan")
  const requestedFeature = searchParams.get("feature")
  const { user, subscription, refetch, isLoading } = useUser()

  const currentPlanName = subscription?.plan_id === "premium" ? "Premium" : subscription?.plan_id === "pro" ? "Pro" : "Free"
  const featureLabel = requestedFeature ? featureLabels[requestedFeature] ?? requestedFeature : null

  const paidPlans = useMemo(() => LEARNING_PLANS.filter((plan) => plan.id !== "free"), [])

  return (
    <div className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-8 max-w-3xl rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
          <h2 className="mb-2 text-xl font-semibold text-foreground">Choose Your Learning Plan</h2>
          <p className="text-muted-foreground">
            Free users get AI Tutor and Notes. Pro unlocks Flashcards and AI Voice. Premium unlocks Quiz and Planner, plus all Pro features.
          </p>
          {featureLabel ? (
            <p className="mt-3 text-sm text-foreground">
              You came here to unlock <span className="font-semibold">{featureLabel}</span>.
            </p>
          ) : null}
          {user && currentPlanName !== "Free" ? (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-foreground">
              <Crown className="h-4 w-4 text-emerald-500" />
              Active plan: <span className="font-semibold">{currentPlanName}</span>
            </div>
          ) : null}
        </div>

        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">Pricing for every learner</h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Select a plan and complete the ₹1 Razorpay verification payment to activate.<br/>AFTER CLICKING ON “ACTIVATE ANY PLAN”, PLEASE WAIT FOR A WHILE FOR THE RAZORPAY PAYMENT PROCESS. 
          </p>

          <div className="inline-flex items-center gap-4 rounded-full border border-border bg-card p-1">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                billingPeriod === "monthly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                billingPeriod === "yearly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Yearly
              <span className="ml-1.5 text-xs text-emerald-500">Save 17%</span>
            </button>
          </div>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-3">
          {LEARNING_PLANS.map((plan) => {
            const isFree = plan.id === "free"
            const isRecommended = requestedPlan === plan.id
            const alreadyActive = subscription?.plan_id === plan.id && plan.id !== "free"

            return (
              <Card
                key={plan.name}
                className={cn(
                  "relative flex flex-col border-border bg-card transition-all",
                  plan.popular && "border-primary shadow-lg shadow-primary/10",
                  isRecommended && "ring-2 ring-primary/40"
                )}
              >
                {(plan.popular || isRecommended) && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary to-accent px-3 py-1 text-xs font-medium text-primary-foreground">
                      <Sparkles className="h-3 w-3" />
                      {isRecommended ? "Recommended" : "Most Popular"}
                    </span>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    {plan.id !== "free" && (
                      <Badge variant="secondary" className="border border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
                        14-Day Free Trial
                      </Badge>
                    )}
                    {alreadyActive && (
                      <Badge className="bg-emerald-500/20 text-emerald-500">Active</Badge>
                    )}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col">
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-foreground">
                        {plan.price === 0 ? "Free" : billingPeriod === "monthly" ? `₹${plan.price}` : `₹${plan.id === "pro" ? 1990 : 4990}`}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-muted-foreground">/{billingPeriod === "monthly" ? "mo" : "yr"}</span>
                      )}
                    </div>
                  </div>

                  <ul className="mb-6 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                    {(plan.limitations ?? []).map((limitation) => (
                      <li key={limitation} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-0.5 h-4 w-4 shrink-0 text-center">-</span>
                        <span>{limitation}</span>
                      </li>
                    ))}
                  </ul>

                  {isFree ? (
                    <Button asChild variant="outline" className="w-full">
                      <Link href={user ? "/dashboard" : "/register"}>{user ? "Continue on Free" : "Get Started"}</Link>
                    </Button>
                  ) : user ? (
                    <Button
                      className={cn(
                        "w-full",
                        plan.popular ? "bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground" : ""
                      )}
                      variant={plan.popular ? "default" : "outline"}
                      disabled={alreadyActive || isLoading}
                      onClick={() => setSelectedPlan(plan)}
                    >
                      {alreadyActive ? `You are on ${plan.name}` : `Activate ${plan.name}`}
                    </Button>
                  ) : (
                    <Button asChild className={cn("w-full", plan.popular ? "bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground" : "")} variant={plan.popular ? "default" : "outline"}>
                      <Link href="/login">Login to Continue</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mx-auto mt-12 max-w-3xl space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Flashcards and AI Voice are Pro features. Quiz and Planner are Premium features. AI Tutor and Notes stay free.
          </p>
          <p className="text-xs text-muted-foreground">
            Current checkout is in Razorpay test mode. Only ₹1 is charged for verification during the 14-day trial. Use Razorpay test cards while testing the payment flow.
          </p>
        </div>

        <div className="mx-auto mt-24 max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">Frequently Asked Questions</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-xl border border-border bg-card p-6">
                <h3 className="mb-2 font-semibold text-foreground">{faq.question}</h3>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedPlan && (
        <PaymentModal
          isOpen={Boolean(selectedPlan)}
          onClose={() => setSelectedPlan(null)}
          plan={{
            id: selectedPlan.id,
            name: selectedPlan.name,
            price: String(selectedPlan.price),
            period: selectedPlan.period,
          }}
          onPaymentSuccess={async () => {
            await refetch(true)
            setSelectedPlan(null)
          }}
        />
      )}
    </div>
  )
}
