const GEMINI_URL =
`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`

const TIMEOUT = 20000
const MAX_RETRIES = 2

async function callGemini(
prompt:string,
retry=0
):Promise<string>{

if(!process.env.GEMINI_API_KEY){

throw new Error("GEMINI_API_KEY missing")

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

throw new Error("Rate limited")

}

if(!res.ok){

const err =
await res.text()

console.error(err)

throw new Error(
`Gemini failed ${res.status}`
)

}

const data =
await res.json()

const text =
data?.candidates?.[0]
?.content?.parts?.[0]
?.text

if(!text){

return "No response generated"

}

return text

}
catch(error){

console.error(error)

if(retry < MAX_RETRIES){

await new Promise(
r=>setTimeout(r,1500)
)

return callGemini(
prompt,
retry+1
)

}

return "AI temporarily unavailable"

}

}

function cleanJSON(text:string){

return text
.replace(/```json/g,"")
.replace(/```/g,"")
.trim()

}

//////////////////////////////////////////////////
//// AI TUTOR
//////////////////////////////////////////////////

export async function generateAIResponse(
message:string
):Promise<string>{

const prompt =

`You are EduPilot AI Tutor.

Explain clearly.
Be educational.
Give examples.
Answer step-by-step.

Question:

${message}

Answer:`

return callGemini(prompt)

}

//////////////////////////////////////////////////
//// QUIZ
//////////////////////////////////////////////////

export interface QuizQuestion{

question:string
options:string[]
answer:string
explanation:string

}

export async function generateQuiz(

topic:string,
count=5

):Promise<QuizQuestion[]>{

const prompt =

`Generate ${count} MCQ questions about:

${topic}

Return ONLY JSON:

[
{
"question":"",
"options":["","","",""],
"answer":"",
"explanation":""
}
]`

const raw =
await callGemini(prompt)

try{

const parsed =
JSON.parse(
cleanJSON(raw)
)

return parsed
.slice(0,count)
.map((q:any)=>({

question:
q.question || "Question",

options:
Array.isArray(q.options)
? q.options.slice(0,4)
: ["A","B","C","D"],

answer:
q.answer || "",

explanation:
q.explanation || ""

}))

}
catch{

throw new Error(
"Quiz format invalid"
)

}

}

//////////////////////////////////////////////////
//// FLASHCARDS
//////////////////////////////////////////////////

export interface Flashcard{

front:string
back:string

}

export async function generateFlashcards(

topic:string,
count=5

):Promise<Flashcard[]>{

const prompt =

`Create ${count} flashcards about:

${topic}

Return ONLY JSON:

[
{
"front":"",
"back":""
}
]`

const raw =
await callGemini(prompt)

try{

const parsed =
JSON.parse(
cleanJSON(raw)
)

return parsed
.slice(0,count)
.map((f:any)=>({

front:
f.front || "Term",

back:
f.back || "Definition"

}))

}
catch{

throw new Error(
"Flashcard format invalid"
)

}

}

//////////////////////////////////////////////////
//// STUDY PLAN
//////////////////////////////////////////////////

export async function generateStudyPlan(

subject:string,
duration:string,
goal:string

):Promise<string>{

const prompt =

`Create study plan.

Subject:
${subject}

Duration:
${duration}

Goal:
${goal}

Include:

Topics
Schedule
Resources
Tips`

return callGemini(prompt)

}