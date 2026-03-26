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
import { Loader2, AlertCircle, CheckCircle, ShieldCheck } from "lucide-react"
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
  const [error, setError] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  const { email, profile } = useUser()

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    document.body.appendChild(script)
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  // Test mode: activate trial without real payment
  const handleTestSimulate = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setPaymentStatus("processing")

      // Create a fake order ID for test mode
      const fakeOrderId = `test_order_${Date.now()}`
      const fakePaymentId = `test_pay_${Date.now()}`
      const fakeSig = "test_signature_bypass"

      const verifyResponse = await fetch("/api/payments/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id:   fakeOrderId,
          razorpay_payment_id: fakePaymentId,
          razorpay_signature:  fakeSig,
          planId: plan.id,
          testMode: true,       // signals server to skip signature check
        }),
      })

      const verifyData = await verifyResponse.json()

      if (!verifyResponse.ok) {
        throw new Error(verifyData.error || "Test simulation failed")
      }

      setPaymentStatus("success")
      setTimeout(() => { onPaymentSuccess(); onClose() }, 1800)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test simulation failed")
      setPaymentStatus("error")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayment = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setPaymentStatus("processing")

      // Create order — backend reads user from session
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

      // Razorpay checkout options
      const options = {
        key: orderData.razorpayKey,
        order_id: orderData.orderId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "EduPilot",
        description: `${plan.name} — test payment for 14-day free trial activation`,
        image: "/icon.svg",
        prefill: {
          email: email ?? "",
          name: profile?.full_name ?? "",
        },
        notes: { planId: plan.id },
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
            }, 2000)
          } catch (err) {
            setError(err instanceof Error ? err.message : "Payment verification failed")
            setPaymentStatus("error")
          }
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false)
            setPaymentStatus("idle")
          },
        },
      }

      const RazorpayClass = (window as { Razorpay?: new (opts: typeof options) => { open(): void } }).Razorpay
      if (RazorpayClass) {
        const rzp = new RazorpayClass(options)
        rzp.open()
      } else {
        throw new Error("Razorpay script not loaded. Please refresh and try again.")
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Payment failed. Please try again."
      setError(msg)
      setPaymentStatus("error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-border bg-card">
        <DialogHeader>
          <DialogTitle>Activate {plan.name} Plan</DialogTitle>
          <DialogDescription>
            Pay in Razorpay test mode to verify your account and unlock a 14-day free trial for the selected plan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Plan Summary */}
          <div className="rounded-lg border border-border bg-secondary/50 p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="font-semibold text-foreground">{plan.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Charge</p>
                <p className="text-2xl font-bold text-foreground">₹1</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground border-t border-border pt-2 mt-2">
              ₹1 is charged for account verification only and is refunded immediately after payment.
            </p>
          </div>

          {/* Test mode notice */}
          <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
            <ShieldCheck className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-600 dark:text-amber-400">
              <strong>Test payment mode.</strong> Use Razorpay test cards — e.g. Card: 4111 1111 1111 1111 · CVV: any 3 digits · Expiry: any future date
            </p>
          </div>

          {/* Status messages */}
          {paymentStatus === "success" && (
            <Alert className="border-emerald-500/50 bg-emerald-500/10">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <AlertDescription className="text-emerald-500">
                Payment verified! Your 14-day free trial is now active.
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
              <Loader2 className="h-4 w-4 text-accent animate-spin" />
              <AlertDescription className="text-accent">
                Complete the payment in the popup window.
              </AlertDescription>
            </Alert>
          )}

          {/* Accepted methods */}
          <div className="rounded-lg border border-border bg-secondary/30 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Accepted Payment Methods</p>
            <p className="text-xs text-muted-foreground">Razorpay · UPI · Net Banking · Cards · Wallets</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isLoading || paymentStatus === "processing"}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handlePayment}
              disabled={isLoading || paymentStatus === "processing" || paymentStatus === "success"}
            >
              {paymentStatus === "processing" ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Processing...</>
              ) : paymentStatus === "success" ? (
                <><CheckCircle className="h-4 w-4" />Activated!</>
              ) : (
                "Pay ₹1 & Activate Trial"
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Your payment is secured by Razorpay. We never store card details.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
