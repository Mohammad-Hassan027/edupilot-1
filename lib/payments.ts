import crypto from "crypto"

// ── Razorpay order creation via REST API (no SDK singleton issues) ─────────────
// Using direct HTTP calls instead of the Razorpay SDK to avoid CommonJS/ESM 
// compatibility issues and singleton caching of missing env vars.

function getKeys() {
  const keyId     = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_SECRET_KEY

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay keys not configured. Add RAZORPAY_KEY_ID and RAZORPAY_SECRET_KEY to your environment variables in Vercel."
    )
  }
  return { keyId, keySecret }
}

function basicAuth(keyId: string, keySecret: string): string {
  return "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64")
}

export interface RazorpayOrder {
  id: string
  amount: number
  currency: string
  receipt: string
  status: string
}

export async function createRazorpayOrder(
  amountInRupees: number,
  receipt: string,
  notes?: Record<string, string>
): Promise<RazorpayOrder> {
  const { keyId, keySecret } = getKeys()

  const body = {
    amount:   Math.round(amountInRupees * 100), // paise
    currency: "INR",
    receipt:  receipt.slice(0, 40),             // Razorpay max 40 chars
    notes:    notes ?? {},
  }

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": basicAuth(keyId, keySecret),
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = (err as { error?: { description?: string } }).error?.description || `Razorpay API error: ${res.status}`
    throw new Error(msg)
  }

  return res.json() as Promise<RazorpayOrder>
}

export async function fetchRazorpayPayment(paymentId: string) {
  const { keyId, keySecret } = getKeys()

  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
    headers: { "Authorization": basicAuth(keyId, keySecret) },
  })

  if (!res.ok) throw new Error(`Failed to fetch payment: ${res.status}`)
  return res.json()
}

export async function issueRefund(paymentId: string, amountInPaise: number) {
  const { keyId, keySecret } = getKeys()

  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": basicAuth(keyId, keySecret),
    },
    body: JSON.stringify({
      amount: amountInPaise,
      notes:  { reason: "EduPilot verification charge refund" },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Refund failed: ${JSON.stringify(err)}`)
  }
  return res.json()
}

export function verifyRazorpaySignature(
  orderId:   string,
  paymentId: string,
  signature: string
): boolean {
  const { keySecret } = getKeys()

  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex")

  return expected === signature
}
