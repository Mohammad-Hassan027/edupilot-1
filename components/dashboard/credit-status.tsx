"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Zap, MessageSquareText, Layers, BookOpen, Sparkles } from "lucide-react"
import Link from "next/link"
import { useUser } from "@/hooks/use-user"

export function CreditStatus() {
  const { credits, subscription, isLoading } = useUser()

  const isTrial = subscription?.trial_active === true
  const isFree  = !isTrial && subscription?.status !== "active"

  const items = [
    {
      label: "AI Chats",
      icon: MessageSquareText,
      used:      credits?.ai_chat_used      ?? 0,
      remaining: credits?.ai_chat_remaining ?? 0,
      color: "bg-primary",
    },
    {
      label: "Flashcards",
      icon: Layers,
      used:      credits?.flashcards_used      ?? 0,
      remaining: credits?.flashcards_remaining ?? 0,
      color: "bg-violet-500",
    },
    {
      label: "Study Plans",
      icon: BookOpen,
      used:      credits?.study_plan_used      ?? 0,
      remaining: credits?.study_plan_remaining ?? 0,
      color: "bg-emerald-500",
    },
  ]

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Credits
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
          </div>
        ) : isTrial ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
              <Sparkles className="h-6 w-6 text-emerald-500" />
            </div>
            <p className="font-semibold text-emerald-500">Trial Active</p>
            <p className="text-sm text-muted-foreground mt-1">Unlimited access until</p>
            <p className="text-sm font-medium text-foreground mt-0.5">
              {subscription?.trial_expiry
                ? new Date(subscription.trial_expiry).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })
                : "—"}
            </p>
          </div>
        ) : (
          <>
            {items.map((item) => {
              const total = item.used + item.remaining
              const pct   = total > 0 ? (item.remaining / total) * 100 : 0
              return (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{item.label}</span>
                    </div>
                    <span className={`font-semibold ${item.remaining === 0 ? "text-destructive" : "text-foreground"}`}>
                      {item.remaining} left
                    </span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              )
            })}

            {isFree && (
              <Button asChild className="w-full gap-2 mt-2" size="sm">
                <Link href="/billing">
                  <Zap className="h-4 w-4" />
                  Activate 14-Day Trial
                </Link>
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
