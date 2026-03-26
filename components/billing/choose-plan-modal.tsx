"use client"

import { useMemo, useState } from "react"
import { Check, Sparkles } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PaymentModal } from "@/components/billing/payment-modal"
import { LEARNING_PLANS, type PaidPlanId } from "@/lib/plans"
import { cn } from "@/lib/utils"

interface ChoosePlanModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPaymentSuccess: () => void
}

export function ChoosePlanModal({ open, onOpenChange, onPaymentSuccess }: ChoosePlanModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<PaidPlanId | null>(null)

  const selectedPlan = useMemo(() => LEARNING_PLANS.find((plan) => plan.id === selectedPlanId) ?? null, [selectedPlanId])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl border-border bg-card p-0 overflow-hidden">
          <div className="border-b border-border bg-secondary/20 px-6 py-5">
            <DialogHeader>
              <DialogTitle className="text-2xl">Choose Your Learning Plan</DialogTitle>
              <DialogDescription>
                Flashcards, AI Voice, and Quiz are premium features. Start a 14-day free trial in Razorpay test mode.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-5 p-6">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-600 dark:text-amber-400">
              <span className="font-semibold">Test mode:</span> Use Razorpay test cards for checkout. Your selected plan starts with a 14-day free trial after successful payment verification.
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {LEARNING_PLANS.map((plan) => {
                const isFree = plan.id === "free"
                return (
                  <Card
                    key={plan.id}
                    className={cn(
                      "relative border-border bg-card transition-all",
                      plan.popular && "border-primary shadow-lg shadow-primary/10"
                    )}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
                          <Sparkles className="mr-1 h-3 w-3" /> Most Popular
                        </Badge>
                      </div>
                    )}

                    <CardHeader>
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <div className="pt-2">
                        <span className="text-4xl font-bold text-foreground">
                          {plan.price === 0 ? "Free" : `₹${plan.price}`}
                        </span>
                        {plan.price > 0 && <span className="ml-1 text-muted-foreground">{plan.period}</span>}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      <ul className="space-y-3 text-sm">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                            <span>{feature}</span>
                          </li>
                        ))}
                        {(plan.limitations ?? []).map((item) => (
                          <li key={item} className="flex items-start gap-2 text-muted-foreground">
                            <span className="mt-0.5 inline-block w-4 text-center">-</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        className={cn(
                          "w-full",
                          plan.popular && "bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground"
                        )}
                        variant={isFree ? "outline" : plan.popular ? "default" : "outline"}
                        disabled={isFree}
                        onClick={() => !isFree && setSelectedPlanId(plan.id as PaidPlanId)}
                      >
                        {plan.cta}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedPlan && (
        <PaymentModal
          isOpen={Boolean(selectedPlan)}
          onClose={() => setSelectedPlanId(null)}
          plan={{
            id: selectedPlan.id,
            name: selectedPlan.name,
            price: String(selectedPlan.price),
            period: selectedPlan.period,
          }}
          onPaymentSuccess={() => {
            setSelectedPlanId(null)
            onOpenChange(false)
            onPaymentSuccess()
          }}
        />
      )}
    </>
  )
}
