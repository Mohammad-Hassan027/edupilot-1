"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Mic, Volume2, Loader2, MessageSquare, Trash2, Crown } from "lucide-react"
import { cn } from "@/lib/utils"
import { LoginGateModal } from "@/components/login-gate-modal"
import { useUser } from "@/hooks/use-user"
import { canAccessFeature } from "@/lib/plans"

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

export default function AIVoicePage() {
  const { subscription, refetch, isLoading, error: userError, email } = useUser()
  const [voiceState, setVoiceState] = useState<VoiceState>("idle")
  const [messages, setMessages] = useState<Message[]>([])
  const [transcript, setTranscript] = useState("")
  const [error, setError] = useState("")
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [pendingVoiceAction, setPendingVoiceAction] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const canUseVoice = canAccessFeature(subscription, "ai_voice")
  const activePlanName = subscription?.plan_id === "premium" ? "Premium" : subscription?.plan_id === "pro" ? "Pro" : null

  useEffect(() => {
    synthRef.current = window.speechSynthesis
    return () => { synthRef.current?.cancel() }
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const speak = (text: string) => {
    if (!synthRef.current) return
    synthRef.current.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = 0.95
    utter.pitch = 1
    utter.onend = () => setVoiceState("idle")
    setVoiceState("speaking")
    synthRef.current.speak(utter)
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
      synthRef.current?.cancel()
      setVoiceState("idle")
      return
    }

    if (voiceState === "listening") {
      recognitionRef.current?.stop()
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
    recognition.maxAlternatives = 1

    recognition.onstart = () => setVoiceState("listening")
    recognition.onresult = async (event) => {
      const userText = event.results[0][0].transcript
      setTranscript(userText)
      setVoiceState("processing")

      const userMsg: Message = { id: Date.now().toString(), role: "user", text: userText }
      setMessages((prev) => [...prev, userMsg])

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userText }),
        })
        const data = await res.json()

        if (!res.ok) {
          if (data.requiresLogin) { setShowLoginModal(true); setVoiceState("idle"); return }
          if (data.requiresUpgrade) { setShowPlanModal(true); setVoiceState("idle"); return }
          throw new Error(data.error || "AI error")
        }

        const aiMsg: Message = { id: `${Date.now()}-assistant`, role: "assistant", text: data.reply }
        setMessages((prev) => [...prev, aiMsg])
        fetch("/api/usage/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            feature: "ai_voice",
            action: "voice_prompt_completed",
            metadata: { prompt: userText },
          }),
        }).catch(() => undefined)
        speak(data.reply)
      } catch (e) {
        const errText = e instanceof Error ? e.message : "Something went wrong"
        setError(errText)
        setVoiceState("idle")
      }
    }
    recognition.onerror = (e) => {
      if (e.error !== "no-speech") setError(`Voice error: ${e.error}`)
      setVoiceState("idle")
    }
    recognition.onend = () => setVoiceState((prev) => (prev === "listening" ? "idle" : prev))

    recognitionRef.current = recognition
    recognition.start()
  }


  useEffect(() => {
    if (!pendingVoiceAction || isLoading) return
    setPendingVoiceAction(false)
    handleVoiceToggle()
  }, [pendingVoiceAction, isLoading, userError, email, canUseVoice, voiceState])

  const stateLabel = {
    idle: "Tap to speak",
    listening: "Listening...",
    processing: "Thinking...",
    speaking: "Speaking — tap to stop",
  }

  return (
    <>
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Voice Assistant</h1>
          <p className="text-muted-foreground">Ask questions hands-free — powered by Gemini AI</p>
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

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="relative overflow-hidden border-border bg-card">
            <div className="absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
            <CardHeader className="relative pb-2 text-center">
              <CardTitle className="text-lg font-semibold text-foreground">Voice Control</CardTitle>
              <p className="text-sm text-muted-foreground">Tap the microphone to start</p>
            </CardHeader>
            <CardContent className="relative flex flex-col items-center space-y-8 py-8">
              {voiceState === "listening" && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="absolute animate-ping rounded-full border-2 border-primary/30"
                      style={{ width: `${80 + i * 40}px`, height: `${80 + i * 40}px`, animationDelay: `${i * 0.2}s`, animationDuration: "1.5s" }}
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
                {transcript && voiceState !== "listening" && <p className="text-sm italic text-muted-foreground">&ldquo;{transcript}&rdquo;</p>}
              </div>

              {error && <div className="max-w-xs rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">{error}</div>}

              <div className="rounded-lg bg-secondary/50 px-4 py-3 text-center text-xs text-muted-foreground">
                Works best in Chrome or Edge browser.
                Speak clearly after tapping the mic.
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col border-border bg-card" style={{ minHeight: "400px" }}>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <MessageSquare className="h-5 w-5 text-primary" />
                Conversation
              </CardTitle>
              {messages.length > 0 && (
                <Button size="sm" variant="ghost" className="gap-1 text-muted-foreground" onClick={() => setMessages([])}>
                  <Trash2 className="h-4 w-4" /> Clear
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
                    Tap the mic and ask anything!
                  </p>
                </div>
              ) : (
                <ScrollArea className="flex-1 pr-2">
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6",
                          message.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                        )}
                      >
                        {message.text}
                      </div>
                    ))}
                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <LoginGateModal open={showLoginModal} onOpenChange={setShowLoginModal} featureName="AI Voice" />
    </>
  )
}
