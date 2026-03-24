// // export const dynamic = "force-dynamic"
// // import { NextRequest, NextResponse } from "next/server"
// // import { getUser } from "@/lib/auth-server"
// // import { generateAIResponse } from "@/lib/ai"
// // import { logUsage } from "@/lib/database"

// // export async function POST(req: NextRequest) {
// //   try {
// //     const { message } = await req.json()

// //     if (!message || typeof message !== "string" || message.trim().length === 0) {
// //       return NextResponse.json({ error: "Message is required" }, { status: 400 })
// //     }
// //     if (message.length > 2000) {
// //       return NextResponse.json({ error: "Message too long (max 2000 characters)" }, { status: 400 })
// //     }

// //     // Call AI — no guest limits, no credit checks
// //     const aiResponse = await generateAIResponse(message.trim())

// //     // Log usage for analytics (non-blocking)
// //     const user = await getUser()
// //     if (user) {
// //       logUsage(user.id, "ai_chat", "question_asked", {
// //         messageLength: message.length,
// //       }).catch(() => {})
// //     }

// //     return NextResponse.json({ success: true, reply: aiResponse })
// //   } catch (err) {
// //     console.error("[ai/chat] Error:", err)
// //     const msg = err instanceof Error ? err.message : "AI service unavailable"
// //     return NextResponse.json({ error: msg }, { status: 500 })
// //   }
// // }
// export const dynamic = "force-dynamic"

// import { NextRequest, NextResponse } from "next/server"
// import { getUser } from "@/lib/auth-server"
// import { generateAIResponse } from "@/lib/ai"
// import { logUsage } from "@/lib/database"
// import { getSupabaseAdmin } from "@/lib/supabase-server"

// function buildTopicFromMessage(message: string) {
//   const cleaned = message.replace(/\s+/g, " ").trim()
//   if (!cleaned) return "New Chat"
//   return cleaned.length > 60 ? `${cleaned.slice(0, 60)}...` : cleaned
// }

// export async function POST(req: NextRequest) {
//   try {
//     const { message, sessionId } = await req.json()

//     if (!message || typeof message !== "string" || message.trim().length === 0) {
//       return NextResponse.json({ error: "Message is required" }, { status: 400 })
//     }

//     if (message.length > 2000) {
//       return NextResponse.json(
//         { error: "Message too long (max 2000 characters)" },
//         { status: 400 }
//       )
//     }

//     const cleanMessage = message.trim()
//     const aiResponse = await generateAIResponse(cleanMessage)
//     const user = await getUser()

//     let savedSessionId: string | null = null

//     // Save only for logged-in users
//     if (user) {
//       const admin = await getSupabaseAdmin()

//       let currentSessionId = sessionId as string | undefined

//       // Create a new session if one does not exist
//       if (!currentSessionId) {
//         const topic = buildTopicFromMessage(cleanMessage)

//         const { data: newSession, error: sessionError } = await admin
//           .from("chat_sessions")
//           .insert({
//             user_id: user.id,
//             title: topic,
//             topic,
//             last_message_at: new Date().toISOString(),
//             updated_at: new Date().toISOString(),
//           })
//           .select("id")
//           .single()

//         if (sessionError) {
//           throw new Error(`Failed to create chat session: ${sessionError.message}`)
//         }

//         currentSessionId = newSession.id
//       } else {
//         // Make sure the session belongs to the logged-in user
//         const { data: existingSession, error: existingError } = await admin
//           .from("chat_sessions")
//           .select("id")
//           .eq("id", currentSessionId)
//           .eq("user_id", user.id)
//           .single()

//         if (existingError || !existingSession) {
//           const topic = buildTopicFromMessage(cleanMessage)

//           const { data: newSession, error: sessionError } = await admin
//             .from("chat_sessions")
//             .insert({
//               user_id: user.id,
//               title: topic,
//               topic,
//               last_message_at: new Date().toISOString(),
//               updated_at: new Date().toISOString(),
//             })
//             .select("id")
//             .single()

//           if (sessionError) {
//             throw new Error(`Failed to create chat session: ${sessionError.message}`)
//           }

//           currentSessionId = newSession.id
//         }
//       }

//       // Save user message
//       const { error: userMessageError } = await admin
//         .from("chat_messages")
//         .insert({
//           session_id: currentSessionId,
//           user_id: user.id,
//           role: "user",
//           content: cleanMessage,
//           created_at: new Date().toISOString(),
//         })

//       if (userMessageError) {
//         throw new Error(`Failed to save user message: ${userMessageError.message}`)
//       }

//       // Save assistant message
//       const { error: assistantMessageError } = await admin
//         .from("chat_messages")
//         .insert({
//           session_id: currentSessionId,
//           user_id: user.id,
//           role: "assistant",
//           content: aiResponse,
//           created_at: new Date().toISOString(),
//         })

//       if (assistantMessageError) {
//         throw new Error(`Failed to save assistant message: ${assistantMessageError.message}`)
//       }

//       // Update session timestamps
//       await admin
//         .from("chat_sessions")
//         .update({
//           last_message_at: new Date().toISOString(),
//           updated_at: new Date().toISOString(),
//         })
//         .eq("id", currentSessionId)
//         .eq("user_id", user.id)

//       savedSessionId = currentSessionId

//       // Keep analytics too
//       logUsage(user.id, "ai_chat", "question_asked", {
//         topic: buildTopicFromMessage(cleanMessage),
//         sessionId: currentSessionId,
//         messageLength: cleanMessage.length,
//       }).catch(() => {})
//     }

//     return NextResponse.json({
//       success: true,
//       reply: aiResponse,
//       sessionId: savedSessionId,
//     })
//   } catch (err) {
//     console.error("[ai/chat] Error:", err)
//     const msg = err instanceof Error ? err.message : "AI service unavailable"
//     return NextResponse.json({ error: msg }, { status: 500 })
//   }
// }
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { generateAIResponse } from "@/lib/ai"
import { logUsage } from "@/lib/database"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import { buildResourceLinks } from "@/lib/resource-links"

function buildTopicFromMessage(message: string) {
  const cleaned = message.replace(/\s+/g, " ").trim()
  if (!cleaned) return "New Chat"
  return cleaned.length > 60 ? `${cleaned.slice(0, 60)}...` : cleaned
}

function formatReplyWithSources(reply: string, sources: { title: string; url: string; source: string }[]) {
  if (!sources.length) return reply

  const linksBlock = [
    "",
    "---",
    "",
    "### Useful Resources",
    "",
    ...sources.map(
      (item, index) => `${index + 1}. [${item.title}](${item.url}) — ${item.source}`
    ),
  ].join("\n")

  return `${reply}\n${linksBlock}`
}

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId } = await req.json()

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: "Message too long (max 2000 characters)" },
        { status: 400 }
      )
    }

    const cleanMessage = message.trim()
    const aiResponse = await generateAIResponse(cleanMessage)
    const sources = buildResourceLinks(cleanMessage)
    const finalReply = formatReplyWithSources(aiResponse, sources)

    const user = await getUser()
    let savedSessionId: string | null = null

    if (user) {
      const admin = await getSupabaseAdmin()
      let currentSessionId = sessionId as string | undefined

      if (!currentSessionId) {
        const topic = buildTopicFromMessage(cleanMessage)

        const { data: newSession, error: sessionError } = await admin
          .from("chat_sessions")
          .insert({
            user_id: user.id,
            title: topic,
            topic,
            last_message_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select("id")
          .single()

        if (sessionError) {
          throw new Error(`Failed to create chat session: ${sessionError.message}`)
        }

        currentSessionId = newSession.id
      }

      const { error: userMessageError } = await admin.from("chat_messages").insert({
        session_id: currentSessionId,
        user_id: user.id,
        role: "user",
        content: cleanMessage,
        created_at: new Date().toISOString(),
      })

      if (userMessageError) {
        throw new Error(`Failed to save user message: ${userMessageError.message}`)
      }

      const { error: assistantMessageError } = await admin.from("chat_messages").insert({
        session_id: currentSessionId,
        user_id: user.id,
        role: "assistant",
        content: finalReply,
        created_at: new Date().toISOString(),
      })

      if (assistantMessageError) {
        throw new Error(`Failed to save assistant message: ${assistantMessageError.message}`)
      }

      await admin
        .from("chat_sessions")
        .update({
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentSessionId)
        .eq("user_id", user.id)

      savedSessionId = currentSessionId

      logUsage(user.id, "ai_chat", "question_asked", {
        topic: buildTopicFromMessage(cleanMessage),
        sessionId: currentSessionId,
        messageLength: cleanMessage.length,
      }).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      reply: finalReply,
      sources,
      sessionId: savedSessionId,
    })
  } catch (err) {
    console.error("[ai/chat] Error:", err)
    const msg = err instanceof Error ? err.message : "AI service unavailable"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}