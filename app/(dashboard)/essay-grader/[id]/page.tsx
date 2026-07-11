import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, XCircle, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

export default async function EssayEvaluationPage({
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

  const { data: evaluation, error } = await supabase
    .from('essay_evaluations')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !evaluation) {
    return notFound()
  }

  const feedback = evaluation.feedback

  return (
    <div className="container mx-auto py-8 max-w-4xl space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/essay-grader">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Evaluation Results</h1>
          <p className="text-muted-foreground mt-1">
            Graded on {new Date(evaluation.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 bg-primary/5 border-primary/20 flex flex-col items-center justify-center py-8">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Estimated Grade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-6xl font-black text-primary">{feedback.grade}</div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Strengths & Weaknesses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold flex items-center text-green-600 mb-2">
                <CheckCircle2 className="mr-2 h-4 w-4" /> Pros
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {feedback.pros.map((pro: string, i: number) => (
                  <li key={i}>{pro}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold flex items-center text-red-500 mb-2">
                <XCircle className="mr-2 h-4 w-4" /> Cons
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {feedback.cons.map((con: string, i: number) => (
                  <li key={i}>{con}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="mr-2 h-5 w-5 text-amber-500" /> Actionable Suggestions
          </CardTitle>
          <CardDescription>Specific feedback to improve your essay.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {feedback.suggestions.map((suggestion: any, i: number) => (
            <div key={i} className="bg-muted p-4 rounded-lg space-y-3 border border-border/50">
              <blockquote className="border-l-4 border-primary pl-4 italic text-sm text-muted-foreground">
                "{suggestion.quote}"
              </blockquote>
              <p className="text-sm font-medium">
                {suggestion.comment}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Original Essay</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted/50 rounded-lg whitespace-pre-wrap text-sm">
            {evaluation.content}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
