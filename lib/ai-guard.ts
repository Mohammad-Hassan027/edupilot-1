import { NextResponse } from "next/server"
import type { User } from "@supabase/supabase-js"
import { getUser } from "@/lib/auth-server"
import { rateLimit } from "@/lib/rate-limit"
import { consumeCredit } from "@/lib/credits"
import type { FeatureKey } from "@/types"

type GuardSuccess = { user: User; error?: never }
type GuardFailure = { user?: never; error: NextResponse }

/**
 * Guards paid AI-generation endpoints against cost abuse.
 *
 * Runs three checks in order, BEFORE any external AI API is called:
 *   1. Authentication  -> 401 for anonymous requests
 *   2. Rate limiting    -> 429 when the per-user burst limit is exceeded
 *   3. Credit consumption -> 402 when the user is out of credits
 *
 * On success it returns the authenticated user. On failure it returns a
 * ready-to-return NextResponse so callers can simply do:
 *
 *   const guard = await requireAiAccess()
 *   if (guard.error) return guard.error
 *   const { user } = guard
 */
export async function requireAiAccess(
  feature: FeatureKey = "ai_chat",
  options: { consume?: boolean } = {}
): Promise<GuardSuccess | GuardFailure> {
  const user = await getUser()

  if (!user) {
    return {
      error: NextResponse.json(
        { error: "Login required to use this feature.", code: "UNAUTHORIZED", requiresLogin: true },
        { status: 401 }
      ),
    }
  }

  if (!rateLimit(user.id)) {
    return {
      error: NextResponse.json(
        { error: "Too many requests. Please wait a minute and try again.", code: "RATE_LIMITED" },
        { status: 429 }
      ),
    }
  }

  if (options.consume !== false) {
    const credit = await consumeCredit(user.id, feature)
    if (!credit.allowed) {
      return {
        error: NextResponse.json(
          {
            error: "You've run out of AI credits. Upgrade your plan or wait for your credits to refresh.",
            code: "NO_CREDITS",
            requiresUpgrade: true,
          },
          { status: 402 }
        ),
      }
    }
  }

  return { user }
}
