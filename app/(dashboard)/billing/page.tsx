"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Check, Clock, Zap, Globe, BarChart3, Sparkles, ArrowRight, CreditCard } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PaymentModal } from "@/components/billing/payment-modal"

const plans = [
  {
    id: "free",
    name: "Free Trial",
    price: "0",
    period: "14 days",
    description: "Perfect for getting started",
    features: [
      "AI Tutor (limited queries)",
      "Basic note generation",
      "Simple flashcards",
      "Study planner",
      "Community support",
    ],
    limitations: [
      "Limited AI sessions",
      "Basic analytics",
      "No voice assistant",
    ],
    cta: "Current Plan",
    badge: "Active",
    highlighted: true,
  },
  {
    id: "standard",
    name: "Standard",
    price: "99",
    period: "per month",
    description: "For serious learners",
    features: [
      "Unlimited AI Tutor",
      "Advanced note generation",
      "Smart flashcards with spaced repetition",
      "AI Study Planner",
      "Learning analytics",
      "Priority support",
      "Export to PDF/Notion",
    ],
    limitations: [
      "No voice assistant",
      "API access",
    ],
    cta: "Upgrade to Standard",
    badge: null,
    highlighted: false,
  },
  {
    id: "premium",
    name: "Premium",
    price: "299",
    period: "per month",
    description: "The ultimate learning suite",
    features: [
      "Everything in Standard",
      "Advanced analytics & insights",
      "Custom study paths",
      "AI Voice Assistant",
      "API access",
      "Dedicated support",
      "Early access to features",
    ],
    limitations: [],
    cta: "Upgrade to Premium",
    badge: null,
    highlighted: false,
  },
]

export default function BillingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const currentPlan = "free"
  const trialDaysRemaining = 12

  const handleUpgrade = (planId: string) => {
    if (planId !== currentPlan) {
      setSelectedPlan(planId)
      setShowPaymentModal(true)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Subscription & Billing</h1>
        <p className="text-muted-foreground">Manage your plan and upgrade to unlock more features</p>
      </div>

      {/* Current Plan Info */}
      <Alert className="border-accent/50 bg-accent/5">
        <Clock className="h-4 w-4 text-accent" />
        <AlertDescription>
          <span className="font-semibold text-foreground">Free Trial Active:</span> You have <span className="text-accent font-semibold">{trialDaysRemaining} days</span> remaining on your free trial. Upgrade anytime to unlock all features.
        </AlertDescription>
      </Alert>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative border-border transition-all ${
              plan.highlighted
                ? "border-accent/50 bg-card ring-1 ring-accent/20"
                : "bg-card"
            } ${plan.id === currentPlan ? "opacity-75" : ""}`}
          >
            {/* Badge */}
            {plan.badge && (
              <Badge className="absolute -top-3 left-6 bg-accent text-accent-foreground">
                {plan.badge}
              </Badge>
            )}

            <CardHeader>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">₹{plan.price}</span>
                <span className="text-sm text-muted-foreground">/{plan.period}</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Features */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Includes:</p>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-foreground">
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Limitations */}
              {plan.limitations.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-border">
                  <p className="text-sm font-medium text-muted-foreground">Not included:</p>
                  <ul className="space-y-2">
                    {plan.limitations.map((limitation) => (
                      <li key={limitation} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <span className="text-muted-foreground mt-0.5">-</span>
                        {limitation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CTA Button */}
              <Button
                onClick={() => handleUpgrade(plan.id)}
                disabled={plan.id === currentPlan}
                className={`w-full gap-2 ${
                  plan.id === currentPlan
                    ? "opacity-50 cursor-not-allowed"
                    : plan.highlighted
                      ? "bg-gradient-to-r from-primary to-accent hover:opacity-90"
                      : ""
                }`}
              >
                {plan.id === currentPlan ? (
                  <>
                    <Check className="h-4 w-4" />
                    {plan.cta}
                  </>
                ) : (
                  <>
                    {plan.cta}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Methods Info */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Accepted Payment Methods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
            {["Razorpay", "UPI", "Net Banking", "Cards", "Wallets"].map((method) => (
              <div
                key={method}
                className="flex items-center justify-center p-4 rounded-lg border border-border bg-secondary/50 text-sm font-medium text-foreground"
              >
                {method}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Billing Info */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Billing Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium text-foreground">alex@example.com</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Status</p>
              <Badge className="bg-accent/20 text-accent">Active</Badge>
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <p className="text-sm text-muted-foreground mb-2">
              Your payment method will be securely processed through Razorpay. All payment information is encrypted and PCI compliant.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {selectedPlan && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false)
            setSelectedPlan(null)
          }}
          plan={plans.find((p) => p.id === selectedPlan)!}
          onPaymentSuccess={() => {
            setShowPaymentModal(false)
            setSelectedPlan(null)
            // You can add a success toast notification here
          }}
        />
      )}
    </div>
  )
}
