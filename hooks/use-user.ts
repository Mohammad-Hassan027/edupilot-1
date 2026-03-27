import { useCallback, useEffect, useMemo, useState } from "react"
import type { Credits, Profile, Subscription } from "@/types"

type UserPayload = {
  profile: Profile | null
  credits: Credits | null
  subscription: Subscription | null
  email: string | null
  authName: string | null
}

type UseUserState = {
  profile: Profile | null
  credits: Credits | null
  subscription: Subscription | null
  email: string | null
  authName: string | null
  isLoading: boolean
  error: string | null
}

type SubscriptionUpdatedDetail = {
  subscription?: Subscription | null
  email?: string | null
  authName?: string | null
}

declare global {
  interface WindowEventMap {
    "user-data-refresh": CustomEvent<SubscriptionUpdatedDetail>
  }
}

const INITIAL_STATE: UseUserState = {
  profile: null,
  credits: null,
  subscription: null,
  email: null,
  authName: null,
  isLoading: true,
  error: null,
}

const STORAGE_REFRESH_KEY = "edupilot-user-refresh"

export function useUser() {
  const [state, setState] = useState<UseUserState>(INITIAL_STATE)

  const refetch = useCallback(async (silent = false) => {
    if (!silent) {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))
    }

    try {
      const res = await fetch("/api/user/profile", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      })

      if (res.status === 401) {
        setState({
          ...INITIAL_STATE,
          isLoading: false,
          error: "not_authenticated",
        })
        return null
      }

      const json = await res.json().catch(() => null)

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to load user data")
      }

      const payload = (json.data ?? {}) as UserPayload

      setState({
        profile: payload.profile ?? null,
        credits: payload.credits ?? null,
        subscription: payload.subscription ?? null,
        email: payload.email ?? null,
        authName: payload.authName ?? null,
        isLoading: false,
        error: null,
      })

      return payload
    } catch (error) {
      console.error("[useUser] Failed to fetch user data:", error)
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load user data",
      }))
      return null
    }
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  useEffect(() => {
    const handleRefresh = (event: WindowEventMap["user-data-refresh"]) => {
      const detail = event.detail

      if (detail?.subscription || detail?.email || detail?.authName) {
        setState((prev) => ({
          ...prev,
          subscription: detail.subscription ?? prev.subscription,
          email: detail.email ?? prev.email,
          authName: detail.authName ?? prev.authName,
          isLoading: false,
          error: null,
        }))
      }

      try {
        localStorage.setItem(STORAGE_REFRESH_KEY, String(Date.now()))
      } catch {}

      void refetch(true)
    }

    const handleFocus = () => {
      void refetch(true)
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void refetch(true)
      }
    }

    const handlePageShow = () => {
      void refetch(true)
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_REFRESH_KEY) {
        void refetch(true)
      }
    }

    const intervalId = window.setInterval(() => {
      void refetch(true)
    }, 15000)

    window.addEventListener("user-data-refresh", handleRefresh)
    window.addEventListener("focus", handleFocus)
    window.addEventListener("pageshow", handlePageShow)
    window.addEventListener("storage", handleStorage)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("user-data-refresh", handleRefresh)
      window.removeEventListener("focus", handleFocus)
      window.removeEventListener("pageshow", handlePageShow)
      window.removeEventListener("storage", handleStorage)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.clearInterval(intervalId)
    }
  }, [refetch])

  const fullName = useMemo(() => {
    return state.profile?.full_name || state.authName || state.email?.split("@")[0] || "User"
  }, [state.profile?.full_name, state.authName, state.email])

  return {
    ...state,
    fullName,
    user: state.email
      ? {
          email: state.email,
          plan: state.subscription?.plan_id ?? "free",
        }
      : null,
    loading: state.isLoading,
    refetch,
  }
}
