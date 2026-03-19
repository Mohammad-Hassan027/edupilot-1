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

    const { planId } = await request.json()

    if (!planId) {
      return NextResponse.json({ error: "planId is required" }, { status: 400 })
    }

    // Trial activation costs ₹1
    const amount = 1

    const receipt = `edupilot_${user.id.slice(0, 8)}_${Date.now()}`
    const order = await createRazorpayOrder(amount, receipt, {
      planId,
      userId: user.id,
      email: user.email ?? "",
    })

    // Persist payment record in DB
    await createPaymentRecord(user.id, order.id, amount * 100, planId)

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      razorpayKey: process.env.RAZORPAY_KEY_ID,
    })
  } catch (error) {
    console.error("[create-order] Error:", error)
    return NextResponse.json({ error: "Failed to create payment order" }, { status: 500 })
  }
}
