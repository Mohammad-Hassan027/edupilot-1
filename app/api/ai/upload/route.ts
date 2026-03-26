// export const dynamic = "force-dynamic"

// import { NextRequest, NextResponse } from "next/server"
// import { getUser } from "@/lib/auth-server"
// import { getSupabaseAdmin } from "@/lib/supabase-server"

// const BUCKET_NAME = "ai-tutor-uploads"

// export async function POST(req: NextRequest) {
//   try {
//     const formData = await req.formData()
//     const files = formData.getAll("files").filter((item): item is File => item instanceof File)

//     if (!files.length) {
//       return NextResponse.json({ error: "No files provided" }, { status: 400 })
//     }

//     const admin = await getSupabaseAdmin()
//     const user = await getUser()

//     const { data: buckets } = await admin.storage.listBuckets()
//     const bucketExists = buckets?.some((bucket) => bucket.name === BUCKET_NAME)

//     if (!bucketExists) {
//       const { error: createBucketError } = await admin.storage.createBucket(BUCKET_NAME, {
//         public: true,
//         fileSizeLimit: "20MB",
//       })

//       if (createBucketError && !createBucketError.message.toLowerCase().includes("already")) {
//         throw createBucketError
//       }
//     }

//     const uploadedFiles = [] as Array<{ name: string; url: string; type: string; size: number }>

//     for (const file of files) {
//       const bytes = await file.arrayBuffer()
//       const buffer = Buffer.from(bytes)
//       const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-")
//       const path = `${user?.id || "guest"}/${Date.now()}-${crypto.randomUUID()}-${safeName}`

//       const { error: uploadError } = await admin.storage.from(BUCKET_NAME).upload(path, buffer, {
//         contentType: file.type || "application/octet-stream",
//         upsert: false,
//       })

//       if (uploadError) {
//         throw uploadError
//       }

//       const { data: publicUrlData } = admin.storage.from(BUCKET_NAME).getPublicUrl(path)

//       uploadedFiles.push({
//         name: file.name,
//         url: publicUrlData.publicUrl,
//         type: file.type || "application/octet-stream",
//         size: file.size,
//       })
//     }

//     return NextResponse.json({ success: true, files: uploadedFiles })
//   } catch (error) {
//     console.error("[ai/upload] Error:", error)
//     const message = error instanceof Error ? error.message : "Failed to upload file"
//     return NextResponse.json({ error: message }, { status: 500 })
//   }
// }
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { getSupabaseAdmin } from "@/lib/supabase-server"

const BUCKET_NAME = "ai-tutor-uploads"
const MAX_FILE_BYTES = 18 * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files = formData.getAll("files").filter((item): item is File => item instanceof File)

    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    const admin = await getSupabaseAdmin()
    const user = await getUser()

    const { data: buckets } = await admin.storage.listBuckets()
    const bucketExists = buckets?.some((bucket) => bucket.name === BUCKET_NAME)

    if (!bucketExists) {
      const { error: createBucketError } = await admin.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: "18MB",
      })

      if (createBucketError && !createBucketError.message.toLowerCase().includes("already")) {
        throw createBucketError
      }
    }

    const uploadedFiles: Array<{ name: string; url: string; type: string; size: number }> = []

    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          { error: `${file.name} is too large. Please upload files under 18 MB.` },
          { status: 400 }
        )
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-")
      const path = `${user?.id || "guest"}/${Date.now()}-${crypto.randomUUID()}-${safeName}`

      const { error: uploadError } = await admin.storage.from(BUCKET_NAME).upload(path, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      })

      if (uploadError) {
        throw uploadError
      }

      const { data: publicUrlData } = admin.storage.from(BUCKET_NAME).getPublicUrl(path)

      uploadedFiles.push({
        name: file.name,
        url: publicUrlData.publicUrl,
        type: file.type || "application/octet-stream",
        size: file.size,
      })
    }

    return NextResponse.json({ success: true, files: uploadedFiles })
  } catch (error) {
    console.error("[ai/upload] Error:", error)
    const message = error instanceof Error ? error.message : "Failed to upload file"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}