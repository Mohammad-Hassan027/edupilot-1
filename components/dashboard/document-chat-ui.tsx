"use client"

import { useState, useRef, useEffect } from "react"
import { Send, User, Bot, Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"

interface DocumentChatUIProps {
  documentId: string
  fileUrl: string
  title: string
}

interface Message {
  id: string
  role: "user" | "ai"
  content: string
}

export function DocumentChatUI({ documentId, fileUrl, title }: DocumentChatUIProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "ai", content: `Hello! I've analyzed "${title}". What would you like to know?` }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput("")
    
    setMessages(prev => [...prev, { id: Date.now().toString(), role: "user", content: userMessage }])
    setLoading(true)

    try {
      const res = await fetch("/api/documents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, message: userMessage }),
      })

      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "ai", content: data.reply }])
      } else {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "ai", content: "Sorry, I encountered an error searching the document." }])
      }
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "ai", content: "Connection error." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] w-full overflow-hidden border rounded-xl bg-background shadow-sm">
      {/* Left side: PDF Viewer */}
      <div className="w-full md:w-1/2 lg:w-3/5 h-1/2 md:h-full border-b md:border-b-0 md:border-r flex flex-col relative bg-muted/20">
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <Link href="/document-chat">
            <Button variant="secondary" size="sm" className="shadow-md">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Documents
            </Button>
          </Link>
        </div>
        <iframe 
          src={`${fileUrl}#toolbar=0`} 
          className="w-full h-full border-none"
          title={title}
        />
      </div>

      {/* Right side: Chat */}
      <div className="w-full md:w-1/2 lg:w-2/5 h-1/2 md:h-full flex flex-col">
        <div className="p-4 border-b bg-card">
          <h2 className="font-semibold truncate">Chat about {title}</h2>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <Avatar className="w-8 h-8 shrink-0">
                  {msg.role === "ai" ? (
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <Bot size={16} />
                    </AvatarFallback>
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <User size={16} />
                    </AvatarFallback>
                  )}
                </Avatar>
                <div
                  className={`rounded-lg p-3 text-sm max-w-[85%] whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 flex-row">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Bot size={16} />
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-lg p-4 bg-muted flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-card">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about this document..."
              className="flex-1"
              disabled={loading}
            />
            <Button type="submit" size="icon" disabled={!input.trim() || loading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
