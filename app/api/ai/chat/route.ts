import Groq from "groq-sdk";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message) {
      return Response.json(
        { error: "Message required" },
        { status: 400 }
      );
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

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
            content: message,
          },
        ],
        model: "llama3-8b-8192",
        temperature: 0.7,
        max_tokens: 800,
      });

    const reply =
      completion.choices[0]?.message?.content;

    return Response.json({
      reply,
    });

  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "AI failed" },
      { status: 500 }
    );
  }
}