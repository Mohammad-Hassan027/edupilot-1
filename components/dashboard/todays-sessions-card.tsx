import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getUser } from "@/lib/auth-server"
import { getTodaysPlannerTasks } from "@/lib/database"
import { CalendarCheck2, Clock } from "lucide-react"

export async function TodaysSessionsCard() {
  const user = await getUser()
  const tasks = user ? await getTodaysPlannerTasks(user.id) : []

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-lg">Today&apos;s Study Sessions</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Planned sessions from your saved study plans for today
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/planner">Open Planner</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {tasks.length ? (
          <div className="space-y-3">
            {tasks.map((task) => (
              <Link
                key={`${task.planId}-${task.id}`}
                href={`/planner?plan=${task.planId}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-background/40 px-3 py-3 transition-colors hover:border-primary/50 hover:bg-primary/5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <CalendarCheck2 className="h-4 w-4 shrink-0 text-primary" />
                    <span className={task.completed ? "truncate line-through opacity-60" : "truncate"}>
                      {task.title}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {task.subject} · {task.planTitle}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {task.time}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No study sessions planned for today. Head to the{" "}
            <Link href="/planner" className="text-primary underline underline-offset-2">
              Study Planner
            </Link>{" "}
            to add some.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
