import { getSupabaseServer } from "@/lib/supabase-server"
import type { PasswordStrength } from "@/types"

// ─── Password validation ─────────────────────────────────────────────────────

export function validatePassword(password: string): PasswordStrength {
  const checks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  }

  const passed = Object.values(checks).filter(Boolean).length

  const scoreMap: Record<number, PasswordStrength["score"]> = {
    0: 0, 1: 1, 2: 2, 3: 3, 4: 4,
  }

  const labelMap: Record<number, PasswordStrength["label"]> = {
    0: "Too weak",
    1: "Weak",
    2: "Fair",
    3: "Strong",
    4: "Very strong",
  }

  const colorMap: Record<number, string> = {
    0: "bg-red-500",
    1: "bg-red-400",
    2: "bg-yellow-400",
    3: "bg-emerald-400",
    4: "bg-emerald-500",
  }

  return {
    score: scoreMap[passed],
    label: labelMap[passed],
    color: colorMap[passed],
    checks,
  }
}

export function getPasswordErrors(password: string): string[] {
  const errors: string[] = []
  if (password.length < 8) errors.push("At least 8 characters")
  if (!/[A-Z]/.test(password)) errors.push("At least 1 uppercase letter")
  if (!/[0-9]/.test(password)) errors.push("At least 1 number")
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
    errors.push("At least 1 special character (!@#$%...)")
  return errors
}

// ─── Server-side session getter ──────────────────────────────────────────────

export async function getSession() {
  const supabase = getSupabaseServer()
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()
  if (error || !session) return null
  return session
}

export async function getUser() {
  const supabase = getSupabaseServer()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

// ─── Auth error messages ─────────────────────────────────────────────────────

export function mapAuthError(supabaseError: string): string {
  const map: Record<string, string> = {
    "Invalid login credentials": "Invalid email or password. Please try again.",
    "User already registered": "Account already exists. Please login.",
    "Email not confirmed": "Please verify your email before logging in.",
    "Too many requests": "Too many attempts. Please wait a few minutes.",
    "User not found": "No account found. Please register.",
    "Password should be at least 6 characters":
      "Password must be at least 8 characters.",
  }

  for (const [key, value] of Object.entries(map)) {
    if (supabaseError.includes(key)) return value
  }

  return supabaseError
}
