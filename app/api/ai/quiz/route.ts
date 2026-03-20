export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { generateQuiz } from "@/lib/ai"
import { consumeCredit } from "@/lib/credits"
import { logUsage } from "@/lib/database"

export async function POST(req:NextRequest){

try{

const body =
await req.json()

const topic =
body.topic

if(!topic){

return NextResponse.json(

{error:"Topic required"},

{status:400}

)

}

const user =
await getUser()

if(!user){

return NextResponse.json(

{error:"Login required"},

{status:401}

)

}

const credit =
await consumeCredit(

user.id,
"ai_chat"

)

if(!credit.allowed){

return NextResponse.json(

{error:"No credits"},

{status:402}

)

}

const quiz =
await generateQuiz(topic)

await logUsage(

user.id,
"ai_chat",
"quiz_generated"

)

return NextResponse.json({

success:true,
quiz

})

}catch(e){

console.error(e)

return NextResponse.json(

{error:"Quiz failed"},

{status:500}

)

}

}