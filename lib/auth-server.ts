import { getSupabaseServer } from "@/lib/supabase-server"

export async function getSession() {
  const supabase = getSupabaseServer()

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session) return null

  return session
}

export async function getUser() {
  const supabase = getSupabaseServer()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null

  return user
}