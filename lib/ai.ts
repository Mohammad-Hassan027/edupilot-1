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

const id = setTimeout(
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
maxOutputTokens:1500,
topP:0.9,
topK:40
}

})
}
)

clearTimeout(id)

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
"Rate limit exceeded"
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

const text =
data?.candidates?.[0]
?.content?.parts?.[0]
?.text

if(!text){

throw new Error(
"Empty Gemini response"
)

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

return
"AI is temporarily unavailable. Please try again."

}

}

function cleanJSON(text:string){

return text
.replace(/```json/g,"")
.replace(/```/g,"")
.trim()

}

// ── AI Tutor ─────────────────────────────────

export async function generateAIResponse(
message:string
):Promise<string>{

const prompt =

`You are EduPilot AI Tutor.

ROLE:
Expert teacher helping students understand concepts deeply.

RULES:
Explain step-by-step
Use simple language
Give examples
Format clearly
Encourage learning
If coding → show examples
If math → show steps
If theory → summarize

Student question:
${message}

Answer:`

return callGemini(prompt)

}

// ── QUIZ ─────────────────────────────────

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

`Generate ${count} MCQ quiz questions about:

${topic}

Return ONLY valid JSON:

[
{
"question":"",
"options":["","","",""],
"answer":"",
"explanation":""
}
]

Rules:

4 options exactly
Answer must match option
Educational quality
No markdown
No explanation outside JSON`

const raw =
await callGemini(prompt)

try{

const parsed =
JSON.parse(
cleanJSON(raw)
)

if(!Array.isArray(parsed))
throw new Error()

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
"Quiz generation failed"
)

}

}

// ── FLASHCARDS ─────────────────────────────

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
]

Rules:

Important concepts
Clear answers
No markdown`

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
"Flashcard generation failed"
)

}

}

// ── STUDY PLAN ─────────────────────────────

export async function generateStudyPlan(

subject:string,
duration:string,
goal:string

):Promise<string>{

const prompt =

`Create a study plan.

Subject:
${subject}

Duration:
${duration}

Goal:
${goal}

Include:

Weekly roadmap
Topics
Study methods
Resources
Milestones
Tips

Format clearly.`

return callGemini(prompt)

}