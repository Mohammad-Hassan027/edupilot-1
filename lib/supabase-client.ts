import { createClient } from "@supabase/supabase-js"

let client: ReturnType<typeof createClient> | null = null

export function getSupabaseBrowserClient() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Change console.error to console.warn right here!
    if (!url || !anonKey || url.includes("obesllmvoplvkzjltuns")) {
      console.warn(
        "⚠️ [Supabase Client]: Database initialization blocked. NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or invalid."
      )
      
      return createClient(
        "https://placeholder-invalid-domain.supabase.co",
        "placeholder-anon-key"
      )
    }

    client = createClient(url, anonKey)
  }
  return client
}
