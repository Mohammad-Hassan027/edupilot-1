"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageSquareText, Send, Sparkles, ArrowRight, MessageSquare, FileQuestion, BookMarked } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

const quickActions = [
  { icon: MessageSquare, label: "Explain a concept", prompt: "Explain..." },
  { icon: FileQuestion, label: "Quiz me", prompt: "Create a quiz on..." },
  { icon: BookMarked, label: "Summarize notes", prompt: "Summarize..." },
]

const recentTopics = [
  { category: "Tech", topic: "API Design Concepts", color: "bg-primary/20 text-primary" },
  { category: "Psychology", topic: "Human Behavior Basics", color: "bg-violet-500/20 text-violet-500" },
  { category: "Business", topic: "Startup Funding 101", color: "bg-emerald-500/20 text-emerald-500" },
]

export function AITutor() {
  const [input, setInput] = useState("")

  return (
    <Card className="border-border bg-card overflow-hidden relative">
      {/* Glow Effect */}
      <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
      
      <CardHeader className="relative pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20">
              <MessageSquareText className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">AI Tutor</CardTitle>
              <p className="text-xs text-muted-foreground">Powered by advanced AI</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
            <span className="text-xs font-medium text-accent">Online</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              className="gap-2 border-border bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
              onClick={() => setInput(action.prompt)}
            >
              <action.icon className="h-3.5 w-3.5" />
              {action.label}
            </Button>
          ))}
        </div>

        {/* Chat Input */}
        <div className="relative">
          <Input
            placeholder="Ask anything you want to learn..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="border-border bg-secondary pr-12 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
          />
          <Button
            size="icon"
            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 bg-primary hover:bg-primary/90"
          >
            <Send className="h-4 w-4 text-primary-foreground" />
          </Button>
        </div>

        {/* Recent Topics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Recent Learning Topics</p>
            <Link href="/ai-tutor">
              <Button variant="link" size="sm" className="h-auto p-0 text-xs text-primary">
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
          <div className="space-y-2">
            {recentTopics.map((item) => (
              <button
                key={item.topic}
                className="flex w-full items-center justify-between rounded-lg border border-border bg-secondary/30 p-3 text-left transition-all hover:bg-secondary/50"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.topic}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", item.color)}>
                  Continue
                </span>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
