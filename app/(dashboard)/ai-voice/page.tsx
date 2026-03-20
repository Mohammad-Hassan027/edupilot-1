"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Mic, Volume2, Loader2, MessageSquare, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { LoginGateModal } from "@/components/login-gate-modal"
import { CreditsExhaustedModal } from "@/components/credits-exhausted-modal"

type VoiceState = "idle" | "listening" | "processing" | "speaking"

interface Message {
  id: string
  role: "user" | "assistant"
  text: string
}

export default function AIVoicePage() {
  const [voiceState, setVoiceState]       = useState<VoiceState>("idle")
  const [messages, setMessages]           = useState<Message[]>([])
  const [transcript, setTranscript]       = useState("")
  const [error, setError]                 = useState("")
  const [showLoginModal, setShowLoginModal]     = useState(false)
  const [showCreditsModal, setShowCreditsModal] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const synthRef       = useRef<SpeechSynthesis | null>(null)
  const scrollRef      = useRef<HTMLDivElement>(null)

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
    utter.rate  = 0.95
    utter.pitch = 1
    utter.onend = () => setVoiceState("idle")
    setVoiceState("speaking")
    synthRef.current.speak(utter)
  }

  const handleVoiceToggle = () => {
    if (voiceState === "speaking") {
      synthRef.current?.cancel()
      setVoiceState("idle")
      return
    }

    if (voiceState === "listening") {
      recognitionRef.current?.stop()
      return
    }

    // Start listening
    const SpeechRecognitionAPI =
      window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition: typeof SpeechRecognition }).webkitSpeechRecognition

    if (!SpeechRecognitionAPI) {
      setError("Your browser doesn't support voice input. Try Chrome or Edge.")
      return
    }

    setError("")
    const recognition = new SpeechRecognitionAPI()
    recognition.lang          = "en-US"
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart  = () => setVoiceState("listening")
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
          if (data.requiresLogin)  { setShowLoginModal(true);  setVoiceState("idle"); return }
          if (data.requiresUpgrade){ setShowCreditsModal(true); setVoiceState("idle"); return }
          throw new Error(data.error || "AI error")
        }

        const aiMsg: Message = { id: (Date.now()+1).toString(), role: "assistant", text: data.reply }
        setMessages((prev) => [...prev, aiMsg])
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
    recognition.onend = () => {
      if (voiceState === "listening") setVoiceState("idle")
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const stateLabel = {
    idle:       "Tap to speak",
    listening:  "Listening...",
    processing: "Thinking...",
    speaking:   "Speaking — tap to stop",
  }

  return (
    <>
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Voice Assistant</h1>
          <p className="text-muted-foreground">Ask questions hands-free — powered by Gemini AI</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Voice Control Card */}
          <Card className="border-border bg-card overflow-hidden relative">
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
            <CardHeader className="relative text-center pb-2">
              <CardTitle className="text-lg font-semibold text-foreground">Voice Control</CardTitle>
              <p className="text-sm text-muted-foreground">Tap the microphone to start</p>
            </CardHeader>
            <CardContent className="relative flex flex-col items-center space-y-8 py-8">
              {/* Ripple rings */}
              {voiceState === "listening" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {[1,2,3].map(i => (
                    <div key={i} className="absolute rounded-full border-2 border-primary/30 animate-ping"
                      style={{ width: `${80+i*40}px`, height: `${80+i*40}px`, animationDelay: `${i*0.2}s`, animationDuration: "1.5s" }} />
                  ))}
                </div>
              )}

              {/* Mic button */}
              <button
                onClick={handleVoiceToggle}
                className={cn(
                  "relative z-10 flex h-24 w-24 items-center justify-center rounded-full shadow-2xl transition-all duration-300",
                  voiceState === "idle"       && "bg-primary hover:bg-primary/90 hover:scale-105",
                  voiceState === "listening"  && "bg-primary scale-110",
                  voiceState === "processing" && "bg-muted cursor-wait",
                  voiceState === "speaking"   && "bg-accent hover:bg-accent/90"
                )}
              >
                {voiceState === "idle"       && <Mic       className="h-10 w-10 text-primary-foreground" />}
                {voiceState === "listening"  && <Mic       className="h-10 w-10 text-primary-foreground animate-pulse" />}
                {voiceState === "processing" && <Loader2   className="h-10 w-10 text-muted-foreground animate-spin" />}
                {voiceState === "speaking"   && <Volume2   className="h-10 w-10 text-accent-foreground" />}
              </button>

              <div className="text-center space-y-1">
                <p className="text-base font-semibold text-foreground">{stateLabel[voiceState]}</p>
                {transcript && voiceState !== "listening" && (
                  <p className="text-sm text-muted-foreground italic">&ldquo;{transcript}&rdquo;</p>
                )}
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive text-center max-w-xs">
                  {error}
                </div>
              )}

              <div className="rounded-lg bg-secondary/50 px-4 py-3 text-xs text-muted-foreground text-center">
                Works best in Chrome or Edge browser.
                Speak clearly after tapping the mic.
              </div>
            </CardContent>
          </Card>

          {/* Conversation History */}
          <Card className="border-border bg-card flex flex-col" style={{ minHeight: "400px" }}>
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Conversation
              </CardTitle>
              {messages.length > 0 && (
                <Button size="sm" variant="ghost" className="gap-1 text-muted-foreground"
                  onClick={() => setMessages([])}>
                  <Trash2 className="h-4 w-4" /> Clear
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mic className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your conversation will appear here.<br />
                    Tap the mic and ask anything!
                  </p>
                </div>
              ) : (
                <ScrollArea className="flex-1 pr-2">
                  <div className="space-y-3">
                    {messages.map((m) => (
                      <div key={m.id} className={cn("flex gap-2", m.role === "user" && "justify-end")}>
                        <div className={cn(
                          "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                          m.role === "assistant"
                            ? "bg-secondary text-foreground"
                            : "bg-primary text-primary-foreground"
                        )}>
                          {m.text}
                        </div>
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
      <CreditsExhaustedModal open={showCreditsModal} onOpenChange={setShowCreditsModal} feature="AI chat" />
    </>
  )
}
