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

export function useUser(): UserData {
  const [profile, setProfile]           = useState<Profile | null>(null)
  const [credits, setCredits]           = useState<Credits | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [email, setEmail]               = useState<string | null>(null)
  const [fullName, setFullName]         = useState<string | null>(null)
  const [isLoading, setIsLoading]       = useState(true)
  const [error, setError]               = useState<string | null>(null)

  // Phase 1: read name INSTANTLY from Supabase local session (no network)
  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = session.user
        const name =
          u.user_metadata?.full_name ||
          u.user_metadata?.name ||
          u.email?.split("@")[0] ||
          "User"
        setEmail(u.email ?? null)
        setFullName(name)
      }
    })
  }, [])

  // Phase 2: fetch full profile data (credits, subscription, etc.)
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await fetch(`/api/user/profile?t=${Date.now()}`, { cache: "no-store" })
      if (!res.ok) {
        if (res.status === 401) { setError("not_authenticated"); return }
        throw new Error("Failed to load user data")
      }
      const data = await res.json()
      const p: Profile | null = data.data.profile
      const e: string | null  = data.data.email ?? null

      setProfile(p)
      setCredits(data.data.credits)
      setSubscription(data.data.subscription)
      setEmail(e)

      // Update name with full DB profile if available
      const resolvedName =
        p?.full_name?.trim() ||
        (data.data.authName as string | null) ||
        e?.split("@")[0] ||
        fullName ||
        "User"
      setFullName(resolvedName)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }, [fullName])

  useEffect(() => {
    fetchData()
  }, [])   // eslint-disable-line react-hooks/exhaustive-deps

  return { profile, credits, subscription, email, fullName, isLoading, error, refetch: fetchData }
}
