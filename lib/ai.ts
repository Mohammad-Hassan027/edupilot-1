const GEMINI_URL =
`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`

async function callGemini(prompt:string):Promise<string>{

if(!process.env.GEMINI_API_KEY){

throw new Error("Missing GEMINI_API_KEY")

}

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

const err = await res.text()

throw new Error(err)

}

const data = await res.json()

const text =
data?.candidates?.[0]
?.content?.parts?.[0]
?.text

if(!text){

throw new Error("Empty AI response")

}

return text

}

//
// AI CHAT
//

export async function generateAIResponse(
message:string
){

const prompt = `You are EduPilot AI tutor.

Explain clearly.
Be structured.
Be educational.

Question:
${message}

Answer:`

return callGemini(prompt)

}

//
// QUIZ
//

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

const prompt = `Generate ${count} MCQ quiz questions about ${topic}.

Return ONLY JSON:

[
{
"question":"",
"options":["","","",""],
"answer":"",
"explanation":""
}
]
`

const raw =
await callGemini(prompt)

const cleaned =
raw.replace(/```json/g,"")
.replace(/```/g,"")
.trim()

const parsed =
JSON.parse(cleaned)

return parsed.slice(0,count)

}

//
// FLASHCARDS
//

export interface Flashcard{

front:string
back:string

}

export async function generateFlashcards(
topic:string,
count=5
):Promise<Flashcard[]>{

const prompt = `Generate ${count} flashcards about ${topic}.

Return ONLY JSON:

[
{
"front":"",
"back":""
}
]
`

const raw =
await callGemini(prompt)

const cleaned =
raw.replace(/```json/g,"")
.replace(/```/g,"")
.trim()

const parsed =
JSON.parse(cleaned)

return parsed.slice(0,count)

}

//
// STUDY PLAN
//

export async function generateStudyPlan(
subject:string,
duration:string,
goal:string
){

const prompt = `Create study plan:

Subject:${subject}
Duration:${duration}
Goal:${goal}

Include schedule and topics.`

return callGemini(prompt)

}