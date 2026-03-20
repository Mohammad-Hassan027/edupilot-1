import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"

export async function getSupabaseServer(){

const cookieStore = cookies()

return createServerClient(

process.env.NEXT_PUBLIC_SUPABASE_URL!,

process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,

{
cookies:{

get(name:string){

return cookieStore.get(name)?.value

},

set(){},

remove(){}

}

}

)

}

export async function getSupabaseAdmin(){

return createClient(

process.env.NEXT_PUBLIC_SUPABASE_URL!,

process.env.SUPABASE_SERVICE_ROLE_KEY!

)

}