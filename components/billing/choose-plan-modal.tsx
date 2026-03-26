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
        <DialogContent className="flex max-h-[92vh] w-[94vw] flex-col overflow-hidden border-border bg-card p-0 sm:max-h-[90vh] sm:w-[90vw] md:w-[88vw] lg:w-[84vw] xl:w-[80vw] 2xl:max-w-[1400px]">
          <div className="shrink-0 border-b border-border bg-background/95 px-4 py-4 backdrop-blur sm:px-6 sm:py-5">
            <DialogHeader className="space-y-2 pr-8 text-left">
              <DialogTitle className="text-xl sm:text-2xl">Choose Your Learning Plan</DialogTitle>
              <DialogDescription className="max-w-3xl text-sm leading-6">
                Flashcards, AI Voice, and Quiz are premium features. Start a 14-day free trial in Razorpay test mode.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="space-y-4 p-4 sm:space-y-5 sm:p-6">
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-600 dark:text-amber-400">
                <span className="font-semibold">Test mode:</span> Use Razorpay test cards for checkout. Your selected plan starts with a 14-day free trial after successful payment verification.
              </div>

              <div className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3 xl:items-stretch">
                {LEARNING_PLANS.map((plan) => {
                  const isFree = plan.id === "free"

                  return (
                    <Card
                      key={plan.id}
                      className={cn(
                        "relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200",
                        plan.popular && "border-primary shadow-lg shadow-primary/10"
                      )}
                    >
                      {plan.popular && (
                        <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2">
                          <Badge className="bg-gradient-to-r from-primary to-accent px-3 py-1 text-primary-foreground shadow-md">
                            <Sparkles className="mr-1 h-3.5 w-3.5" /> Most Popular
                          </Badge>
                        </div>
                      )}

                      <CardHeader className={cn("space-y-3", plan.popular && "pt-12")}>
                        <div className="space-y-2">
                          <CardTitle className="text-2xl">{plan.name}</CardTitle>
                          <CardDescription className="text-sm leading-6">{plan.description}</CardDescription>
                        </div>

                        <div className="flex items-end gap-1 pt-1">
                          <span className="text-4xl font-bold text-foreground">
                            {plan.price === 0 ? "Free" : `₹${plan.price}`}
                          </span>
                          {plan.price > 0 && <span className="pb-1 text-muted-foreground">{plan.period}</span>}
                        </div>
                      </CardHeader>

                      <CardContent className="flex flex-1 flex-col gap-6">
                        <ul className="space-y-3 text-sm">
                          {plan.features.map((feature) => (
                            <li key={feature} className="flex items-start gap-3 leading-6">
                              <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-500" />
                              <span>{feature}</span>
                            </li>
                          ))}

                          {(plan.limitations ?? []).map((item) => (
                            <li key={item} className="flex items-start gap-3 leading-6 text-muted-foreground">
                              <span className="mt-0.5 inline-block w-4 shrink-0 text-center">-</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="mt-auto pt-2">
                          <Button
                            className={cn(
                              "h-11 w-full rounded-xl",
                              plan.popular && "bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90"
                            )}
                            variant={isFree ? "outline" : plan.popular ? "default" : "outline"}
                            disabled={isFree}
                            onClick={() => !isFree && setSelectedPlanId(plan.id as PaidPlanId)}
                          >
                            {plan.cta}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
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
