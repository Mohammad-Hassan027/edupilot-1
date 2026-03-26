export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { verifyRazorpaySignature, fetchRazorpayPayment, issueRefund } from "@/lib/payments"
import { updatePaymentRecord, activateTrial, refillCreditsForTrial } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      testMode,
    } = await request.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment details" }, { status: 400 })
    }

    if (planId !== "pro" && planId !== "premium") {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 })
    }

    if (!testMode) {
      const isValid = verifyRazorpaySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      )

      if (!isValid) {
        await updatePaymentRecord(razorpay_order_id, { status: "failed" }).catch(() => {})
        return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 })
      }

      await updatePaymentRecord(razorpay_order_id, {
        razorpay_payment_id,
        razorpay_signature,
        status: "captured",
      }).catch(() => {})
    }

    let refunded = false
    if (!testMode) {
      try {
        const payment = await fetchRazorpayPayment(razorpay_payment_id)
        if (Number(payment.amount) === 100) {
          await issueRefund(razorpay_payment_id, 100)
          await updatePaymentRecord(razorpay_order_id, { status: "refunded", refunded: true })
          refunded = true
        }
      } catch (refundErr) {
        console.error("[verify-payment] Refund error (non-fatal):", refundErr)
      }
    }

    const subscription = await activateTrial(user.id, planId)
    await refillCreditsForTrial(user.id)

    return NextResponse.json({
      success: true,
      message: "Payment verified. Your 14-day free trial is now active!",
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      planId,
      refunded,
      trialExpiry: subscription.trial_expiry,
    })
  } catch (error) {
    console.error("[verify-payment] Error:", error)
    const msg = error instanceof Error ? error.message : "Payment verification failed"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
