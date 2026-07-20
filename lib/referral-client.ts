"use client"

// Client-only helpers for capturing a `?ref=CODE` referral code so it
// survives navigation between the marketing site and the register page
// (e.g. a user lands on /login?ref=ABC123 first, or bookmarks the link).

const STORAGE_KEY = "ep_referral_code"

/**
 * Reads `?ref=` from the current URL and persists it to localStorage so it
 * can be picked up later even if the user doesn't register immediately.
 * Safe to call on every page load (auth layout does this).
 */
export function captureReferralCode(): void {
  if (typeof window === "undefined") return

  try {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get("ref")
    if (ref && ref.trim()) {
      window.localStorage.setItem(STORAGE_KEY, ref.trim().toUpperCase())
    }
  } catch {
    // localStorage can throw in privacy modes — capture is best-effort.
  }
}

/** Returns the most recently captured referral code, if any. */
export function getStoredReferralCode(): string | null {
  if (typeof window === "undefined") return null

  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

/** Clears the stored referral code (call after a successful redemption). */
export function clearStoredReferralCode(): void {
  if (typeof window === "undefined") return

  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
