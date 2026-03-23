const GEMINI_URL =
`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`

const TIMEOUT = 20000
const MAX_RETRIES = 2

async function callGemini(
prompt:string,
retry=0
):Promise<string>{

if(!process.env.GEMINI_API_KEY){

throw new Error(
"GEMINI_API_KEY missing"
)

}

try{

const controller =
new AbortController()

const timeout =
setTimeout(
()=>controller.abort(),
TIMEOUT
)

const res = await fetch(
GEMINI_URL,
{

method:"POST",

headers:{
"Content-Type":"application/json"
},

signal:controller.signal,

body:JSON.stringify({

contents:[
{
parts:[
{
text:prompt
}
]
}
],

generationConfig:{
temperature:0.7,
maxOutputTokens:1200,
topP:0.9,
topK:40
}

})

}
)

clearTimeout(timeout)

if(res.status===429){

if(retry < MAX_RETRIES){

await new Promise(
r=>setTimeout(r,2000)
)

return callGemini(
prompt,
retry+1
)

}

throw new Error(
"Rate limited"
)

}

if(!res.ok){

const err =
await res.text()

console.error(
"Gemini error:",
err
)

throw new Error(
`Gemini failed ${res.status}`
)

}

const data =
await res.json()

console.log(
"Gemini response:",
data
)

const text =
data?.candidates?.[0]
?.content?.parts?.[0]
?.text

if(!text){

return "I couldn't generate a response. Try again."

}

return text

}
catch(error){

console.error(
"AI error:",
error
)

if(retry < MAX_RETRIES){

await new Promise(
r=>setTimeout(r,1500)
)

return callGemini(
prompt,
retry+1
)

}

return "AI is temporarily unavailable. Please try again."

}

}

export async function generateAIResponse(
message:string
):Promise<string>{

const prompt =

`You are EduPilot AI Tutor.

You help students understand topics clearly.

Rules:

Explain step-by-step
Use simple English
Give examples
Format nicely
Be educational

Student question:

${message}

Answer:`

return callGemini(prompt)

}