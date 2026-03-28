export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { createRazorpayOrder } from "@/lib/payments"
import { createPaymentRecord } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const planId = body?.planId

    if (!planId) {
      return NextResponse.json({ error: "planId is required" }, { status: 400 })
    }

    if (planId !== "pro" && planId !== "premium") {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 })
    }

    // Validate Razorpay keys are present before attempting order creation
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_SECRET_KEY) {
      console.error("[create-order] Razorpay keys missing from environment")
      return NextResponse.json(
        { error: "Payment system not configured. Please contact support." },
        { status: 503 }
      )
    }

    const amountInRupees = 1
    const receipt = `ep_${user.id.slice(0, 8)}_${Date.now()}`.slice(0, 40)
    const order = await createRazorpayOrder(amountInRupees, receipt, {
      planId,
      userId: user.id,
      email: user.email ?? "",
      chargeType: "trial_verification",
    
    })

    // Save payment record (non-fatal if DB write fails)
    await createPaymentRecord(user.id, order.id, amountInRupees * 100, planId).catch((err) => {
      console.error("[create-order] Failed to save payment record:", err)
    })

    return NextResponse.json({
      success:     true,
      orderId:     order.id,
      amount:      order.amount,
      currency:    order.currency,
      razorpayKey: process.env.RAZORPAY_KEY_ID,
    })
  } catch (error) {
    console.error("[create-order] Error:", error)
    const msg = error instanceof Error ? error.message : "Failed to create payment order"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
