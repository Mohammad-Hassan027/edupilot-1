export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import {
  activatePlanSubscription,
  refillCreditsForTrial,
  updatePaymentRecord,
  createSubscription,
  getSubscription,
} from "@/lib/database"
import { fetchRazorpayPayment, verifyRazorpaySignature } from "@/lib/payments"

export async function POST(req: Request) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))

    const razorpay_order_id = body?.razorpay_order_id
    const razorpay_payment_id = body?.razorpay_payment_id
    const razorpay_signature = body?.razorpay_signature
    const planId = body?.planId

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planId) {
      return NextResponse.json(
        { success: false, error: "Missing payment verification fields" },
        { status: 400 }
      )
    }

    if (planId !== "pro" && planId !== "premium") {
      return NextResponse.json({ success: false, error: "Invalid plan selected" }, { status: 400 })
    }

    const isValidSignature = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    )

    if (!isValidSignature) {
      await updatePaymentRecord(razorpay_order_id, {
        razorpay_payment_id,
        razorpay_signature,
        status: "failed",
      }).catch(() => {})

      return NextResponse.json({ success: false, error: "Invalid payment signature" }, { status: 400 })
    }

    const payment = await fetchRazorpayPayment(razorpay_payment_id)

    if (!payment || payment.order_id !== razorpay_order_id) {
      await updatePaymentRecord(razorpay_order_id, {
        razorpay_payment_id,
        razorpay_signature,
        status: "failed",
      }).catch(() => {})

      return NextResponse.json({ success: false, error: "Payment order mismatch" }, { status: 400 })
    }

    if (!["captured", "authorized"].includes(payment.status)) {
      await updatePaymentRecord(razorpay_order_id, {
        razorpay_payment_id,
        razorpay_signature,
        status: "failed",
      }).catch(() => {})

      return NextResponse.json({ success: false, error: `Payment is ${payment.status}. Please complete the test payment.` }, { status: 400 })
    }

    const existingSubscription = await getSubscription(user.id)
    if (!existingSubscription) {
      await createSubscription(user.id).catch(() => {})
    }

    await updatePaymentRecord(razorpay_order_id, {
      razorpay_payment_id,
      razorpay_signature,
      status: "captured",
    }).catch((error) => {
      console.error("[verify-payment] Payment record update warning:", error)
    })

    await activatePlanSubscription(user.id, planId)
    await refillCreditsForTrial(user.id).catch(() => {})
    const subscription = await getSubscription(user.id)

    return NextResponse.json({
      success: true,
      message: `${planId === "premium" ? "Premium" : "Pro"} plan activated successfully`,
      subscription,
      paymentStatus: payment.status,
    })
  } catch (error) {
    console.error("[verify-payment] Error:", error)
    const message = error instanceof Error ? error.message : "Payment verification failed"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
