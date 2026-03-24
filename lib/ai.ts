import Groq from "groq-sdk";

if (!process.env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY missing");
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

function formatResponse(text:string){

return text

.replace(/\n{3,}/g,"\n\n")

.replace(/•/g,"\n• ")

.replace(/(\d+\.)/g,"\n$1")

.replace(/Key Points:/g,"\nKey Points:\n")

.replace(/Example:/g,"\nExample:\n")

.replace(/Summary:/g,"\nSummary:\n")

.trim()

}

async function callAI(
prompt:string,
retry=0
):Promise<string>{

try{

const completion =
await groq.chat.completions.create({

messages:[

{
role:"system",

content:`
You are EduPilot AI Tutor.

Format answers like a professional textbook teacher.

Formatting rules:

Start with topic name

Definition section

Key Points section

Step explanation if needed

Example section

Summary section

Rules:

Do NOT use ###  
Do NOT use markdown headings  
Use clean readable formatting  
Use bullet points when helpful  
Use numbering for steps  
Keep spacing clean  
Use # only for keywords if needed
`

},

{
role:"user",
content:prompt
}

],

model:"llama3-8b-8192",

temperature:0.6,

max_tokens:1200

});

const text =
completion.choices[0]?.message?.content;

return formatResponse(
text || "No response generated"
);

}
catch(error){

console.error(error);

if(retry < 2){

await new Promise(
r=>setTimeout(r,1500)
);

return callAI(
prompt,
retry+1
);

}

return "AI temporarily unavailable.";

}

}

////////////////////////////////////////////////////
//// AI TUTOR
////////////////////////////////////////////////////

export async function generateAIResponse(
message:string
):Promise<string>{

return callAI(

`Explain clearly:

${message}

Structure answer professionally.`

);

}

////////////////////////////////////////////////////
//// QUIZ
////////////////////////////////////////////////////

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

const raw =
await callAI(

`Generate ${count} MCQ questions about ${topic}.

Return JSON only:

[
{
"question":"",
"options":["","","",""],
"answer":"",
"explanation":""
}
]`

);

try{

const cleaned =
raw.replace(/```json/g,"")
.replace(/```/g,"")
.trim();

return JSON.parse(cleaned);

}
catch{

throw new Error("Quiz generation failed");

}

}

////////////////////////////////////////////////////
//// FLASHCARDS
////////////////////////////////////////////////////

export interface Flashcard{

front:string
back:string

}

export async function generateFlashcards(

topic:string,
count=5

):Promise<Flashcard[]>{

const raw =
await callAI(

`Create ${count} flashcards about ${topic}.

Return JSON only:

[
{
"front":"",
"back":""
}
]`

);

try{

const cleaned =
raw.replace(/```json/g,"")
.replace(/```/g,"")
.trim();

return JSON.parse(cleaned);

}
catch{

throw new Error("Flashcard generation failed");

}

}

////////////////////////////////////////////////////
//// STUDY PLAN
////////////////////////////////////////////////////

export async function generateStudyPlan(

subject:string,
duration:string,
goal:string

):Promise<string>{

return callAI(

`Create study plan:

Subject:${subject}

Duration:${duration}

Goal:${goal}`

);

}