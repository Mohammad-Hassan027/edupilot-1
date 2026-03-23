export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { generateAIResponse } from "@/lib/ai"
import { logUsage } from "@/lib/database"

export async function POST(req: NextRequest){

try{

const {message} = await req.json()

if(!message?.trim()){

return NextResponse.json({

error:"Message required"

},{status:400})

}

const user = await getUser()

// AI call
const aiResponse =
await generateAIResponse(message.trim())

// optional logging (no limits)
if(user){

await logUsage(
user.id,
"ai_chat",
"question",
{
length:message.length
}
).catch(()=>{})

}

return NextResponse.json({

success:true,
reply:aiResponse,
isGuest:!user

})

}catch(error){

console.error(error)

return NextResponse.json({

error:"AI failed"

},{status:500})

}

}