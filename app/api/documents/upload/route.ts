import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import pdfParse from "pdf-parse/lib/pdf-parse"
import { generateEmbedding } from "@/lib/ai"

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
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

    // 1. Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`
    
    // Ensure you have a 'documents' bucket in Supabase!
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file)

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return NextResponse.json({ error: "Failed to upload file to storage" }, { status: 500 })
    }

    const file_url = supabase.storage.from('documents').getPublicUrl(fileName).data.publicUrl

    // 2. Parse PDF Text
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const pdfData = await pdfParse(buffer)
    const text = pdfData.text

    // 3. Create document record in DB
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        title: file.name,
        file_url: file_url
      })
      .select('id')
      .single()

    if (docError || !doc) {
      console.error("Database insert error:", docError)
      return NextResponse.json({ error: "Failed to create document record" }, { status: 500 })
    }

    // 4. Chunk text and generate embeddings
    // Simple chunking by paragraphs or length
    const chunkSize = 1000
    const chunks: string[] = []
    let currentChunk = ""
    
    const paragraphs = text.split('\n\n')
    for (const p of paragraphs) {
      if (currentChunk.length + p.length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk)
        currentChunk = ""
      }
      currentChunk += p + "\n\n"
    }
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk)
    }

    // 5. Insert chunks into DB
    const chunkPromises = chunks.filter(c => c.trim().length > 0).map(async (chunkContent) => {
      try {
        const embedding = await generateEmbedding(chunkContent)
        return {
          document_id: doc.id,
          content: chunkContent,
          embedding
        }
      } catch (err) {
        console.error("Failed to generate embedding for chunk:", err)
        return null
      }
    })

    const resolvedChunks = (await Promise.all(chunkPromises)).filter(c => c !== null)
    
    if (resolvedChunks.length > 0) {
      const { error: chunkError } = await supabase
        .from('document_chunks')
        .insert(resolvedChunks)
        
      if (chunkError) {
        console.error("Failed to insert chunks:", chunkError)
      }
    }

    return NextResponse.json({ success: true, documentId: doc.id, fileUrl: file_url })
  } catch (err) {
    console.error("Upload error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
