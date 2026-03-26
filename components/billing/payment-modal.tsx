"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle, ShieldCheck, FlaskConical, CreditCard } from "lucide-react"
import { useUser } from "@/hooks/use-user"

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
  onPaymentSuccess: () => void
}

export function PaymentModal({ isOpen, onClose, plan, onPaymentSuccess }: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isRazorpayLoading, setIsRazorpayLoading] = useState(false)
  const [scriptReady, setScriptReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  const { email, profile } = useUser()

  useEffect(() => {
    let script: HTMLScriptElement | null = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')

    const handleLoad = () => setScriptReady(true)
    const handleError = () => {
      setScriptReady(false)
      setError("Razorpay test checkout could not load. You can still activate the trial instantly in test mode.")
    }

    if (!script) {
      script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.async = true
      script.onload = handleLoad
      script.onerror = handleError
      document.body.appendChild(script)
    } else {
      setScriptReady(true)
    }

    return () => {
      if (script) {
        script.onload = null
        script.onerror = null
      }
    }
  }, [])

  const handleTestSimulate = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setPaymentStatus("processing")

      const fakeOrderId = `test_order_${Date.now()}`
      const fakePaymentId = `test_pay_${Date.now()}`
      const fakeSig = "test_signature_bypass"

      const verifyResponse = await fetch("/api/payments/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: fakeOrderId,
          razorpay_payment_id: fakePaymentId,
          razorpay_signature: fakeSig,
          planId: plan.id,
          testMode: true,
        }),
      })

      const verifyData = await verifyResponse.json()

      if (!verifyResponse.ok) {
        throw new Error(verifyData.error || "Test activation failed")
      }

      setPaymentStatus("success")
      setTimeout(() => {
        onPaymentSuccess()
        onClose()
      }, 1400)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test activation failed")
      setPaymentStatus("error")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayment = async () => {
    try {
      setIsRazorpayLoading(true)
      setError(null)
      setPaymentStatus("processing")

      const orderResponse = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      })

      if (!orderResponse.ok) {
        const errData = await orderResponse.json()
        throw new Error(errData.error || "Failed to create order")
      }

      const orderData = await orderResponse.json()

      const options = {
        key: orderData.razorpayKey,
        order_id: orderData.orderId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "EduPilot",
        description: `${plan.name} — Razorpay test checkout`,
        prefill: {
          email: email ?? "",
          name: profile?.full_name ?? "",
        },
        notes: { planId: plan.id, mode: "test" },
        theme: { color: "#f59e0b" },
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

            const verifyData = await verifyResponse.json()
            if (!verifyResponse.ok) {
              throw new Error(verifyData.error || "Payment verification failed")
            }

            setPaymentStatus("success")
            setTimeout(() => {
              onPaymentSuccess()
              onClose()
            }, 1600)
          } catch (err) {
            setError(err instanceof Error ? err.message : "Payment verification failed")
            setPaymentStatus("error")
          }
        },
        modal: {
          ondismiss: () => {
            setIsRazorpayLoading(false)
            setPaymentStatus("idle")
          },
          escape: true,
          backdropclose: false,
          animation: true,
          confirm_close: true,
        },
      }

      const RazorpayClass = (window as { Razorpay?: new (opts: typeof options) => { open(): void } }).Razorpay
      if (!RazorpayClass) {
        throw new Error("Razorpay test checkout is not available right now. Use instant test activation below.")
      }

      const rzp = new RazorpayClass(options)
      rzp.open()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed. Please try again.")
      setPaymentStatus("error")
    } finally {
      setIsRazorpayLoading(false)
    }
  }

  const busy = isLoading || isRazorpayLoading || paymentStatus === "processing"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[560px] border-border bg-card sm:!max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Activate {plan.name} Plan</DialogTitle>
          <DialogDescription>
            Test mode is enabled. Use the instant test activation for a smooth trial flow, or open Razorpay test checkout if you want to test the external payment window.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-secondary/50 p-4">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="font-semibold text-foreground">{plan.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Mode</p>
                <p className="text-lg font-bold text-foreground">14-day trial</p>
              </div>
            </div>
            <p className="mt-2 border-t border-border pt-2 text-xs text-muted-foreground">
              Since this setup is only for testing, you can activate the trial instantly without depending on Razorpay popup behavior.
            </p>
          </div>

          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
            <div className="flex items-start gap-2">
              <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <div className="space-y-1 text-xs text-emerald-600 dark:text-emerald-400">
                <p><strong>Recommended for testing:</strong> Instant test activation.</p>
                <p>It activates the trial inside your app without opening the external Razorpay window, so the flow stays smooth and reliable while you build.</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <div className="space-y-1 text-xs text-amber-600 dark:text-amber-400">
                <p><strong>Optional Razorpay test checkout:</strong> this may show browser or iframe warnings in test mode.</p>
                <p>Use official test cards like <strong>4100 2800 0000 1007</strong> or <strong>5500 6700 0000 1002</strong> · CVV: any 3 digits · Expiry: any future date.</p>
              </div>
            </div>
          </div>

          {paymentStatus === "success" && (
            <Alert className="border-emerald-500/50 bg-emerald-500/10">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <AlertDescription className="text-emerald-500">
                Trial activated successfully.
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
                Processing test activation...
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              className="gap-2"
              onClick={handleTestSimulate}
              disabled={busy || paymentStatus === "success"}
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Activating...</>
              ) : paymentStatus === "success" ? (
                <><CheckCircle className="h-4 w-4" />Activated</>
              ) : (
                <><FlaskConical className="h-4 w-4" />Instant Test Activation</>
              )}
            </Button>

            <Button
              variant="outline"
              className="gap-2"
              onClick={handlePayment}
              disabled={busy || paymentStatus === "success" || !scriptReady}
            >
              {isRazorpayLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Opening checkout...</>
              ) : (
                <><CreditCard className="h-4 w-4" />Open Razorpay Test Checkout</>
              )}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={busy}>
              Close
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            For development, use the instant activation button above. It is the smoothest option and avoids external checkout issues.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
