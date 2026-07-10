"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, FileSignature, CheckCircle } from "lucide-react"

export default function EssayGraderPage() {
  const router = useRouter()
  const [content, setContent] = useState("")
  const [rubric, setRubric] = useState("")
  const [loading, setLoading] = useState(false)
  const [evaluations, setEvaluations] = useState<any[]>([])
  const [fetching, setFetching] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchEvaluations()
  }, [])

  async function fetchEvaluations() {
    setFetching(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data, error } = await supabase
        .from('essay_evaluations')
        .select('id, grade, created_at, content')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setEvaluations(data)
      }
    }
    setFetching(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || loading) return

    setLoading(true)

    try {
      const res = await fetch("/api/essays/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, rubric }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.id) {
          router.push(`/essay-grader/${data.id}`)
        }
      } else {
        const errorData = await res.json()
        alert(errorData.error || "Failed to evaluate essay.")
      }
    } catch (err) {
      console.error(err)
      alert("Connection error.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Essay Grader</h1>
        <p className="text-muted-foreground mt-2">
          Paste your essay and an optional rubric to receive an instant grade, strengths, weaknesses, and actionable feedback.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>New Evaluation</CardTitle>
              <CardDescription>Submit a new essay for AI grading.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Essay Content</label>
                  <Textarea 
                    placeholder="Paste your essay here..."
                    className="min-h-[250px]"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Grading Rubric / Prompt (Optional)</label>
                  <Textarea 
                    placeholder="Paste the assignment instructions or grading rubric here..."
                    className="min-h-[100px]"
                    value={rubric}
                    onChange={(e) => setRubric(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={!content.trim() || loading} className="w-full">
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Evaluating Essay...</>
                  ) : (
                    <><CheckCircle className="mr-2 h-4 w-4" /> Grade My Essay</>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Past Evaluations</h2>
          {fetching ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : evaluations.length === 0 ? (
            <Card className="bg-muted/50 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <FileSignature className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground text-sm max-w-sm">
                  You haven't graded any essays yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {evaluations.map((evalData) => (
                <Card key={evalData.id} className="hover:bg-muted/50 transition-colors cursor-pointer group" onClick={() => router.push(`/essay-grader/${evalData.id}`)}>
                  <CardHeader className="p-4">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      <span className="truncate max-w-[150px]">{evalData.content.substring(0, 30)}...</span>
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                        {evalData.grade}
                      </span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {new Date(evalData.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
