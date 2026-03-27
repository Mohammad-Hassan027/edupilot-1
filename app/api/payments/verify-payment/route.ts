export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import crypto from "crypto"
import { getUser } from "@/lib/auth-server"
import {
  activateTrial,
  refillCreditsForTrial,
  updatePaymentRecord,
  createSubscription,
  getSubscription,
} from "@/lib/database"

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

    const sign = `${razorpay_order_id}|${razorpay_payment_id}`
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY!)
      .update(sign)
      .digest("hex")

    if (expectedSignature !== razorpay_signature) {
      await updatePaymentRecord(razorpay_order_id, {
        razorpay_payment_id,
        razorpay_signature,
        status: "failed",
      }).catch(() => {})

      return NextResponse.json({ success: false, error: "Invalid payment signature" }, { status: 400 })
    }

    const existingSubscription = await getSubscription(user.id)
    if (!existingSubscription) {
      await createSubscription(user.id).catch(() => {})
    }

    await updatePaymentRecord(razorpay_order_id, {
      razorpay_payment_id,
      razorpay_signature,
      status: "captured",
    })

    const subscription = await activateTrial(user.id, planId)
    await refillCreditsForTrial(user.id).catch(() => {})

    return NextResponse.json({
      success: true,
      message: `You are on ${planId === "premium" ? "Premium" : "Pro"}`,
      subscription,
    })
  } catch (error) {
    console.error("[verify-payment] Error:", error)
    const message = error instanceof Error ? error.message : "Payment verification failed"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
