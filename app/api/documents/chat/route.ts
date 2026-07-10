import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { generateEmbedding, generateAIResponse } from "@/lib/ai"

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { documentId, message } = await req.json()

    if (!documentId || !message) {
      return NextResponse.json({ error: "Missing documentId or message" }, { status: 400 })
    }

    const res = NextResponse.next()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) { return req.cookies.get(name)?.value },
          set(name, value, options) { res.cookies.set(name, value, options) },
          remove(name, options) { res.cookies.set(name, "", { ...options, maxAge: 0 }) },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify document belongs to user
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('id')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()
      
    if (docError || !doc) {
      return NextResponse.json({ error: "Document not found or unauthorized" }, { status: 404 })
    }

    // Embed the user's question
    const queryEmbedding = await generateEmbedding(message)

    // Call match_document_chunks RPC
    const { data: matchData, error: matchError } = await supabase.rpc('match_document_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: 5,
      doc_id: documentId
    })

    if (matchError) {
      console.error("Match error:", matchError)
      return NextResponse.json({ error: "Failed to search document" }, { status: 500 })
    }

    const contextText = matchData && matchData.length > 0 
      ? matchData.map((m: any) => m.content).join("\n\n---\n\n")
      : "No highly relevant context found in this document for the query."

    // Generate AI Response with the retrieved context
    const aiPrompt = `Based on the following excerpts from a document, answer the user's question. 
If the answer is not in the context, say "I couldn't find the answer in this document." but try to be helpful if possible.

Document Context:
${contextText}

User's Question: ${message}`

    const aiResponse = await generateAIResponse(aiPrompt, { mode: 'chat' })

    return NextResponse.json({ reply: aiResponse })
  } catch (err) {
    console.error("Chat error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
