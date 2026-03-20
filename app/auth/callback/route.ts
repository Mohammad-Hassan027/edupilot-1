export const dynamic = "force-dynamic"

import { NextRequest, NextResponse }
from "next/server"

import { getSupabaseServer }
from "@/lib/supabase-server"

import {
getProfile,
createProfile,
createCredits,
createSubscription
}
from "@/lib/database"

export async function GET(req:NextRequest){

const siteUrl =
process.env.NEXT_PUBLIC_SITE_URL

if(!siteUrl){

return NextResponse.json({

error:"SITE_URL missing"

},{status:500})

}

const { searchParams } =
new URL(req.url)

const code =
searchParams.get("code")

const error =
searchParams.get("error")

if(error){

return NextResponse.redirect(

`${siteUrl}/login?error=oauth_${error}`

)

}

if(!code){

return NextResponse.redirect(

`${siteUrl}/login?error=no_code`

)

}

const supabase =
await getSupabaseServer()

const { data, error:exchangeError }
=
await supabase.auth
.exchangeCodeForSession(code)

if(exchangeError || !data?.user){

return NextResponse.redirect(

`${siteUrl}/login?error=session_failed`

)

}

const user = data.user

// First login provisioning

const existingProfile =
await getProfile(user.id)

if(!existingProfile){

const fullName =

user.user_metadata?.full_name ||

user.user_metadata?.name ||

user.email?.split("@")[0] ||

"User"

await Promise.all([

createProfile(
user.id,
user.email!,
fullName
),

createCredits(
user.id
),

createSubscription(
user.id
)

])

}

return NextResponse.redirect(

`${siteUrl}/dashboard`

)

}