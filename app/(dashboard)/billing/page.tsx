"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Check, Clock, Zap, CreditCard, ArrowRight, Sparkles, AlertCircle
} from "lucide-react"
import { PaymentModal } from "@/components/billing/payment-modal"
import { useUser } from "@/hooks/use-user"

const plans = [
  {
    id: "pro",
    name: "Pro",
    price: "1",
    period: "verification charge",
    description: "₹1 account verification — refunded instantly, then Pro trial starts",
    features: [
      "Unlimited AI Tutor sessions",
      "Unlimited quiz generation",
      "Unlimited flashcard creation",
      "AI Notes generator",
      "Study planner with AI",
      "Full learning analytics",
      "Priority support",
    ],
    cta: "Activate 14-Day Trial",
    highlighted: true,
  },
]

export default function BillingPage() {
  const { email, subscription, credits, isLoading, refetch } = useUser()
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const isTrial = subscription?.trial_active === true
  const isPro = subscription?.status === "active" && (subscription?.plan_id === "pro" || subscription?.plan_id === "premium")
  const isUpgraded = isTrial || isPro

  const trialExpiry = subscription?.trial_expiry
  const trialDaysLeft = trialExpiry
    ? Math.max(0, Math.ceil((new Date(trialExpiry).getTime() - Date.now()) / 86400000))
    : 0

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Subscription & Billing</h1>
        <p className="text-muted-foreground">Manage your plan and unlock unlimited access</p>
      </div>

      {/* Current status banner */}
      {isLoading ? (
        <Skeleton className="h-14 rounded-lg" />
      ) : isUpgraded ? (
        <Alert className="border-emerald-500/40 bg-emerald-500/10">
          <Sparkles className="h-4 w-4 text-emerald-500" />
          <AlertDescription>
            {isTrial ? (
              <>
                <span className="font-semibold text-foreground">Trial Active 🎉</span>{" "}
                You have <span className="text-emerald-500 font-semibold">{trialDaysLeft} days</span> of unlimited access remaining.
                {trialExpiry && (
                  <span className="text-muted-foreground text-sm ml-2">
                    (expires {new Date(trialExpiry).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })})
                  </span>
                )}
              </>
            ) : (
              <span className="font-semibold text-foreground">Pro Plan Active — Unlimited access enabled.</span>
            )}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-amber-500/40 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertDescription>
            <span className="font-semibold text-foreground">Free Plan</span>{" "}
            — You have{" "}
            <span className="text-amber-500 font-semibold">{credits?.ai_chat_remaining ?? 0} AI credits</span> remaining.
            Activate your trial to get unlimited access for 14 days.
          </AlertDescription>
        </Alert>
      )}

      {/* Credits summary */}
      {!isLoading && !isUpgraded && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Your Credits
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            {[
              { label: "AI Chats",    remaining: credits?.ai_chat_remaining    ?? 0, used: credits?.ai_chat_used    ?? 0 },
              { label: "Flashcards", remaining: credits?.flashcards_remaining  ?? 0, used: credits?.flashcards_used  ?? 0 },
              { label: "Study Plans",remaining: credits?.study_plan_remaining  ?? 0, used: credits?.study_plan_used  ?? 0 },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-border bg-secondary/50 p-3 text-center">
                <p className={`text-2xl font-bold ${item.remaining === 0 ? "text-destructive" : "text-foreground"}`}>
                  {item.remaining}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.label} left</p>
                <p className="text-xs text-muted-foreground">{item.used} used</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Plan card */}
      {!isUpgraded && (
        <div className="max-w-md mx-auto">
          {plans.map((plan) => (
            <Card key={plan.id} className="border-accent/50 bg-card ring-1 ring-accent/20 relative">
              <Badge className="absolute -top-3 left-6 bg-accent text-accent-foreground">
                Most Popular
              </Badge>
              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-foreground">₹{plan.price}</span>
                  <span className="text-sm text-muted-foreground">/ {plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-foreground">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  onClick={() => setShowPaymentModal(true)}
                >
                  <Zap className="h-4 w-4" />
                  {plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  ₹1 is charged for verification only and refunded immediately after payment.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Already on trial — show expiry info */}
      {isUpgraded && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Trial Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <Badge className="bg-emerald-500/20 text-emerald-500">
                {isTrial ? `${subscription?.plan_id === "premium" ? "Premium" : "Pro"} Trial` : subscription?.plan_id === "premium" ? "Premium" : "Pro"}
              </Badge>
            </div>
            {trialExpiry && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Expires</span>
                <span className="font-medium text-foreground">
                  {new Date(trialExpiry).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Days remaining</span>
              <span className="font-semibold text-emerald-500">{trialDaysLeft} days</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing info — real email */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Billing Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Account email</p>
              <p className="font-medium text-foreground">
                {isLoading ? <Skeleton className="h-5 w-40 inline-block" /> : email ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current plan</p>
              <Badge className="mt-1">
                {isTrial ? `${subscription?.plan_id === "premium" ? "Premium" : "Pro"} Trial` : isPro ? `${subscription?.plan_id === "premium" ? "Premium" : "Pro"}` : "Free"}
              </Badge>
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">
              Payments are securely processed through Razorpay. We never store your card details.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Accepted payment methods */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Accepted Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {["Razorpay", "UPI", "Net Banking", "Credit / Debit Cards", "Wallets"].map((m) => (
              <span key={m} className="px-3 py-1.5 rounded-lg border border-border bg-secondary/50 text-sm text-foreground">
                {m}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        plan={plans[0]}
        onPaymentSuccess={() => {
          setShowPaymentModal(false)
          refetch()
        }}
      />
    </div>
  )
}
