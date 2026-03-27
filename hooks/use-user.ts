"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase-client"
import type { Credits, Profile, Subscription } from "@/types"

type UseUserState = {
  profile: Profile | null
  credits: Credits | null
  subscription: Subscription | null
  email: string | null
  fullName: string | null
  isLoading: boolean
  error: string | null
}

const initialState: UseUserState = {
  profile: null,
  credits: null,
  subscription: null,
  email: null,
  fullName: null,
  isLoading: true,
  error: null,
}

export function useUser() {
  const [state, setState] = useState<UseUserState>(initialState)
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])

  const fetchUser = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }))

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        throw authError
      }

      if (!user) {
        setState({
          ...initialState,
          isLoading: false,
          error: "not_authenticated",
        })
        return
      }

      const [profileResult, creditsResult, subscriptionResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("credits").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
      ])

      const profile = (profileResult.data as Profile | null) ?? null
      const credits = (creditsResult.data as Credits | null) ?? null
      const subscription = (subscriptionResult.data as Subscription | null) ?? null

      const normalizedSubscription: Subscription | null = subscription
        ? {
            ...subscription,
            plan_id:
              subscription.plan_id === "free" ||
              subscription.plan_id === "pro" ||
              subscription.plan_id === "premium"
                ? subscription.plan_id
                : subscription.status === "free"
                  ? "free"
                  : subscription.plan_id,
          }
        : null

      const fullName =
        profile?.full_name ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        null

      setState({
        profile,
        credits,
        subscription: normalizedSubscription,
        email: user.email ?? null,
        fullName,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      console.error("[useUser] Failed to fetch user:", error)

      setState({
        ...initialState,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to fetch user",
      })
    }
  }, [supabase])

  useEffect(() => {
    fetchUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchUser()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchUser, supabase])

  return {
    ...state,
    loading: state.isLoading,
    user: state.email
      ? {
          email: state.email,
          plan: state.subscription?.plan_id ?? "free",
        }
      : null,
    refetch: fetchUser,
  }
}