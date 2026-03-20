"use client"

import { useState, useEffect, useCallback } from "react"
import type { Profile, Credits, Subscription } from "@/types"

interface UserData {
  profile: Profile | null
  credits: Credits | null
  subscription: Subscription | null
  email: string | null
  fullName: string | null        // always resolved: profile name → Google name → email prefix
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

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/user/profile")
      if (!res.ok) {
        if (res.status === 401) {
          setError("not_authenticated")
          return
        }
        throw new Error("Failed to load user data")
      }
      const data = await res.json()

      const p: Profile | null = data.data.profile
      const e: string | null  = data.data.email ?? null

      setProfile(p)
      setCredits(data.data.credits)
      setSubscription(data.data.subscription)
      setEmail(e)

      // Resolve display name: profile → Google metadata → email prefix → "User"
      const resolvedName =
        p?.full_name?.trim() ||
        (data.data.authName as string | null) ||
        e?.split("@")[0] ||
        "User"
      setFullName(resolvedName)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { profile, credits, subscription, email, fullName, isLoading, error, refetch: fetchData }
}
