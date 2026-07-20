"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, FileText, Upload, Plus } from "lucide-react"

export default function DocumentChatPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchDocuments()
  }, [])

  async function fetchDocuments() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setDocuments(data)
      }
    }
    setLoading(false)
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        if (data.documentId) {
          router.push(`/document-chat/${data.documentId}`)
        }
      } else {
        console.error("Upload failed")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
      setFile(null)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Chat</h1>
          <p className="text-muted-foreground mt-2">
            Upload a PDF and chat with it to extract insights, summaries, and answers.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload New Document</CardTitle>
          <CardDescription>Select a PDF file to analyze.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="flex gap-4 items-center">
            <Input 
              type="file" 
              accept=".pdf" 
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="max-w-sm"
              disabled={uploading}
            />
            <Button type="submit" disabled={!file || uploading}>
              {uploading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
              ) : (
                <><Upload className="mr-2 h-4 w-4" /> Upload</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Documents</h2>
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : documents.length === 0 ? (
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="font-semibold text-lg">No documents yet</h3>
              <p className="text-muted-foreground text-sm mt-1 max-w-sm">
                Upload your first PDF document above to start chatting with it.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="hover:bg-muted/50 transition-colors cursor-pointer group" onClick={() => router.push(`/document-chat/${doc.id}`)}>
                <CardHeader>
                  <CardTitle className="text-base font-medium flex items-start justify-between gap-2">
                    <span className="truncate">{doc.title}</span>
                    <FileText className="h-4 w-4 text-primary shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
