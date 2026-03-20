import { getSupabaseServer }
from "./supabase-server"

export async function getUser(){

const supabase =
await getSupabaseServer()

const { data } =
await supabase.auth.getUser()

return data.user

}