import { NextResponse, NextRequest } from "next/server"
import { getUser } from "@/lib/auth-server"
import { getRevisions, getRevisionStats } from "@/lib/revision-db"
import type { RevisionSchedule } from "@/types"

export const dynamic = "force-dynamic"

const PRIORITY_ORDER = {
  high: 1,
  medium: 2,
  low: 3,
}

function sortRevisions(a: RevisionSchedule, b: RevisionSchedule) {
  const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
  if (priorityDiff !== 0) return priorityDiff
  return new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const clientDateStr = searchParams.get("date")

    // Default to server local day if client doesn't provide date
    let todayStr = clientDateStr
    if (!todayStr) {
      const now = new Date()
      const offset = now.getTimezoneOffset()
      const localDate = new Date(now.getTime() - offset * 60 * 1000)
      todayStr = localDate.toISOString().split("T")[0]
    }

    const allRevisions = await getRevisions(user.id)
    const stats = await getRevisionStats(user.id)

    const todayList: RevisionSchedule[] = []
    const overdueList: RevisionSchedule[] = []
    const upcomingList: RevisionSchedule[] = []
    const completedList: RevisionSchedule[] = []

    for (const rev of allRevisions) {
      if (rev.status === "completed") {
        completedList.push(rev)
      } else {
        const scheduledDate = rev.scheduled_date // YYYY-MM-DD
        if (scheduledDate < todayStr) {
          overdueList.push(rev)
        } else if (scheduledDate === todayStr) {
          todayList.push(rev)
        } else {
          upcomingList.push(rev)
        }
      }
    }

    // Sort according to priority and due date
    todayList.sort(sortRevisions)
    overdueList.sort(sortRevisions)
    upcomingList.sort(sortRevisions)
    completedList.sort((a, b) => {
      const aTime = a.completed_at ? new Date(a.completed_at).getTime() : 0
      const bTime = b.completed_at ? new Date(b.completed_at).getTime() : 0
      return bTime - aTime // Completed recently first
    })

    return NextResponse.json({
      success: true,
      data: {
        today: todayList,
        overdue: overdueList,
        upcoming: upcomingList,
        completed: completedList,
        stats,
      },
    })
  } catch (err) {
    console.error("[api/revision/upcoming] GET Error:", err)
    const msg = err instanceof Error ? err.message : "Failed to load upcoming revisions"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
