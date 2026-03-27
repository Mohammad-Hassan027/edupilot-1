"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase-client"

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 2
const ACTIVITY_KEY = "edupilot:last-activity-at"

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/pricing",
  "/features",
  "/help-center",
  "/privacy-policy",
  "/terms-of-service",
  "/cookie-policy",
  "/contact",
])

export function SessionTimeoutManager() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!pathname || PUBLIC_PATHS.has(pathname) || pathname.startsWith("/blogs")) {
      return
    }

    let disposed = false

    const touch = () => {
      localStorage.setItem(ACTIVITY_KEY, String(Date.now()))
    }

    const logout = async () => {
      try {
        await fetch("/api/auth/logout", { method: "POST" })
        await getSupabaseBrowserClient().auth.signOut()
      } catch {
        // no-op
      } finally {
        if (!disposed) {
          localStorage.removeItem(ACTIVITY_KEY)
          router.replace("/login?sessionExpired=1")
          router.refresh()
        }
      }
    }

    const check = async () => {
      const { data: { session } } = await getSupabaseBrowserClient().auth.getSession()
      if (!session?.user) {
        localStorage.removeItem(ACTIVITY_KEY)
        return
      }

      const lastActivity = Number(localStorage.getItem(ACTIVITY_KEY) || 0)
      if (!lastActivity) {
        touch()
        return
      }

      if (Date.now() - lastActivity > SESSION_TTL_MS) {
        await logout()
      }
    }

    void check()

    const events = ["click", "keydown", "mousemove", "scroll", "touchstart"]
    events.forEach((eventName) => window.addEventListener(eventName, touch, { passive: true }))

    const interval = window.setInterval(() => {
      void check()
    }, 60 * 1000)

    return () => {
      disposed = true
      events.forEach((eventName) => window.removeEventListener(eventName, touch))
      window.clearInterval(interval)
    }
  }, [pathname, router])

  return null
}
