import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sparkles, Brain } from "lucide-react"
import { useUser } from "@/hooks/use-user"

interface TopicAnalyzerFormProps {
  onSubmit: (topic: string) => void
  isLoading: boolean
}

const SUGGESTIONS = [
  "Operating Systems",
  "React Hooks",
  "Computer Networks",
  "Dynamic Programming",
]

export function TopicAnalyzerForm({ onSubmit, isLoading }: TopicAnalyzerFormProps) {
  const [topic, setTopic] = useState("")
  const [error, setError] = useState("")
  const { credits, subscription } = useUser()

  const trialActive = subscription?.trial_active ?? false
  const remaining = credits?.ai_chat_remaining ?? 0
  const isTrial = subscription?.status === "trial" || trialActive

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const cleanTopic = topic.trim()
    if (!cleanTopic) {
      setError("Please enter a topic.")
      return
    }

    if (cleanTopic.length > 100) {
      setError("Topic is too long (maximum 100 characters).")
      return
    }

    onSubmit(cleanTopic)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setTopic(suggestion)
    setError("")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="topic-input" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Brain className="h-4 w-4 text-primary" />
          Enter Topic to Analyze
        </label>
        <div className="flex gap-2">
          <Input
            id="topic-input"
            type="text"
            placeholder="e.g. Operating Systems, React Hooks..."
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value)
              if (error) setError("")
            }}
            disabled={isLoading}
            className="flex-1 border-border bg-card/50 text-foreground placeholder:text-muted-foreground shadow-xs focus-visible:ring-1 focus-visible:ring-primary"
          />
          <Button
            type="submit"
            disabled={isLoading || (!isTrial && remaining <= 0)}
            className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-5 shadow-md hover:shadow-primary/20 transition-all gap-2"
          >
            {isLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Analyze
              </>
            )}
          </Button>
        </div>
        {error && <p className="text-xs text-rose-500 font-medium mt-1">{error}</p>}
      </div>

      {/* Suggestion Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-1.5">
        <span className="text-xs text-muted-foreground font-medium mr-1">Suggestions:</span>
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={isLoading}
            onClick={() => handleSuggestionClick(suggestion)}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Credits cost indicator */}
      <div className="text-xs text-muted-foreground flex items-center justify-between pt-2 border-t border-border/50">
        <span>Analysis Cost: <strong>1 AI Credit</strong></span>
        <span>
          {isTrial ? (
            <span className="text-primary font-semibold">Trial (Unlimited access)</span>
          ) : (
            <>Available: <strong className={remaining > 0 ? "text-primary" : "text-rose-500"}>{remaining} credits</strong></>
          )}
        </span>
      </div>
    </form>
  )
}
