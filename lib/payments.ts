import Razorpay from "razorpay"
import crypto from "crypto"

let razorpayInstance: Razorpay | null = null

export function getRazorpay(): Razorpay {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_SECRET_KEY

    if (!keyId || !keySecret) {
      throw new Error(
        "Missing RAZORPAY_KEY_ID or RAZORPAY_SECRET_KEY environment variables"
      )
    }

    razorpayInstance = new Razorpay({ key_id: keyId, key_secret: keySecret })
  }
  return razorpayInstance
}

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_SECRET_KEY
  if (!secret) return false

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex")

  return expected === signature
}

export async function createRazorpayOrder(
  amountInRupees: number,
  receipt: string,
  notes?: Record<string, string>
) {
  const rp = getRazorpay()
  return rp.orders.create({
    amount: Math.round(amountInRupees * 100), // paise
    currency: "INR",
    receipt,
    notes: notes ?? {},
  })
}

export async function issueRefund(paymentId: string, amountInPaise: number) {
  const rp = getRazorpay()
  return rp.payments.refund(paymentId, {
    amount: amountInPaise,
    notes: { reason: "EduPilot verification charge refund" },
  })
}
