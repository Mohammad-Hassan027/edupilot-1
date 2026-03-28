import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getUser } from "@/lib/auth-server"
import { getSavedNotes } from "@/lib/database"
import { ExternalLink, FileText } from "lucide-react"

export async function SavedNotesCard() {
  const user = await getUser()
  const notes = user ? await getSavedNotes(user.id, 5) : []

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-lg">Saved Notes</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Your latest 5 AI-generated notes</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/notes">Learn More</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {notes.length ? (
          <div className="space-y-3">
            {notes.map((note) => (
              <Link
                key={note.id}
                href={`/notes?saved=${note.id}`}
                className="flex items-start justify-between rounded-xl border border-border/80 bg-background/40 px-3 py-3 transition-colors hover:border-primary/50 hover:bg-primary/5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="truncate">{note.source_title}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {note.source_hint || note.source_label || note.source_type}
                  </p>
                </div>
                <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No saved notes yet. Generate notes from the Notes page and they will appear here.
          </div>
        )}
      </CardContent>
    </Card>
  )
}