import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { DocumentChatUI } from "@/components/dashboard/document-chat-ui"

export default async function DocumentChatDetailPage({
  params
}: {
  params: { id: string }
}) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return notFound()
  }

  const { data: doc, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !doc) {
    return notFound()
  }

  return (
    <div className="p-4 md:p-6 w-full max-w-[1600px] mx-auto">
      <DocumentChatUI 
        documentId={doc.id} 
        fileUrl={doc.file_url} 
        title={doc.title} 
      />
    </div>
  )
}
