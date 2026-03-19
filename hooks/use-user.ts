"use client"

import { useState, useEffect, useCallback } from "react"
import type { Profile, Credits, Subscription } from "@/types"

interface UserData {
  profile: Profile | null
  credits: Credits | null
  subscription: Subscription | null
  email: string | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useUser(): UserData {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [credits, setCredits] = useState<Credits | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
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
      setProfile(data.data.profile)
      setCredits(data.data.credits)
      setSubscription(data.data.subscription)
      setEmail(data.data.email)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch_()
  }, [fetch_])

  return { profile, credits, subscription, email, isLoading, error, refetch: fetch_ }
}
