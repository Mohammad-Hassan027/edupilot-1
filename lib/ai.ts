const GEMINI_URL =
`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`

async function callGemini(
prompt:string
):Promise<string>{

if(!process.env.GEMINI_API_KEY){

throw new Error(
"GEMINI_API_KEY missing"
)

}

try{

const res = await fetch(
GEMINI_URL,
{
method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

contents:[
{
parts:[
{text:prompt}
]
}
],

generationConfig:{
temperature:0.7,
maxOutputTokens:1024
}

})

}
)

if(!res.ok){

// if quota error retry once
if(res.status===429){

await new Promise(
r=>setTimeout(r,3000)
)

return callGemini(prompt)

}

const err = await res.text()

throw new Error(err)

}

const data = await res.json()

const text =
data?.candidates?.[0]
?.content?.parts?.[0]
?.text

if(!text){

throw new Error(
"Empty AI response"
)

}

return text

}catch(error){

console.error(
"Gemini failed:",
error
)

return "AI temporarily unavailable. Please try again."

}

}

export async function generateAIResponse(
message:string
){

const prompt = `You are EduPilot AI Tutor.

Explain clearly.
Be educational.
Be structured.

Student question:
${message}

Answer clearly:`

return callGemini(prompt)

}