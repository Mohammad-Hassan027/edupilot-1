"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle, ShieldCheck, CreditCard } from "lucide-react"
import { persistSubscriptionOverride, useUser } from "@/hooks/use-user"

interface Plan {
  id: string
  name: string
  price: string
  period: string
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  plan: Plan
  onPaymentSuccess: () => void | Promise<void>
}

export function PaymentModal({ isOpen, onClose, plan, onPaymentSuccess }: PaymentModalProps) {
  const [isOpeningCheckout, setIsOpeningCheckout] = useState(false)
  const [scriptReady, setScriptReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  const [isLaunchingCheckout, setIsLaunchingCheckout] = useState(false)
  const isMountedRef = useRef(true)
  const hasCompletedPaymentRef = useRef(false)
  const { email, profile } = useUser()

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return

    let mounted = true
    let script: HTMLScriptElement | null = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')

    const handleLoad = () => {
      if (mounted) setScriptReady(true)
    }
    const handleError = () => {
      if (!mounted) return
      setScriptReady(false)
      setError("Razorpay checkout could not load. Please refresh and try again.")
    }

    if (!script) {
      script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.async = true
      script.onload = handleLoad
      script.onerror = handleError
      document.body.appendChild(script)
    } else if ((window as { Razorpay?: unknown }).Razorpay) {
      setScriptReady(true)
    } else {
      script.addEventListener("load", handleLoad, { once: true })
      script.addEventListener("error", handleError, { once: true })
    }

    return () => {
      mounted = false
      if (script) {
        script.onload = null
        script.onerror = null
      }
    }
  }, [isOpen])

  const planAmountLabel = useMemo(() => (plan.price === "0" ? "Free" : `₹${plan.price}${plan.period}`), [plan.period, plan.price])

  const handlePayment = async () => {
    try {
      if (hasCompletedPaymentRef.current) return

      setIsOpeningCheckout(true)
      setError(null)
      setPaymentStatus("processing")

      const orderResponse = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      })

      const orderData = await orderResponse.json().catch(() => ({}))
      if (!orderResponse.ok) {
        throw new Error(orderData.error || "Failed to create order")
      }

      const RazorpayClass = (window as {
        Razorpay?: new (opts: Record<string, unknown>) => { open(): void; on?: (event: string, cb: (response: unknown) => void) => void }
      }).Razorpay

      if (!RazorpayClass) {
        throw new Error("Razorpay checkout is not available right now. Please refresh and try again.")
      }

      const rzp = new RazorpayClass({
        key: orderData.razorpayKey,
        order_id: orderData.orderId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "EduPilot",
        description: `${plan.name} Plan - 14-day free trial`,
        prefill: {
          email: email ?? "",
          name: profile?.full_name ?? "",
        },
        notes: {
          planId: plan.id,
          env: "test",
        },
        readonly: { email: true, name: true },
        config: { display: { hide: [{ method: "emi" }] } },
        theme: { color: "#f59e0b" },
        modal: {
          ondismiss: () => {
            if (hasCompletedPaymentRef.current) return
            if (isMountedRef.current) {
              setIsOpeningCheckout(false)
              setPaymentStatus("idle")
              setIsLaunchingCheckout(false)
            }
          },
          escape: true,
          backdropclose: false,
          confirm_close: false,
          animation: true,
        },
        handler: async (response: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) => {
          try {
            const verifyResponse = await fetch("/api/payments/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId: plan.id,
              }),
            })

            const verifyData = await verifyResponse.json().catch(() => ({}))
            if (!verifyResponse.ok) {
              throw new Error(verifyData.error || "Payment verification failed")
            }

            hasCompletedPaymentRef.current = true
            persistSubscriptionOverride(plan.id as "pro" | "premium")

            if (isMountedRef.current) {
              setPaymentStatus("success")
              setIsLaunchingCheckout(false)
            }

            await onPaymentSuccess()
            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("user-data-refresh"))
            }

            window.setTimeout(() => {
              onClose()
            }, 350)
          } catch (err) {
            if (isMountedRef.current) {
              setError(err instanceof Error ? err.message : "Payment verification failed")
              setPaymentStatus("error")
              setIsLaunchingCheckout(false)
            }
          } finally {
            setIsOpeningCheckout(false)
          }
        },
      })

      rzp.on?.("payment.failed", (response: unknown) => {
        console.error("[Razorpay payment.failed]", response)
        if (isMountedRef.current) {
          setPaymentStatus("error")
          setError("Payment was not completed. Please use Razorpay test card details and try again.")
          setIsOpeningCheckout(false)
          setIsLaunchingCheckout(false)
        }
      })

      if (isMountedRef.current) {
        setIsLaunchingCheckout(true)
      }

      window.requestAnimationFrame(() => {
        rzp.open()
      })
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : "Payment failed. Please try again.")
        setPaymentStatus("error")
        setIsOpeningCheckout(false)
        setIsLaunchingCheckout(false)
      }
    }
  }

  const busy = isOpeningCheckout || paymentStatus === "processing"

  if (isLaunchingCheckout) {
    return (
      <div className="fixed right-4 top-4 z-[100] w-[calc(100vw-2rem)] max-w-md rounded-xl border border-amber-500/40 bg-background p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-amber-500" />
          <div className="space-y-1">
            <p className="font-medium text-foreground">Please wait for a while while processing payment.</p>
            <p className="text-sm text-muted-foreground">Razorpay checkout is opening. Please wait a moment while your payment window loads.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-[560px] border-border bg-card sm:!max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Activate {plan.name} Plan</DialogTitle>
          <DialogDescription>
            Complete the Razorpay test payment to start your 14-day free trial and unlock AI Flashcards instantly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-secondary/50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Selected plan</p>
                <p className="text-xl font-semibold text-foreground">{plan.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="text-lg font-bold text-foreground">{planAmountLabel}</p>
              </div>
            </div>
            <div className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
              Your plan starts with a <span className="font-medium text-foreground">14-day free trial</span> after successful payment verification.
            </div>
          </div>

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <div className="space-y-1 text-xs text-amber-600 dark:text-amber-400">
                <p><strong>Test mode:</strong> Use official Razorpay test card details.</p>
                <p>Try <strong>4100 2800 0000 1007</strong> or <strong>5500 6700 0000 1002</strong> · CVV: any 3 digits · Expiry: any future date.</p>
              </div>
            </div>
          </div>

          {paymentStatus === "success" && (
            <Alert className="border-emerald-500/50 bg-emerald-500/10">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <AlertDescription className="text-emerald-500">
                Payment verified successfully. Your {plan.name} plan is now active.
              </AlertDescription>
            </Alert>
          )}

          {paymentStatus === "error" && error && (
            <Alert className="border-destructive/50 bg-destructive/10">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">{error}</AlertDescription>
            </Alert>
          )}

          {paymentStatus === "processing" && (
            <Alert className="border-accent/50 bg-accent/10">
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
              <AlertDescription className="text-accent">
Please wait for a while while processing payment. Opening Razorpay checkout...
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              className="gap-2"
              onClick={handlePayment}
              disabled={busy || paymentStatus === "success" || !scriptReady}
            >
              {isOpeningCheckout ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Please wait while processing payment...</>
              ) : (
                <><CreditCard className="h-4 w-4" />Pay in Test Mode</>
              )}
            </Button>

            <Button variant="outline" onClick={onClose} disabled={busy}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
