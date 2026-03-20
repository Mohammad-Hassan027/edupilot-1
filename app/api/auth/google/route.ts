export const dynamic="force-dynamic"

import { NextResponse }
from "next/server"

import { getSupabaseServer }
from "@/lib/supabase-server"

export async function GET(){

const supabase =
await getSupabaseServer()

const siteUrl =
process.env.NEXT_PUBLIC_SITE_URL

const { data } =
await supabase.auth.signInWithOAuth({

provider:"google",

options:{

redirectTo:
`${siteUrl}/auth/callback`

}

})

return NextResponse.redirect(
data.url
)

}