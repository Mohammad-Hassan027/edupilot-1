export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { verifyRazorpaySignature, issueRefund } from "@/lib/payments"
import { getRazorpay } from "@/lib/payments"
import { updatePaymentRecord, activateTrial } from "@/lib/database"
import { refillCreditsForTrial } from "@/lib/database"

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
    } = await request.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment details" }, { status: 400 })
    }

    // Verify signature cryptographically
    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    )

    if (!isValid) {
      await updatePaymentRecord(razorpay_order_id, { status: "failed" })
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 })
    }

    // Fetch payment details from Razorpay
    const rp = getRazorpay()
    const payment = await rp.payments.fetch(razorpay_payment_id)

    // Update payment record
    await updatePaymentRecord(razorpay_order_id, {
      razorpay_payment_id,
      razorpay_signature,
      status: "captured",
    })

    // Issue ₹1 refund (verification charge)
    let refunded = false
    if (Number(payment.amount) === 100) {
      try {
        await issueRefund(razorpay_payment_id, 100)
        await updatePaymentRecord(razorpay_order_id, { status: "refunded", refunded: true })
        refunded = true
      } catch (refundError) {
        console.error("[verify-payment] Refund error:", refundError)
        // Non-fatal — trial still activates
      }
    }

    // Activate 14-day trial + refill credits
    const subscription = await activateTrial(user.id)
    await refillCreditsForTrial(user.id)

    return NextResponse.json({
      success: true,
      message: "Payment verified. Your 14-day trial has been activated!",
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      planId,
      refunded,
      trialExpiry: subscription.trial_expiry,
    })
  } catch (error) {
    console.error("[verify-payment] Error:", error)
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 })
  }
}
