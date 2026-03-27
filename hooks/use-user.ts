"use client"

import { useState, useEffect, useCallback } from "react"
import type { Profile, Credits, Subscription } from "@/types"
import { getSupabaseBrowserClient } from "@/lib/supabase-client"

interface UserData {
  profile: Profile | null
  credits: Credits | null
  subscription: Subscription | null
  email: string | null
  fullName: string | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

type CachedUserSnapshot = {
  profile: Profile | null
  credits: Credits | null
  subscription: Subscription | null
  email: string | null
  fullName: string | null
  fetchedAt: number
}

type SubscriptionOverride = {
  plan_id: "pro" | "premium"
  status: "trial" | "active"
  trial_active: boolean
  trial_start: string
  trial_expiry: string
  subscription_end: string | null
  savedAt: number
}

const CACHE_TTL_MS = 15_000
const AUTO_LOGOUT_AFTER_MS = 2 * 24 * 60 * 60 * 1000
const CACHE_KEY = "edupilot-user-cache"
const OVERRIDE_KEY = "edupilot-subscription-override"
const LAST_ACTIVE_KEY = "edupilot-last-active-at"

let memoryCache: CachedUserSnapshot | null = null
let inFlightFetch: Promise<void> | null = null
let listeners = new Set<(snapshot: CachedUserSnapshot | null) => void>()

function readSubscriptionOverride(): SubscriptionOverride | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(OVERRIDE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SubscriptionOverride
    if (!parsed?.plan_id || !parsed?.trial_expiry) return null
    if (new Date(parsed.trial_expiry).getTime() <= Date.now()) {
      localStorage.removeItem(OVERRIDE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function mergeSubscription(subscription: Subscription | null): Subscription | null {
  const override = readSubscriptionOverride()
  if (!override) return subscription

  if (!subscription) {
    return {
      id: "local-override",
      user_id: "local-override",
      status: override.status,
      plan_id: override.plan_id,
      trial_active: override.trial_active,
      trial_start: override.trial_start,
      trial_expiry: override.trial_expiry,
      subscription_start: override.trial_start,
      subscription_end: override.subscription_end,
      created_at: override.trial_start,
      updated_at: new Date().toISOString(),
    }
  }

  const serverExpiry = subscription.trial_expiry ? new Date(subscription.trial_expiry).getTime() : 0
  const overrideExpiry = new Date(override.trial_expiry).getTime()
  if (subscription.plan_id === override.plan_id && serverExpiry >= overrideExpiry) {
    try {
      localStorage.removeItem(OVERRIDE_KEY)
    } catch {}
    return subscription
  }

  return {
    ...subscription,
    status: override.status,
    plan_id: override.plan_id,
    trial_active: override.trial_active,
    trial_start: override.trial_start,
    trial_expiry: override.trial_expiry,
    subscription_start: subscription.subscription_start ?? override.trial_start,
    subscription_end: override.subscription_end,
  }
}

function readCachedSnapshot(): CachedUserSnapshot | null {
  if (memoryCache && Date.now() - memoryCache.fetchedAt < CACHE_TTL_MS) {
    return { ...memoryCache, subscription: mergeSubscription(memoryCache.subscription) }
  }

  if (typeof window === "undefined") return null

  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedUserSnapshot
    if (!parsed?.fetchedAt || Date.now() - parsed.fetchedAt >= CACHE_TTL_MS) return null
    memoryCache = parsed
    return { ...parsed, subscription: mergeSubscription(parsed.subscription) }
  } catch {
    return null
  }
}

function saveCachedSnapshot(snapshot: CachedUserSnapshot) {
  memoryCache = snapshot
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(snapshot))
  } catch {}
}

function broadcastSnapshot(snapshot: CachedUserSnapshot | null) {
  listeners.forEach((listener) => listener(snapshot))
}

export function persistSubscriptionOverride(planId: "pro" | "premium") {
  if (typeof window === "undefined") return
  const now = new Date()
  const expiry = new Date(now)
  expiry.setDate(expiry.getDate() + 14)

  const payload: SubscriptionOverride = {
    plan_id: planId,
    status: "trial",
    trial_active: true,
    trial_start: now.toISOString(),
    trial_expiry: expiry.toISOString(),
    subscription_end: null,
    savedAt: Date.now(),
  }

  try {
    localStorage.setItem(OVERRIDE_KEY, JSON.stringify(payload))
  } catch {}

  if (memoryCache) {
    const nextSnapshot: CachedUserSnapshot = {
      ...memoryCache,
      subscription: mergeSubscription(memoryCache.subscription),
      fetchedAt: Date.now(),
    }
    saveCachedSnapshot(nextSnapshot)
    broadcastSnapshot(nextSnapshot)
  } else {
    broadcastSnapshot(null)
  }

  window.dispatchEvent(new Event("user-data-refresh"))
}

async function enforceClientSessionTimeout() {
  if (typeof window === "undefined") return

  const supabase = getSupabaseBrowserClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    localStorage.removeItem(LAST_ACTIVE_KEY)
    return
  }

  const now = Date.now()
  const lastActiveRaw = localStorage.getItem(LAST_ACTIVE_KEY)
  const lastActive = lastActiveRaw ? Number(lastActiveRaw) : now

  if (Number.isFinite(lastActive) && now - lastActive > AUTO_LOGOUT_AFTER_MS) {
    await supabase.auth.signOut()
    localStorage.removeItem(LAST_ACTIVE_KEY)
    sessionStorage.removeItem(CACHE_KEY)
    localStorage.removeItem(OVERRIDE_KEY)
    memoryCache = null
    broadcastSnapshot(null)
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login"
    }
    return
  }

  localStorage.setItem(LAST_ACTIVE_KEY, String(now))
}

export function useUser(): UserData {
  const cached = readCachedSnapshot()
  const [profile, setProfile] = useState<Profile | null>(cached?.profile ?? null)
  const [credits, setCredits] = useState<Credits | null>(cached?.credits ?? null)
  const [subscription, setSubscription] = useState<Subscription | null>(cached?.subscription ?? null)
  const [email, setEmail] = useState<string | null>(cached?.email ?? null)
  const [fullName, setFullName] = useState<string | null>(cached?.fullName ?? null)
  const [isLoading, setIsLoading] = useState(!cached)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    enforceClientSessionTimeout().catch(() => {})

    const bumpActivity = () => {
      try {
        localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()))
      } catch {}
    }

    const events: Array<keyof WindowEventMap> = ["click", "keydown", "focus"]
    events.forEach((name) => window.addEventListener(name, bumpActivity, { passive: true }))

    return () => {
      events.forEach((name) => window.removeEventListener(name, bumpActivity))
    }
  }, [])

  useEffect(() => {
    let active = true
    getSupabaseBrowserClient().auth.getSession().then(({ data: { session } }) => {
      if (!active || !session?.user) return
      const u = session.user
      const name =
        u.user_metadata?.full_name ||
        u.user_metadata?.name ||
        u.email?.split("@")[0] ||
        "User"
      setEmail(u.email ?? null)
      setFullName(name)
    })

    const { data: { subscription: authSubscription } } = getSupabaseBrowserClient().auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = session.user
        const name =
          u.user_metadata?.full_name ||
          u.user_metadata?.name ||
          u.email?.split("@")[0] ||
          "User"
        setEmail(u.email ?? null)
        setFullName(name)
        void fetchData(true)
      } else {
        setProfile(null)
        setCredits(null)
        setSubscription(null)
        setEmail(null)
        setFullName(null)
        setIsLoading(false)
        memoryCache = null
        try {
          sessionStorage.removeItem(CACHE_KEY)
          localStorage.removeItem(OVERRIDE_KEY)
        } catch {}
      }
    })

    return () => {
      active = false
      authSubscription.unsubscribe()
    }
  }, [])

  const applySnapshot = useCallback((snapshot: CachedUserSnapshot | null) => {
    if (!snapshot) return
    setProfile(snapshot.profile)
    setCredits(snapshot.credits)
    setSubscription(mergeSubscription(snapshot.subscription))
    setEmail(snapshot.email)
    setFullName(snapshot.fullName)
    setIsLoading(false)
    setError(null)
  }, [])

  const fetchData = useCallback(async (force = false) => {
    const cachedSnapshot = !force ? readCachedSnapshot() : null
    if (cachedSnapshot) {
      applySnapshot(cachedSnapshot)
      return
    }

    if (inFlightFetch && !force) {
      setIsLoading(true)
      await inFlightFetch
      const afterInflight = readCachedSnapshot()
      if (afterInflight) applySnapshot(afterInflight)
      return
    }

    setIsLoading(true)
    setError(null)

    inFlightFetch = (async () => {
      const res = await fetch(`/api/user/profile?t=${Date.now()}`, { cache: "no-store" })
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("not_authenticated")
        }
        throw new Error("Failed to load user data")
      }

      const data = await res.json()
      const p: Profile | null = data.data.profile
      const e: string | null = data.data.email ?? null
      const nextSnapshot: CachedUserSnapshot = {
        profile: p,
        credits: data.data.credits,
        subscription: data.data.subscription,
        email: e,
        fullName:
          p?.full_name?.trim() ||
          (data.data.authName as string | null) ||
          e?.split("@")[0] ||
          fullName ||
          "User",
        fetchedAt: Date.now(),
      }
      saveCachedSnapshot(nextSnapshot)
      broadcastSnapshot(nextSnapshot)
    })()

    try {
      await inFlightFetch
      const next = readCachedSnapshot()
      if (next) applySnapshot(next)
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error"
      setError(message)
      setIsLoading(false)
    } finally {
      inFlightFetch = null
    }
  }, [applySnapshot, fullName])

  useEffect(() => {
    const listener = (snapshot: CachedUserSnapshot | null) => {
      if (snapshot) applySnapshot(snapshot)
      else if (memoryCache) applySnapshot(memoryCache)
      else setSubscription((prev) => mergeSubscription(prev))
    }

    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [applySnapshot])

  useEffect(() => {
    void fetchData(false)

    const handleRefresh = () => {
      void fetchData(true)
    }

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void fetchData(false)
      }
    }

    window.addEventListener("user-data-refresh", handleRefresh)
    window.addEventListener("focus", handleRefresh)
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      window.removeEventListener("user-data-refresh", handleRefresh)
      window.removeEventListener("focus", handleRefresh)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [fetchData])

  const refetch = useCallback(() => {
    void fetchData(true)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("user-data-refresh"))
    }
  }, [fetchData])

  return { profile, credits, subscription: mergeSubscription(subscription), email, fullName, isLoading, error, refetch }
}
