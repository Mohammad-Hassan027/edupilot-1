"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Mic,
  Volume2,
  Loader2,
  MessageSquare,
  Trash2,
  Crown,
  History,
  Eye,
  Square,
  Play,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { LoginGateModal } from "@/components/login-gate-modal"
import { useUser } from "@/hooks/use-user"
import { canAccessFeature } from "@/lib/plans"
import { MarkdownRenderer } from "@/components/markdown-renderer"

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition
    webkitSpeechRecognition?: new () => SpeechRecognition
  }
}

type VoiceState = "idle" | "listening" | "processing" | "speaking"

interface Message {
  id: string
  role: "user" | "assistant"
  text: string
}

interface VoiceHistoryItem {
  id: string
  prompt: string
  title: string
  response: string
  created_at: string
}

export default function AIVoicePage() {
  const { subscription, isLoading, error: userError, email } = useUser()

  const [voiceState, setVoiceState] = useState<VoiceState>("idle")
  const [messages, setMessages] = useState<Message[]>([])
  const [transcript, setTranscript] = useState("")
  const [error, setError] = useState("")
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [pendingVoiceAction, setPendingVoiceAction] = useState(false)
  const [history, setHistory] = useState<VoiceHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isSubmittingRef = useRef(false)

  const canUseVoice = canAccessFeature(subscription, "ai_voice")
  const activePlanName =
    subscription?.plan_id === "premium" ? "Premium" : subscription?.plan_id === "pro" ? "Pro" : null

  useEffect(() => {
    synthRef.current = window.speechSynthesis
    return () => {
      synthRef.current?.cancel()
      recognitionRef.current?.stop()
    }
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    void loadHistory()
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    const historyId = new URLSearchParams(window.location.search).get("history")
    if (!historyId) return

    const existing = history.find((item) => item.id === historyId)
    if (existing) {
      openHistory(existing)
      return
    }

    if (!historyLoading) {
      void loadHistoryItem(historyId)
    }
  }, [history, historyLoading])

  const stopEverything = () => {
    try {
      recognitionRef.current?.stop()
    } catch {
      //
    }

    try {
      synthRef.current?.cancel()
    } catch {
      //
    }

    isSubmittingRef.current = false
    setVoiceState("idle")
  }

  const speak = (text: string) => {
    if (!synthRef.current) return

    synthRef.current.cancel()

    const utter = new SpeechSynthesisUtterance(
      text
        .replace(/#{1,6}\s*/g, "")
        .replace(/\*\*/g, "")
        .replace(/`/g, "")
        .trim()
    )

    utter.rate = 0.95
    utter.pitch = 1
    utter.onend = () => {
      setVoiceState("idle")
    }
    utter.onerror = () => {
      setVoiceState("idle")
    }

    setVoiceState("speaking")
    synthRef.current.speak(utter)
  }

  async function loadHistory() {
    try {
      setHistoryLoading(true)
      const response = await fetch("/api/ai/voice", { cache: "no-store" })
      const data = await response.json().catch(() => ({ history: [] }))

      if (response.ok) {
        setHistory(data.history || [])
      }
    } catch {
      //
    } finally {
      setHistoryLoading(false)
    }
  }

  function openHistory(item: VoiceHistoryItem) {
    setMessages([
      {
        id: `${item.id}-user`,
        role: "user",
        text: item.prompt,
      },
      {
        id: `${item.id}-assistant`,
        role: "assistant",
        text: item.response,
      },
    ])

    setTranscript(item.prompt)
    setCurrentHistoryId(item.id)
    setError("")
    setVoiceState("idle")

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      url.searchParams.set("history", item.id)
      window.history.replaceState({}, "", url.toString())
    }
  }

  async function loadHistoryItem(historyId: string) {
    try {
      const response = await fetch(`/api/ai/voice/${historyId}`, { cache: "no-store" })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.item) return

      const item = data.item as VoiceHistoryItem
      setHistory((prev) => (prev.some((entry) => entry.id === item.id) ? prev : [item, ...prev]))
      openHistory(item)
    } catch {
      //
    }
  }

  const runPrompt = async (userText: string) => {
    const cleanText = userText.trim()
    if (!cleanText || isSubmittingRef.current) return

    isSubmittingRef.current = true
    setError("")
    setTranscript(cleanText)
    setVoiceState("processing")

    const userMessageId = `user-${Date.now()}`
    const assistantMessageId = `assistant-${Date.now()}`

    setMessages([
      {
        id: userMessageId,
        role: "user",
        text: cleanText,
      },
    ])

    try {
      const res = await fetch("/api/ai/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: cleanText }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.requiresLogin) {
          setShowLoginModal(true)
          setVoiceState("idle")
          isSubmittingRef.current = false
          return
        }

        if (data.requiresUpgrade) {
          window.location.href = "/pricing?plan=pro&feature=ai-voice"
          setVoiceState("idle")
          isSubmittingRef.current = false
          return
        }

        throw new Error(data.error || "AI error")
      }

      setMessages([
        {
          id: userMessageId,
          role: "user",
          text: cleanText,
        },
        {
          id: assistantMessageId,
          role: "assistant",
          text: data.reply,
        },
      ])

      if (data.historyItem) {
        const item = data.historyItem as VoiceHistoryItem
        setCurrentHistoryId(item.id)
        setHistory((prev) => [item, ...prev.filter((entry) => entry.id !== item.id)].slice(0, 12))

        if (typeof window !== "undefined") {
          const url = new URL(window.location.href)
          url.searchParams.set("history", item.id)
          window.history.replaceState({}, "", url.toString())
        }
      } else {
        await loadHistory()
      }

      speak(data.reply)
    } catch (e) {
      const errText = e instanceof Error ? e.message : "Something went wrong"
      setError(errText)
      setVoiceState("idle")
    } finally {
      isSubmittingRef.current = false
    }
  }

  const handleVoiceToggle = () => {
    if (isLoading) {
      setPendingVoiceAction(true)
      return
    }

    if (userError === "not_authenticated" || !email) {
      setShowLoginModal(true)
      return
    }

    if (!canUseVoice) {
      window.location.href = "/pricing?plan=pro&feature=ai-voice"
      return
    }

    if (voiceState === "speaking") {
      stopEverything()
      return
    }

    if (voiceState === "listening") {
      stopEverything()
      return
    }

    if (voiceState === "processing") {
      return
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionAPI) {
      setError("Your browser doesn't support voice input. Try Chrome or Edge.")
      return
    }

    setError("")

    const recognition = new SpeechRecognitionAPI()
    recognition.lang = "en-US"
    recognition.interimResults = false
    recognition.continuous = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setVoiceState("listening")
    }

    recognition.onresult = async (event) => {
      const userText = event.results?.[0]?.[0]?.transcript?.trim() || ""
      try {
        recognition.stop()
      } catch {
        //
      }

      if (!userText) {
        setVoiceState("idle")
        return
      }

      await runPrompt(userText)
    }

    recognition.onerror = (e) => {
      if (e.error !== "no-speech" && e.error !== "aborted") {
        setError(`Voice error: ${e.error}`)
      }
      setVoiceState("idle")
    }

    recognition.onend = () => {
      setVoiceState((prev) => (prev === "listening" ? "idle" : prev))
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  useEffect(() => {
    if (!pendingVoiceAction || isLoading) return
    setPendingVoiceAction(false)
    handleVoiceToggle()
  }, [pendingVoiceAction, isLoading, userError, email, canUseVoice, voiceState])

  const handleReplayHistory = (item: VoiceHistoryItem) => {
    openHistory(item)
    speak(item.response)
  }

  const stateLabel = {
    idle: "Tap to speak",
    listening: "Listening...",
    processing: "Thinking...",
    speaking: "Speaking...",
  }

  return (
    <>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Voice Assistant</h1>
          <p className="text-muted-foreground">Ask one question and get one clean spoken answer with saved history</p>
        </div>

        {activePlanName ? (
          <Card className="border-emerald-500/30 bg-emerald-500/10">
            <CardContent className="flex items-start gap-3 p-4 text-sm">
              <Crown className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
              <div>
                <p className="font-medium text-foreground">You are on {activePlanName} Plan.</p>
                <p className="mt-1 text-muted-foreground">Your premium features are now active across the app.</p>
              </div>
            </CardContent>
          </Card>
        ) : !canUseVoice ? (
          <Card className="border-amber-500/30 bg-amber-500/10">
            <CardContent className="flex items-start gap-3 p-4 text-sm">
              <Crown className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <p className="font-medium text-foreground">AI Voice is a Pro feature.</p>
                <p className="mt-1 text-muted-foreground">
                  Upgrade on the Pricing page to unlock AI Voice instantly after successful payment.
                </p>
                <div className="mt-3">
                  <Button asChild size="sm" variant="outline">
                    <Link href="/pricing?plan=pro&feature=ai-voice">View Pricing</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)_320px]">
          <Card className="relative overflow-hidden border-border bg-card">
            <div className="absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />

            <CardHeader className="relative pb-2 text-center">
              <CardTitle className="text-lg font-semibold text-foreground">Voice Control</CardTitle>
              <p className="text-sm text-muted-foreground">Tap the microphone to start</p>
            </CardHeader>

            <CardContent className="relative flex flex-col items-center space-y-6 py-8">
              {voiceState === "listening" && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="absolute animate-ping rounded-full border-2 border-primary/30"
                      style={{
                        width: `${80 + i * 40}px`,
                        height: `${80 + i * 40}px`,
                        animationDelay: `${i * 0.2}s`,
                        animationDuration: "1.5s",
                      }}
                    />
                  ))}
                </div>
              )}

              <button
                onClick={handleVoiceToggle}
                className={cn(
                  "relative z-10 flex h-24 w-24 items-center justify-center rounded-full shadow-2xl transition-all duration-300",
                  voiceState === "idle" && "bg-primary hover:scale-105 hover:bg-primary/90",
                  voiceState === "listening" && "scale-110 bg-primary",
                  voiceState === "processing" && "cursor-wait bg-muted",
                  voiceState === "speaking" && "bg-accent hover:bg-accent/90",
                  isLoading && "cursor-wait opacity-60"
                )}
              >
                {voiceState === "idle" && <Mic className="h-10 w-10 text-primary-foreground" />}
                {voiceState === "listening" && <Mic className="h-10 w-10 animate-pulse text-primary-foreground" />}
                {voiceState === "processing" && <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />}
                {voiceState === "speaking" && <Volume2 className="h-10 w-10 text-accent-foreground" />}
              </button>

              <div className="space-y-1 text-center">
                <p className="text-base font-semibold text-foreground">{stateLabel[voiceState]}</p>
                {transcript && voiceState !== "listening" && (
                  <p className="text-sm italic text-muted-foreground">&ldquo;{transcript}&rdquo;</p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  onClick={handleVoiceToggle}
                  disabled={isLoading || voiceState === "processing"}
                  className="gap-2"
                >
                  <Mic className="h-4 w-4" />
                  {voiceState === "idle" ? "Start" : voiceState === "listening" ? "Listening..." : voiceState === "speaking" ? "Speaking..." : "Processing..."}
                </Button>

                {(voiceState === "listening" || voiceState === "speaking") && (
                  <Button variant="destructive" onClick={stopEverything} className="gap-2">
                    <Square className="h-4 w-4" />
                    Stop
                  </Button>
                )}
              </div>

              {error && (
                <div className="max-w-xs rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="rounded-lg bg-secondary/50 px-4 py-3 text-center text-xs text-muted-foreground">
                Works best in Chrome or Edge browser.
                <br />
                Speak clearly after tapping the mic.
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col border-border bg-card min-h-[560px]">
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <MessageSquare className="h-5 w-5 text-primary" />
                Conversation
              </CardTitle>

              {messages.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1 text-muted-foreground"
                  onClick={() => {
                    setMessages([])
                    setTranscript("")
                    setCurrentHistoryId(null)
                    stopEverything()

                    if (typeof window !== "undefined") {
                      const url = new URL(window.location.href)
                      url.searchParams.delete("history")
                      window.history.replaceState({}, "", url.toString())
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </CardHeader>

            <CardContent className="flex flex-1 flex-col">
              {messages.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Mic className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your conversation will appear here.
                    <br />
                    Tap the mic and ask anything.
                  </p>
                </div>
              ) : (
                <ScrollArea className="flex-1 pr-2">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "rounded-2xl px-4 py-3 text-sm",
                          message.role === "user"
                            ? "ml-auto max-w-[82%] bg-primary text-primary-foreground"
                            : "max-w-full bg-secondary text-foreground"
                        )}
                      >
                        {message.role === "assistant" ? (
                          <MarkdownRenderer content={message.text} className="text-sm" />
                        ) : (
                          <div className="leading-6">{message.text}</div>
                        )}
                      </div>
                    ))}
                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card h-fit max-h-[560px] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="h-5 w-5 text-primary" />
                Voice History
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 overflow-y-auto">
              {historyLoading ? (
                <div className="text-sm text-muted-foreground">Loading history...</div>
              ) : history.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
                  <Mic className="h-8 w-8 text-primary mx-auto mb-3" />
                  <p className="font-medium text-foreground">No voice history yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ask something with AI Voice and it will appear here.
                  </p>
                </div>
              ) : (
                history.map((item) => {
                  const isActive = currentHistoryId === item.id

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "rounded-xl border transition-all p-3",
                        isActive
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background/40 hover:border-primary/40 hover:bg-primary/5"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => openHistory(item)}
                          className="flex min-w-0 flex-1 items-start gap-2 text-left"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card shrink-0">
                            <Mic className="h-4 w-4 text-primary" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground truncate">{item.title}</p>
                            <div className="mt-1">
                              <Badge variant="secondary" className="text-[11px]">
                                AI Voice
                              </Badge>
                            </div>
                          </div>
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleReplayHistory(item)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>

                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => openHistory(item)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <LoginGateModal open={showLoginModal} onOpenChange={setShowLoginModal} featureName="AI Voice" />
    </>
  )
}