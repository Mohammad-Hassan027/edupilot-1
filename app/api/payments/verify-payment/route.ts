import { NextResponse } from "next/server"
import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
      user_id,
    } = body

    const sign = razorpay_order_id + "|" + razorpay_payment_id

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY!)
      .update(sign.toString())
      .digest("hex")

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ success: false })
    }

    // ✅ SAVE PAYMENT
    await supabase.from("payments").insert({
      user_id,
      plan,
      razorpay_payment_id,
      razorpay_order_id,
      status: "success",
    })

    // ✅ UPDATE SUBSCRIPTION (THIS WAS MISSING / WRONG)
    await supabase.from("subscriptions").upsert({
      user_id,
      plan_id: plan, // 'pro' or 'premium'
      status: "active",
      current_period_end: new Date(
        Date.now() + 14 * 24 * 60 * 60 * 1000
      ), // 14 days trial
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ success: false })
  }
}