"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
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

type UserContextValue = UseUserState & {
  fullName: string
  loading: boolean
  user: { email: string; plan: string } | null
  refetch: (silent?: boolean, force?: boolean) => Promise<UserPayload | null>
  setUserState: (updater: Partial<UseUserState> | ((prev: UseUserState) => UseUserState)) => void
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
const USER_CACHE_TTL = 60_000

let sharedUserState: UseUserState = INITIAL_STATE
let sharedFetchedAt = 0
let inflightRequest: Promise<UserPayload | null> | null = null

const UserContext = createContext<UserContextValue | null>(null)

async function fetchUserProfile(): Promise<UserPayload | null> {
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
    throw new Error("not_authenticated")
  }

  const json = await res.json().catch(() => null)

  if (!res.ok || !json?.success) {
    throw new Error(json?.error || "Failed to load user data")
  }

  return (json.data ?? {}) as UserPayload
}

export function UserDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UseUserState>(sharedUserState)
  const mountedRef = useRef(false)

  const applyState = useCallback((next: UseUserState) => {
    sharedUserState = next
    setState(next)
  }, [])

  const setUserState: UserContextValue["setUserState"] = useCallback((updater) => {
    setState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater }
      sharedUserState = next
      return next
    })
  }, [])

  const refetch = useCallback(async (silent = false, force = false) => {
    const now = Date.now()
    const hasFreshCache = sharedFetchedAt > 0 && now - sharedFetchedAt < USER_CACHE_TTL

    if (!force && hasFreshCache && !sharedUserState.error) {
      if (!silent) {
        applyState({ ...sharedUserState, isLoading: false })
      }
      return {
        profile: sharedUserState.profile,
        credits: sharedUserState.credits,
        subscription: sharedUserState.subscription,
        email: sharedUserState.email,
        authName: sharedUserState.authName,
      }
    }

    if (!silent) {
      applyState({ ...sharedUserState, isLoading: true, error: null })
    }

    if (!inflightRequest) {
      inflightRequest = fetchUserProfile()
        .then((payload) => {
          const nextState: UseUserState = {
            profile: payload?.profile ?? null,
            credits: payload?.credits ?? null,
            subscription: payload?.subscription ?? null,
            email: payload?.email ?? null,
            authName: payload?.authName ?? null,
            isLoading: false,
            error: null,
          }
          sharedFetchedAt = Date.now()
          sharedUserState = nextState
          setState(nextState)
          return payload
        })
        .catch((error) => {
          const nextState: UseUserState = {
            ...INITIAL_STATE,
            isLoading: false,
            error: error instanceof Error ? error.message : "Failed to load user data",
          }
          sharedFetchedAt = Date.now()
          sharedUserState = nextState
          setState(nextState)
          return null
        })
        .finally(() => {
          inflightRequest = null
        })
    }

    return inflightRequest
  }, [applyState])

  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true
    void refetch(false)
  }, [refetch])

  useEffect(() => {
    const forceRefresh = () => {
      sharedFetchedAt = 0
      void refetch(true, true)
    }

    const handleRefresh = (event: WindowEventMap["user-data-refresh"]) => {
      const detail = event.detail

      if (detail?.subscription || detail?.email || detail?.authName) {
        setUserState((prev) => ({
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

      forceRefresh()
    }

    const handleFocus = () => {
      if (Date.now() - sharedFetchedAt > USER_CACHE_TTL) {
        forceRefresh()
      }
    }

    const handleVisibilityChange = () => {
      if (!document.hidden && Date.now() - sharedFetchedAt > USER_CACHE_TTL) {
        forceRefresh()
      }
    }

    const handlePageShow = () => {
      if (Date.now() - sharedFetchedAt > USER_CACHE_TTL) {
        forceRefresh()
      }
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_REFRESH_KEY) {
        forceRefresh()
      }
    }

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
    }
  }, [refetch, setUserState])

  const fullName = useMemo(() => {
    return state.profile?.full_name || state.authName || state.email?.split("@")[0] || "User"
  }, [state.profile?.full_name, state.authName, state.email])

  const value = useMemo<UserContextValue>(() => ({
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
    setUserState,
  }), [state, fullName, refetch, setUserState])

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)

  if (!context) {
    throw new Error("useUser must be used within UserDataProvider")
  }

  return context
}