import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"

export async function getSupabaseServer() {
  const cookieStore = await cookies()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Handle missing or clearly paused/broken production database URLs safely
  if (!url || !anonKey || url.includes("obesllmvoplvkzjltuns")) {
    console.warn(
      "⚠️ [Supabase Server]: Database initialization blocked. NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or invalid."
    )
    
    // Return a dummy server client layout so server-side logic doesn't crash on undefined properties
    return createServerClient(
      "https://placeholder-invalid-domain.supabase.co",
      "placeholder-anon-key",
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: Record<string, unknown>) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch {
              // Safe to ignore in read-only contexts
            }
          },
          remove(name: string, options: Record<string, unknown>) {
            try {
              cookieStore.set({ name, value: "", ...options })
            } catch {
              // Safe to ignore
            }
          },
        },
      }
    )
  }

  // Original working server client initialization block running safely when credentials exist
  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // set() can throw in read-only contexts (e.g. Server Components)
            // Safe to ignore — middleware handles session refresh in those cases
          }
        },
        remove(name: string, options: Record<string, unknown>) {
          try {
            cookieStore.set({ name, value: "", ...options })
          } catch {
            // Same as above
          }
        },
      },
    }
  )
}

export async function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey || url.includes("obesllmvoplvkzjltuns")) {
    console.warn(
      "⚠️ [Supabase Admin Utils]: Admin initialization blocked due to missing or invalid credentials."
    )
    return createClient(
      "https://placeholder-invalid-domain.supabase.co",
      "placeholder-service-key",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  }

  return createClient(
    url,
    serviceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}