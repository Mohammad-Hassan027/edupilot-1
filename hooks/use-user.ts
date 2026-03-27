import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function useUser() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchUser = async () => {
    setLoading(true)

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      setUser(null)
      setLoading(false)
      return
    }

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", authUser.id)
      .single()

    setUser({
      ...authUser,
      plan: subscription?.plan || "free",
    })

    setLoading(false)
  }

  useEffect(() => {
    fetchUser()
  }, [])

  return { user, loading, refetch: fetchUser }
}