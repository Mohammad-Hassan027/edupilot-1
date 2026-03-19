"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Mic,
  Volume2,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

type VoiceState = "idle" | "listening" | "processing" | "speaking"

export default function AIVoicePage() {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle")

  const handleVoiceToggle = () => {
    if (voiceState === "idle") {
      setVoiceState("listening")
      // Simulate voice processing
      setTimeout(() => setVoiceState("processing"), 3000)
      setTimeout(() => setVoiceState("speaking"), 4500)
      setTimeout(() => setVoiceState("idle"), 7000)
    } else {
      setVoiceState("idle")
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Voice Assistant</h1>
        <p className="text-muted-foreground">Learn hands-free using voice interaction</p>
      </div>

      <div className="flex justify-center">
        {/* Voice Assistant Card */}
        <Card className="border-border bg-card overflow-hidden relative w-full max-w-md">
          {/* Background glow */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
          
          <CardHeader className="relative text-center pb-2">
            <CardTitle className="text-lg font-semibold text-foreground">Voice Control</CardTitle>
            <p className="text-sm text-muted-foreground">Tap to start speaking</p>
          </CardHeader>

          <CardContent className="relative flex flex-col items-center space-y-8 py-8">
            {/* Microphone Button */}
            <div className="relative">
              {/* Animated rings */}
              {voiceState === "listening" && (
                <>
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: "1.5s" }} />
                  <div className="absolute inset-[-8px] rounded-full bg-primary/10 animate-pulse" />
                </>
              )}
              {voiceState === "speaking" && (
                <div className="absolute inset-[-8px] rounded-full bg-accent/20 animate-pulse" />
              )}
              
              <button
                onClick={handleVoiceToggle}
                className={cn(
                  "relative flex h-24 w-24 items-center justify-center rounded-full transition-all duration-300",
                  voiceState === "idle" && "bg-primary hover:bg-primary/90 hover:scale-105",
                  voiceState === "listening" && "bg-primary scale-110",
                  voiceState === "processing" && "bg-muted cursor-wait",
                  voiceState === "speaking" && "bg-accent"
                )}
              >
                {voiceState === "idle" && <Mic className="h-10 w-10 text-primary-foreground" />}
                {voiceState === "listening" && <Mic className="h-10 w-10 text-primary-foreground animate-pulse" />}
                {voiceState === "processing" && <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />}
                {voiceState === "speaking" && <Volume2 className="h-10 w-10 text-accent-foreground" />}
              </button>
            </div>

            {/* Status Text */}
            <div className="text-center space-y-1">
              <p className="text-lg font-medium text-foreground">
                {voiceState === "idle" && "Ready to listen"}
                {voiceState === "listening" && "Listening..."}
                {voiceState === "processing" && "Processing..."}
                {voiceState === "speaking" && "Speaking..."}
              </p>
              <p className="text-sm text-muted-foreground">
                {voiceState === "idle" && "Tap the microphone to start"}
                {voiceState === "listening" && "Speak your question or command"}
                {voiceState === "processing" && "Analyzing your request"}
                {voiceState === "speaking" && "Playing AI response"}
              </p>
            </div>

            {/* Waveform Animation */}
            {(voiceState === "listening" || voiceState === "speaking") && (
              <div className="flex items-center justify-center gap-1 h-12">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-1 rounded-full transition-all",
                      voiceState === "listening" ? "bg-primary" : "bg-accent"
                    )}
                    style={{
                      height: `${Math.random() * 100}%`,
                      animation: `waveform 0.5s ease-in-out infinite alternate`,
                      animationDelay: `${i * 0.05}s`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Quick Voice Commands */}
            <div className="w-full space-y-2">
              <p className="text-sm font-medium text-muted-foreground text-center">Quick commands</p>
              <div className="flex flex-wrap justify-center gap-2">
                {["Explain a concept", "Quiz me", "Summarize notes", "Read flashcards"].map((cmd) => (
                  <Button key={cmd} variant="outline" size="sm" className="text-xs">
                    {cmd}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>

          <style jsx>{`
            @keyframes waveform {
              0% { height: 20%; }
              100% { height: 80%; }
            }
          `}</style>
        </Card>
      </div>
    </div>
  )
}
