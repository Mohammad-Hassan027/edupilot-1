"use client"

import { useMemo, useState } from "react"
import {
  AlertCircle,
  ArrowRight,
  Check,
  Clock3,
  CreditCard,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PaymentModal } from "@/components/billing/payment-modal"
import { useUser } from "@/hooks/use-user"
import {
  LEARNING_PLANS,
  getPlanById,
  hasPremiumAccess,
  type LearningPlan,
  type PaidPlanId,
} from "@/lib/plans"
import { cn } from "@/lib/utils"

function formatDate(date: string | null | undefined) {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function calculateDaysLeft(date: string | null | undefined) {
  if (!date) return null
  const diff = new Date(date).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86400000))
}

export default function BillingPage() {
  const { email, subscription, isLoading, refetch } = useUser()
  const [selectedPlan, setSelectedPlan] = useState<LearningPlan | null>(null)

  const currentPlan = useMemo(() => getPlanById(subscription?.plan_id ?? "free"), [subscription?.plan_id])
  const isTrialActive = Boolean(
    subscription?.trial_active &&
      subscription?.trial_expiry &&
      new Date(subscription.trial_expiry).getTime() > Date.now()
  )
  const isPaidActive = Boolean(
    subscription?.status === "active" &&
      subscription?.plan_id &&
      subscription?.plan_id !== "free"
  )
  const isFreePlan = !isTrialActive && !isPaidActive
  const isPremiumPlan = hasPremiumAccess(subscription)
  const isProPlan = !isPremiumPlan && !isFreePlan && currentPlan.id === "pro"
  const trialDaysLeft = calculateDaysLeft(subscription?.trial_expiry)

  const availablePlans = useMemo(() => {
    if (isFreePlan) return LEARNING_PLANS.filter((plan) => plan.id !== "free")
    if (isProPlan) return LEARNING_PLANS.filter((plan) => plan.id === "premium")
    return []
  }, [isFreePlan, isProPlan])

  const planBadgeLabel = isTrialActive
    ? `${currentPlan.name} Trial`
    : isPaidActive
      ? `${currentPlan.name} Active`
      : "Free Plan"

  const planStatusDescription = isTrialActive
    ? `${currentPlan.name} trial is active${trialDaysLeft !== null ? ` · ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left` : ""}`
    : isPaidActive
      ? `${currentPlan.name} plan is active on your account`
      : "Your account is ready for an upgrade"

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Billing</h1>
          <p className="text-muted-foreground">
            Manage your subscription, review your current plan, and upgrade when needed.
          </p>
        </div>
        <Badge variant="secondary" className="w-fit gap-2 px-3 py-1.5 text-sm">
          <Wallet className="h-3.5 w-3.5" />
          {planBadgeLabel}
        </Badge>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      ) : (
        <>
          <Alert className={cn(
            "border",
            isFreePlan
              ? "border-amber-500/30 bg-amber-500/10"
              : "border-emerald-500/30 bg-emerald-500/10"
          )}>
            {isFreePlan ? (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            ) : (
              <Sparkles className="h-4 w-4 text-emerald-500" />
            )}
            <AlertDescription>
              <span className="font-semibold text-foreground">{planStatusDescription}.</span>{" "}
              {isFreePlan
                ? "Upgrade to unlock Flashcards, AI Voice, Quiz, and Premium Planner access."
                : "Your paid access is reflected across supported features in the app."}
            </AlertDescription>
          </Alert>

          <div className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
            <Card className="border-border bg-card">
              <CardHeader className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="text-xl">Current Plan Details</CardTitle>
                    <CardDescription>
                      Production-ready summary of the user&apos;s active subscription state.
                    </CardDescription>
                  </div>
                  <Badge className={cn(
                    "w-fit",
                    isFreePlan
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-emerald-500/20 text-emerald-500"
                  )}>
                    {planBadgeLabel}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-border bg-secondary/40 p-4">
                      <p className="text-sm text-muted-foreground">Plan</p>
                      <p className="mt-1 text-lg font-semibold text-foreground">{currentPlan.name}</p>
                    </div>

                    <div className="rounded-xl border border-border bg-secondary/40 p-4">
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="mt-1 text-lg font-semibold text-foreground">
                        {isTrialActive ? "Trial Active" : isPaidActive ? "Active" : "Free"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border bg-secondary/40 p-4">
                      <p className="text-sm text-muted-foreground">Trial / Renewal</p>
                      <p className="mt-1 text-base font-semibold text-foreground">
                        {isTrialActive
                          ? formatDate(subscription?.trial_expiry)
                          : formatDate(subscription?.subscription_end)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-secondary/40 p-4">
                    <p className="text-sm text-muted-foreground">Billing email</p>
                    <p className="mt-1 text-sm font-medium text-foreground md:text-base">
                      {email || "—"}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background/60 p-5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <h2 className="font-semibold text-foreground">Included Access</h2>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {currentPlan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-3 rounded-xl border border-border/70 bg-card/60 p-3 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <span className="text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {!!currentPlan.limitations?.length && (
                    <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                      <p className="text-sm font-medium text-foreground">Current limitations</p>
                      <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                        {currentPlan.limitations.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <span className="mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock3 className="h-4 w-4 text-primary" />
                    Subscription Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Plan type</span>
                    <span className="font-medium text-foreground">{currentPlan.name}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Access state</span>
                    <span className="font-medium text-foreground">
                      {isTrialActive ? "Trial" : isPaidActive ? "Paid" : "Free"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Trial expiry</span>
                    <span className="font-medium text-foreground">{formatDate(subscription?.trial_expiry)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Subscription end</span>
                    <span className="font-medium text-foreground">{formatDate(subscription?.subscription_end)}</span>
                  </div>
                  <div className="rounded-xl border border-border bg-secondary/40 p-4 text-muted-foreground">
                    Payments are securely processed through Razorpay. In test mode, use Razorpay test payment details for checkout verification.
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Billing Support
                  </CardTitle>
                  <CardDescription>
                    Keep plan management clear and easy for users.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>• Free users can browse paid feature pages, but checkout opens when they try to generate premium content.</p>
                  <p>• Pro users can access Flashcards and AI Voice.</p>
                  <p>• Premium users can access Flashcards, AI Voice, Quiz, and Planner.</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {availablePlans.length > 0 && (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>
                  {isFreePlan ? "Available Plans" : "Upgrade Options"}
                </CardTitle>
                <CardDescription>
                  {isFreePlan
                    ? "The same paid plans from your Pricing page are shown here in a clean billing layout."
                    : "Your current plan is already active, so only the next upgrade path is shown."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {availablePlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={cn(
                      "rounded-2xl border p-5",
                      plan.popular ? "border-primary/40 bg-primary/5" : "border-border bg-secondary/20"
                    )}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
                          {plan.popular && <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>}
                          {plan.id === "premium" && isProPlan && (
                            <Badge variant="secondary">Recommended Upgrade</Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground">{plan.description}</p>
                        <div className="flex items-end gap-1">
                          <span className="text-3xl font-bold text-foreground">₹{plan.price}</span>
                          <span className="pb-1 text-sm text-muted-foreground">{plan.period}</span>
                        </div>
                      </div>

                      <Button
                        className="h-11 gap-2 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 lg:min-w-[190px]"
                        onClick={() => setSelectedPlan(plan)}
                      >
                        {isFreePlan ? plan.cta : `Upgrade to ${plan.name}`}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-3 rounded-xl border border-border/70 bg-card/70 p-3 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          <span className="text-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {!!plan.limitations?.length && (
                      <div className="mt-4 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Limitations:</span>{" "}
                        {plan.limitations.join(" • ")}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {selectedPlan && (
        <PaymentModal
          isOpen={Boolean(selectedPlan)}
          onClose={() => setSelectedPlan(null)}
          plan={{
            id: selectedPlan.id as PaidPlanId,
            name: selectedPlan.name,
            price: String(selectedPlan.price),
            period: selectedPlan.period,
          }}
          onPaymentSuccess={async () => {
            setSelectedPlan(null)
            await refetch()
          }}
        />
      )}
    </div>
  )
}
