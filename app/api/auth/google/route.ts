export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"

export async function GET(req: NextRequest){

  const supabase =
  await getSupabaseServer()

  const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL

  if(!siteUrl){

    return NextResponse.json({

      error:"SITE_URL missing"

    },{status:500})

  }

  const { data, error } =
  await supabase.auth.signInWithOAuth({

    provider:"google",

    options:{

      redirectTo:
      `${siteUrl}/auth/callback`,

      queryParams:{
        access_type:"offline",
        prompt:"consent"
      }

    }

  })

  if(error || !data?.url){

    return NextResponse.redirect(

      `${siteUrl}/login?error=oauth_failed`

    )

  }

  return NextResponse.redirect(
    data.url
  )

}