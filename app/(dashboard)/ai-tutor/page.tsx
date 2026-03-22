"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import {
  Send, MessageSquareText, Sparkles, MessageSquare, Clock, ChevronRight,
  Copy, ThumbsUp, ThumbsDown, Mic, RefreshCw, BookOpen, FileQuestion,
  Lightbulb
} from "lucide-react"
import { cn } from "@/lib/utils"
import { LoginGateModal } from "@/components/login-gate-modal"
import { CreditsExhaustedModal } from "@/components/credits-exhausted-modal"
import Link from "next/link"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ChatSession {
  id: string
  title: string
  time: string
  messages: number
}

const examplePrompts = [
  { icon: BookOpen, label: "Explain a concept", prompt: "Explain the concept of REST APIs in simple terms" },
  { icon: FileQuestion, label: "Quiz me", prompt: "Create a 5 question quiz about JavaScript basics" },
  { icon: Lightbulb, label: "Study tips", prompt: "Give me effective strategies for learning programming" },
  { icon: MessageSquareText, label: "Solve a problem", prompt: "Help me understand recursion step by step" },
]

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hello! I'm your EduPilot AI Tutor powered by Gemini. I can help you understand complex topics, create quizzes, explain concepts, and much more. What would you like to learn today?",
    timestamp: new Date(),
  },
]

export default function AITutorPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showCreditsModal, setShowCreditsModal] = useState(false)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function init() {
      try {
        const historyRes = await fetch("/api/user/chat-history")
        if (historyRes.ok) {
          const data = await historyRes.json()
          setChatSessions(data.sessions || [])
        }
      } catch {
        // non-fatal
      } finally {
        setIsLoadingHistory(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isTyping) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const sentInput = input
    setInput("")
    setIsTyping(true)

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: sentInput }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.code === "GUEST_LIMIT_REACHED" || data.requiresLogin) {
                    setShowLoginModal(true)
          setMessages((prev) => prev.filter((m) => m.id !== userMessage.id))
          setInput(sentInput)
          return
        }
        if (data.code === "NO_CREDITS" || data.requiresUpgrade) {
          setShowCreditsModal(true)
          return
        }
        throw new Error(data.error || "Failed to get AI response")
      }
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: err instanceof Error ? err.message : "Something went wrong. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleNewChat = () => {
    setMessages(initialMessages)
    setInput("")
  }

  return (
    <>

              {isTyping && (
                <div className="flex gap-2 md:gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                    <MessageSquareText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="rounded-lg md:rounded-xl bg-secondary px-3 md:px-4 py-2 md:py-3">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Example prompts — only when chat is fresh */}
          {messages.length <= 1 && (
            <div className="px-3 md:px-4 pb-2 flex-shrink-0 overflow-x-auto">
              <div className="max-w-4xl mx-auto">
                <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">Try asking:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1 md:gap-2">
                  {examplePrompts.map((prompt) => (
                    <button
                      key={prompt.label}
                      onClick={() => setInput(prompt.prompt)}
                      className="flex items-center gap-1 md:gap-2 p-2 md:p-3 rounded-lg border border-border bg-secondary/50 text-left hover:bg-secondary transition-colors text-xs md:text-sm"
                    >
                      <prompt.icon className="h-3 w-3 md:h-4 md:w-4 text-primary shrink-0" />
                      <span className="text-foreground truncate">{prompt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="p-3 md:p-4 border-t border-border flex-shrink-0">
            <div className="max-w-4xl mx-auto">
              <div className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder={
                        ? "Sign in to continue asking questions..."
                        : "Ask anything you want to learn..."
                    }
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    className="pr-10 bg-secondary border-border text-sm"
                    disabled={isTyping}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  size="sm"
                  className="shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                "Ask any question to your AI tutor..."
              </p>
            </div>
          </div>
        </div>
      </div>

      <LoginGateModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        featureName="AI Tutor"
      />
      <CreditsExhaustedModal
        open={showCreditsModal}
        onOpenChange={setShowCreditsModal}
        feature="AI chat"
      />
    </>
  )
}
