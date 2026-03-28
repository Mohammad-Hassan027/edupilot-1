"use client"

import { useMemo, useRef, useState } from "react"
import { Bot, Loader2, MessageSquare, Send, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
}

const DEFAULT_SUGGESTIONS = [
  "How do I use AI Tutor?",
  "How do I create notes?",
  "How does Quiz work?",
  "How do I use Planner?",
]

export function EduPilotGuideChatbot() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS)

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I’m EduPilot Guide. I can help you understand how to use EduPilot features like AI Tutor, Notes, Flashcards, Quiz, Planner, Dashboard, and plans.",
    },
  ])

  const scrollRef = useRef<HTMLDivElement | null>(null)

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading])

  async function sendMessage(messageText?: string) {
    const finalMessage = (messageText ?? input).trim()
    if (!finalMessage || loading) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: finalMessage,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const response = await fetch("/api/edupilot-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: finalMessage }),
      })

      const data = await response.json().catch(() => null)

      const reply =
        data?.reply ||
        "I can help with EduPilot features and usage only. Try asking about AI Tutor, Notes, Quiz, or Planner."

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: reply,
      }

      setMessages((prev) => [...prev, assistantMessage])

      if (Array.isArray(data?.suggestions) && data.suggestions.length > 0) {
        setSuggestions(data.suggestions.slice(0, 4))
      }
    } catch (error) {
      console.error("[EduPilotGuideChatbot] Error:", error)

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content:
            "Something went wrong. Please try again. I can help with EduPilot usage, such as AI Tutor, Notes, Quiz, Planner, and Dashboard.",
        },
      ])
    } finally {
      setLoading(false)

      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
      })
    }
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-[9999] w-[360px] max-w-[calc(100vw-2rem)]">
          <Card className="border-border bg-card shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">Ask EduPilot</p>
                  <p className="text-xs text-white/80 truncate">App help and feature guidance</p>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 hover:text-white"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="h-[420px] px-3 py-3">
              <div ref={scrollRef} className="space-y-3 pr-1">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-6",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      )}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl bg-secondary px-3 py-2 text-sm text-secondary-foreground flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Thinking...
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="border-t border-border px-3 py-3 space-y-3">
              <div className="flex flex-wrap gap-2">
                {suggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => void sendMessage(item)}
                    className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs text-secondary-foreground transition hover:bg-accent hover:text-accent-foreground"
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about EduPilot..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      void sendMessage()
                    }
                  }}
                />

                <Button
                  type="button"
                  size="icon"
                  onClick={() => void sendMessage()}
                  disabled={!canSend}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-4 right-4 z-[9999] inline-flex items-center gap-2 rounded-full border border-white/15 bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-2xl transition hover:scale-[1.02]"
      >
        {open ? <X className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        <span>{open ? "Close" : "Ask EduPilot"}</span>
      </button>
    </>
  )
}