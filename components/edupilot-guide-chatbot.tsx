"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { Bot, Loader2, Send, Sparkles, X, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

type RelatedPage = {
  label: string
  href: string
}

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  relatedPages?: RelatedPage[]
}

const DEFAULT_SUGGESTIONS = [
  "How do I use AI Tutor?",
  "How do I create notes?",
  "How does Quiz work?",
  "How do I use Planner?",
]

function formatAssistantContent(content: string) {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

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
        "Hi! I’m EduPilot Guide.\n\nStep 1: Ask me about any EduPilot feature.\nStep 2: I’ll explain how to use it in simple steps.\nStep 3: Open the related page and try it directly.\n\nTry this next: Ask “How do I use AI Tutor?”",
      relatedPages: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "AI Tutor", href: "/ai-tutor" },
        { label: "Notes", href: "/notes" },
      ],
    },
  ])

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading])

  useEffect(() => {
    if (!open) return

    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    })
  }, [messages, loading, open])

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

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content:
          data?.reply ||
          "I can help with EduPilot usage only.\n\nStep 1: Ask about a feature.\nStep 2: Follow the steps I give.\nStep 3: Open the related EduPilot page.\n\nTry this next: Ask about AI Tutor, Notes, Quiz, or Planner.",
        relatedPages: Array.isArray(data?.relatedPages) ? data.relatedPages.slice(0, 4) : [],
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
            "Something went wrong.\n\nStep 1: Try asking again.\nStep 2: Keep your question about an EduPilot feature.\nStep 3: Open the related page from the links below.\n\nTry this next: Ask “How do I use Planner?”",
          relatedPages: [
            { label: "Dashboard", href: "/dashboard" },
            { label: "AI Tutor", href: "/ai-tutor" },
            { label: "Planner", href: "/planner" },
          ],
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {open && (
        <div className="fixed inset-x-3 bottom-20 z-[9999] md:inset-x-auto md:right-4 md:bottom-24">
          <Card
            className={cn(
              "flex w-full flex-col overflow-hidden border-border bg-card shadow-2xl",
              "h-[calc(100vh-7rem)] max-h-[720px] min-h-[420px]",
              "sm:h-[calc(100vh-8rem)]",
              "md:w-[380px] md:h-[min(70vh,640px)]",
              "lg:w-[400px] lg:h-[min(72vh,660px)]"
            )}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-border bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-3 text-white sm:px-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 sm:h-10 sm:w-10">
                  <Sparkles className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold sm:text-base">Ask EduPilot</p>
                  <p className="truncate text-[11px] text-white/80 sm:text-xs">
                    App help, feature guidance, and quick links
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-white hover:bg-white/10 hover:text-white sm:h-9 sm:w-9"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
              <ScrollArea className="min-h-0 flex-1">
                <div className="space-y-3 px-3 py-3 sm:space-y-4 sm:px-4">
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
                          "max-w-[94%] rounded-2xl px-3 py-2.5 text-sm leading-6 sm:max-w-[88%] sm:px-3 sm:py-3",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground"
                        )}
                      >
                        <div className="space-y-2">
                          {message.role === "assistant" ? (
                            formatAssistantContent(message.content).map((line, index) => {
                              const isStep = /^step\s*\d+\s*:/i.test(line)
                              const isTips = /^tips\s*:/i.test(line)
                              const isTryNext = /^try this next\s*:/i.test(line)

                              return (
                                <p
                                  key={`${message.id}-${index}`}
                                  className={cn(
                                    "text-sm leading-6",
                                    (isStep || isTips || isTryNext) && "font-medium"
                                  )}
                                >
                                  {line}
                                </p>
                              )
                            })
                          ) : (
                            <p className="text-sm leading-6">{message.content}</p>
                          )}

                          {message.role === "assistant" &&
                            Array.isArray(message.relatedPages) &&
                            message.relatedPages.length > 0 && (
                              <div className="pt-1">
                                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
                                  Related pages
                                </p>

                                <div className="flex flex-wrap gap-2">
                                  {message.relatedPages.map((page) => (
                                    <Link
                                      key={`${message.id}-${page.href}`}
                                      href={page.href}
                                      className="inline-flex items-center gap-1 rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-accent hover:text-accent-foreground"
                                      onClick={() => setOpen(false)}
                                    >
                                      <span>{page.label}</span>
                                      <ArrowUpRight className="h-3 w-3" />
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2 rounded-2xl bg-secondary px-3 py-2 text-sm text-secondary-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Thinking...
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="shrink-0 border-t border-border bg-card px-3 py-3 sm:px-4">
                <div className="mb-3 flex max-h-24 flex-wrap gap-2 overflow-y-auto pr-1">
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
                    className="h-10 sm:h-11"
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
                    className="h-10 w-10 shrink-0 sm:h-11 sm:w-11"
                    onClick={() => void sendMessage()}
                    disabled={!canSend}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "fixed bottom-4 right-4 z-[9999] inline-flex h-12 max-w-[calc(100vw-1.5rem)] items-center gap-2 rounded-full border border-white/15 bg-gradient-to-r from-violet-600 to-indigo-600 px-4 text-sm font-semibold text-white shadow-2xl transition hover:scale-[1.02] sm:h-14 sm:px-5"
        )}
      >
        {open ? <X className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        <span className="truncate">{open ? "Close" : "Ask EduPilot"}</span>
      </button>
    </>
  )
}