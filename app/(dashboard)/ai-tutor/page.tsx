"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import {
  Send, MessageSquareText, Sparkles, MessageSquare, Clock, ChevronRight,
  Copy, ThumbsUp, ThumbsDown, Mic, RefreshCw, BookOpen, FileQuestion, Lightbulb
} from "lucide-react"
import { cn } from "@/lib/utils"
import { LoginGateModal } from "@/components/login-gate-modal"
import { CreditsExhaustedModal } from "@/components/credits-exhausted-modal"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const examplePrompts = [
  { icon: BookOpen, label: "Explain a concept", prompt: "Explain the concept of REST APIs in simple terms" },
  { icon: FileQuestion, label: "Quiz me", prompt: "Create a 5 question quiz about JavaScript basics" },
  { icon: Lightbulb, label: "Study tips", prompt: "Give me effective strategies for learning programming" },
  { icon: MessageSquareText, label: "Solve a problem", prompt: "Help me understand this design pattern step by step" },
]

const chatHistory = [
  { id: "1", title: "API Design Concepts", time: "2 hours ago", messages: 12 },
  { id: "2", title: "Machine Learning Basics", time: "Yesterday", messages: 8 },
  { id: "3", title: "Startup Funding 101", time: "2 days ago", messages: 15 },
  { id: "4", title: "UI Design Principles", time: "3 days ago", messages: 6 },
]

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hello! I'm your AI study assistant. I can help you understand complex topics, create quizzes, explain concepts, and much more. What would you like to learn today?",
    timestamp: new Date(),
  },
]

export default function AITutorPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showCreditsModal, setShowCreditsModal] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
    setInput("")
    setIsTyping(true)

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.code === "GUEST_LIMIT_REACHED" || data.requiresLogin) {
          setShowLoginModal(true)
          setMessages((prev) => prev.filter((m) => m.id !== userMessage.id))
          setInput(input) // restore input
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

  const handlePromptClick = (prompt: string) => {
    setInput(prompt)
  }

  return (
    <>
      <div className="flex h-[calc(100vh-4rem)] gap-3 md:gap-4 p-3 md:p-6 overflow-hidden">
        {/* Chat History Sidebar */}
        <Card className="hidden lg:flex w-64 xl:w-72 flex-col border-border bg-card flex-shrink-0">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Chat History</h2>
            <Button size="sm" variant="ghost" className="text-primary">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {chatHistory.map((chat) => (
                <button key={chat.id} className="w-full flex items-start gap-3 p-3 rounded-lg text-left hover:bg-secondary transition-colors">
                  <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{chat.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{chat.time}</span>
                      <span>•</span>
                      <span>{chat.messages} messages</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </ScrollArea>
          <div className="p-4 border-t border-border">
            <Button className="w-full gap-2" size="sm">
              <Sparkles className="h-4 w-4" />
              New Chat
            </Button>
          </div>
        </Card>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-card rounded-lg md:rounded-xl border border-border overflow-hidden min-w-0">
          <div className="flex items-center gap-3 p-3 md:p-4 border-b border-border flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 flex-shrink-0">
              <MessageSquareText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-foreground text-sm md:text-base">AI Study Tutor</h1>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                <span className="text-xs text-muted-foreground">Online • Ready to help</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 md:p-4 min-h-0">
            <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto">
              {messages.map((message) => (
                <div key={message.id} className={cn("flex gap-2 md:gap-3", message.role === "user" && "flex-row-reverse justify-end")}>
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs md:text-sm font-medium", message.role === "assistant" ? "bg-primary/20 text-primary" : "bg-primary text-primary-foreground")}>
                    {message.role === "assistant" ? <MessageSquareText className="h-4 w-4" /> : "You"}
                  </div>
                  <div className={cn("flex-1 space-y-2 max-w-xs md:max-w-xl lg:max-w-2xl", message.role === "user" && "flex flex-col items-end")}>
                    <div className={cn("rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 break-words", message.role === "assistant" ? "bg-secondary text-foreground" : "bg-primary text-primary-foreground")}>
                      <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === "assistant" && (
                      <div className="flex items-center gap-1 md:gap-2 px-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 text-muted-foreground hover:text-foreground" onClick={() => navigator.clipboard.writeText(message.content)}>
                          <Copy className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 text-muted-foreground hover:text-foreground">
                          <ThumbsUp className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 text-muted-foreground hover:text-foreground">
                          <ThumbsDown className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

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

          {messages.length <= 1 && (
            <div className="px-3 md:px-4 pb-2 flex-shrink-0 overflow-x-auto">
              <div className="max-w-4xl mx-auto">
                <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">Try asking:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1 md:gap-2">
                  {examplePrompts.map((prompt) => (
                    <button key={prompt.label} onClick={() => handlePromptClick(prompt.prompt)} className="flex items-center gap-1 md:gap-2 p-2 md:p-3 rounded-lg border border-border bg-secondary/50 text-left hover:bg-secondary transition-colors text-xs md:text-sm">
                      <prompt.icon className="h-3 w-3 md:h-4 md:w-4 text-primary shrink-0" />
                      <span className="text-foreground truncate">{prompt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="p-3 md:p-4 border-t border-border flex-shrink-0">
            <div className="max-w-4xl mx-auto">
              <div className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="Ask anything you want to learn..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    className="pr-10 bg-secondary border-border text-sm"
                    disabled={isTyping}
                  />
                  <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground">
                    <Mic className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={handleSend} disabled={!input.trim() || isTyping} size="sm" className="shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                AI can make mistakes. Consider checking important information.
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
