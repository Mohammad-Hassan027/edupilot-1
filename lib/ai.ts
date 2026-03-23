import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function callAI(
prompt: string,
retry = 0
): Promise<string> {

try {

const completion =
await groq.chat.completions.create({

messages: [

{
role: "system",
content:
"You are EduPilot AI Tutor. You help students understand topics step-by-step in simple language.",
},

{
role: "user",
content: prompt,
}

],

model: "llama3-8b-8192",

temperature: 0.7,

max_tokens: 1200

});

const text =
completion.choices[0]?.message?.content;

if (!text)
return "No response generated";

return text;

}
catch (error) {

console.error(error);

if (retry < 2) {

await new Promise(
r => setTimeout(r, 1500)
);

return callAI(
prompt,
retry + 1
);

}

return "AI temporarily unavailable.";

}

}

////////////////////////////////////////////////////
//// AI TUTOR
////////////////////////////////////////////////////

export async function generateAIResponse(
message: string
): Promise<string> {

const prompt = `Explain clearly:

${message}

Give:
• simple explanation
• example
• step explanation if needed`;

return callAI(prompt);

}

////////////////////////////////////////////////////
//// QUIZ
////////////////////////////////////////////////////

export interface QuizQuestion {

question: string;
options: string[];
answer: string;
explanation: string;

}

export async function generateQuiz(
topic: string,
count = 5
): Promise<QuizQuestion[]> {

const prompt = `Generate ${count} MCQ questions about ${topic}.

Return JSON only:

[
{
"question":"",
"options":["","","",""],
"answer":"",
"explanation":""
}
]`;

const raw =
await callAI(prompt);

try {

const cleaned =
raw
.replace(/```json/g,"")
.replace(/```/g,"")
.trim();

const parsed =
JSON.parse(cleaned);

return parsed.slice(0,count);

}
catch {

throw new Error(
"Quiz generation failed"
);

}

}

////////////////////////////////////////////////////
//// FLASHCARDS
////////////////////////////////////////////////////

export interface Flashcard {

front: string;
back: string;

}

export async function generateFlashcards(

topic: string,
count = 5

): Promise<Flashcard[]> {

const prompt = `Create ${count} flashcards about ${topic}.

Return JSON only:

[
{
"front":"",
"back":""
}
]`;

const raw =
await callAI(prompt);

try {

const cleaned =
raw
.replace(/```json/g,"")
.replace(/```/g,"")
.trim();

const parsed =
JSON.parse(cleaned);

return parsed.slice(0,count);

}
catch {

throw new Error(
"Flashcard generation failed"
);

}

}

////////////////////////////////////////////////////
//// STUDY PLAN
////////////////////////////////////////////////////

export async function generateStudyPlan(

subject: string,
duration: string,
goal: string

): Promise<string> {

const prompt = `Create a study plan.

Subject: ${subject}

Duration: ${duration}

Goal: ${goal}

Include:
weekly topics
study methods
resources
tips`;

return callAI(prompt);

}