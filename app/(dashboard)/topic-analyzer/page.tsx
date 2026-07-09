"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  Sparkles,
  History,
  Trash2,
  Copy,
  Download,
  RotateCcw,
  BookOpen,
  Brain,
  Gauge,
  Clock,
  RefreshCw,
  HelpCircle,
  TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser } from "@/hooks/use-user"
import { TopicAnalyzerForm } from "@/components/topic-analyzer/topic-analyzer-form"
import { DifficultyBadge } from "@/components/topic-analyzer/difficulty-badge"
import { ConfidenceMeter } from "@/components/topic-analyzer/confidence-meter"
import { PrerequisitesList } from "@/components/topic-analyzer/prerequisites-list"
import { StudyTimeline } from "@/components/topic-analyzer/study-timeline"
import { RevisionCard } from "@/components/topic-analyzer/revision-card"
import { TipsCard } from "@/components/topic-analyzer/tips-card"
import { AnalysisSummary } from "@/components/topic-analyzer/analysis-summary"

interface TopicAnalysisData {
  id?: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  estimatedHours: string
  confidence: number
  summary: string
  studyOrder: string[]
  prerequisites: string[]
  relatedConcepts: string[]
  revisionSessions: number
  tips: string[]
}

interface HistoryItem {
  id: string
  topic: string
  analysis_json: TopicAnalysisData
  created_at: string
}

export default function TopicAnalyzerPage() {
  const { refetch, subscription } = useUser()

  const [activeTopic, setActiveTopic] = useState("")
  const [activeAnalysis, setActiveAnalysis] = useState<TopicAnalysisData | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)

  useEffect(() => {
    void loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      setHistoryLoading(true)
      const res = await fetch("/api/topic-analysis", { cache: "no-store" })
      const data = await res.json()
      if (res.ok && data.success) {
        setHistory(data.history || [])
      }
    } catch (err) {
      console.error("Failed to load history:", err)
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleAnalyze = async (topic: string) => {
    setIsLoading(true)
    setActiveAnalysis(null)
    setActiveTopic(topic)

    try {
      const res = await fetch("/api/topic-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 402 || data.code === "NO_CREDITS") {
          toast.error("You've run out of credits. Please upgrade your plan.", {
            action: {
              label: "Upgrade",
              onClick: () => (window.location.href = "/billing"),
            },
          })
        } else if (res.status === 429) {
          toast.error("Rate limit reached. Please wait a minute and try again.")
        } else {
          toast.error(data.error || "An error occurred during topic analysis.")
        }
        setIsLoading(false)
        return
      }

      const analysis: TopicAnalysisData = {
        id: data.id,
        difficulty: data.difficulty,
        estimatedHours: data.estimatedHours,
        confidence: data.confidence,
        summary: data.summary,
        studyOrder: data.studyOrder,
        prerequisites: data.prerequisites,
        relatedConcepts: data.relatedConcepts,
        revisionSessions: data.revisionSessions,
        tips: data.tips,
      }

      setActiveAnalysis(analysis)
      toast.success(`Analysis for "${topic}" completed!`)

      // Refetch credits to keep UI updated
      void refetch(true, true)

      // Add to local history list
      const newHistoryItem: HistoryItem = {
        id: data.id,
        topic,
        analysis_json: analysis,
        created_at: new Date().toISOString(),
      }
      setHistory((prev) => [newHistoryItem, ...prev])
    } catch (err) {
      console.error(err)
      toast.error("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const previousHistory = [...history]

    // Optimistic Update
    setHistory((prev) => prev.filter((item) => item.id !== id))
    if (activeAnalysis?.id === id) {
      setActiveAnalysis(null)
      setActiveTopic("")
    }

    try {
      const res = await fetch(`/api/topic-analysis?id=${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        throw new Error("Failed to delete history item")
      }
      toast.success("Analysis deleted.")
    } catch (err) {
      console.error(err)
      setHistory(previousHistory)
      toast.error("Failed to delete. Please try again.")
    }
  }

  const handleSelectHistory = (item: HistoryItem) => {
    setActiveTopic(item.topic)
    setActiveAnalysis(item.analysis_json)
  }

  const handleCopyMarkdown = () => {
    if (!activeAnalysis) return

    const markdown = `# Topic Analysis: ${activeTopic}

## Overview
- **Difficulty**: ${activeAnalysis.difficulty}
- **Estimated Study Time**: ${activeAnalysis.estimatedHours} hours
- **Confidence Score**: ${activeAnalysis.confidence}%
- **Summary**: ${activeAnalysis.summary}

## Learning Roadmap
${activeAnalysis.studyOrder.map((step, idx) => `${idx + 1}. ${step}`).join("\n")}

## Prerequisites
${activeAnalysis.prerequisites.map((req) => `- ${req}`).join("\n")}

## Related Concepts
${activeAnalysis.relatedConcepts.map((concept) => `- ${concept}`).join("\n")}

## Recommended Revision Sessions
- **Sessions**: ${activeAnalysis.revisionSessions}
- Spaced repetition schedule recommended.

## Preparation & Study Tips
${activeAnalysis.tips.map((tip) => `- ${tip}`).join("\n")}
`

    navigator.clipboard.writeText(markdown)
    toast.success("Analysis copied as Markdown!")
  }

  const handleDownloadJson = () => {
    if (!activeAnalysis) return

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify({ topic: activeTopic, ...activeAnalysis }, null, 2)
    )}`
    const downloadAnchor = document.createElement("a")
    downloadAnchor.setAttribute("href", jsonString)
    
    const slug = activeTopic.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")
    downloadAnchor.setAttribute("download", `topic-analysis-${slug}.json`)
    
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    toast.success("JSON downloaded successfully.")
  }

  const handleReset = () => {
    setActiveTopic("")
    setActiveAnalysis(null)
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-2 tracking-tight">
            <Sparkles className="h-7 w-7 text-primary" />
            AI Topic Difficulty Analyzer
          </h1>
          <p className="text-muted-foreground mt-1">
            Map out learning roadmaps, prerequisites, revision sessions, and difficulty scores for any topic.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Left Side: Analysis History */}
        <Card className="border-border bg-card h-[fit-content] max-h-[80vh] flex flex-col">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="flex items-center gap-2 text-md">
              <History className="h-4.5 w-4.5 text-primary" />
              Recent Analyses
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-y-auto p-3 space-y-2 flex-1 scrollbar-thin">
            {historyLoading ? (
              <div className="text-xs text-muted-foreground text-center py-6">Loading history...</div>
            ) : history.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/80 px-4 py-8 text-center">
                <Brain className="h-6 w-6 text-primary mx-auto mb-2 opacity-65" />
                <p className="text-xs font-semibold text-foreground">No history yet</p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-normal">
                  Your analyzed topics will appear here.
                </p>
              </div>
            ) : (
              history.map((item) => {
                const isActive = activeAnalysis?.id === item.id

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectHistory(item)}
                    className={cn(
                      "group w-full rounded-xl border text-left p-3 cursor-pointer transition-all flex items-center justify-between gap-2",
                      isActive
                        ? "border-primary bg-primary/10 shadow-xs"
                        : "border-border bg-background/40 hover:border-primary/30 hover:bg-primary/5"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground truncate">{item.topic}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {item.analysis_json.difficulty} · {item.analysis_json.estimatedHours} hrs
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteHistory(item.id, e)}
                      className="opacity-0 group-hover:opacity-100 rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-rose-500 transition-all cursor-pointer"
                      title="Delete history item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Right Side: Workspace */}
        <div className="space-y-6">
          {/* Input Form Card */}
          <Card className="border-border bg-card/65 backdrop-blur-md">
            <CardContent className="p-5 md:p-6">
              <TopicAnalyzerForm onSubmit={handleAnalyze} isLoading={isLoading} />
            </CardContent>
          </Card>

          {/* Loading Skeleton Workspace */}
          {isLoading && (
            <div className="space-y-6 animate-pulse select-none pointer-events-none">
              {/* Header card skeleton */}
              <Card className="border-border bg-card/50">
                <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-3 flex-1">
                    <div className="h-8 bg-muted rounded-md w-1/3" />
                    <div className="h-5 bg-muted rounded-md w-1/4" />
                  </div>
                  <div className="h-16 w-16 bg-muted rounded-full shrink-0" />
                </CardContent>
              </Card>

              {/* Main layouts skeletons */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-6">
                  <div className="h-44 bg-muted rounded-xl" />
                  <div className="h-52 bg-muted rounded-xl" />
                  <div className="h-40 bg-muted rounded-xl" />
                </div>
                <div className="space-y-6">
                  <div className="h-96 bg-muted rounded-xl" />
                  <div className="h-44 bg-muted rounded-xl" />
                </div>
              </div>
            </div>
          )}

          {/* Results Workspace */}
          {activeAnalysis && !isLoading && (
            <div className="space-y-6">
              {/* Top Overview Bar */}
              <Card className="border-border bg-gradient-to-r from-card to-secondary/30 relative overflow-hidden">
                <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 z-10">
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-2xl font-extrabold text-foreground tracking-tight">{activeTopic}</h2>
                      <DifficultyBadge difficulty={activeAnalysis.difficulty} />
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-primary" />
                        Study Time: <strong className="text-foreground">{activeAnalysis.estimatedHours} hours</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <RefreshCw className="h-4 w-4 text-primary" />
                        Revision: <strong className="text-foreground">{activeAnalysis.revisionSessions} sessions</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Gauge className="h-4 w-4 text-primary" />
                        Confidence: <strong className="text-foreground">{activeAnalysis.confidence}%</strong>
                      </span>
                    </div>
                  </div>
                  {/* Gauge */}
                  <div className="flex flex-col items-center shrink-0">
                    <ConfidenceMeter score={activeAnalysis.confidence} />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Confidence</span>
                  </div>
                </CardContent>
              </Card>

              {/* Main Content Grid */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-6">
                  {/* Summary */}
                  <AnalysisSummary summary={activeAnalysis.summary} />

                  {/* Prerequisites & Related Concepts */}
                  <PrerequisitesList
                    prerequisites={activeAnalysis.prerequisites}
                    relatedConcepts={activeAnalysis.relatedConcepts}
                  />

                  {/* Tips */}
                  <TipsCard tips={activeAnalysis.tips} />
                </div>

                <div className="space-y-6">
                  {/* Timeline Roadmap */}
                  <StudyTimeline studyOrder={activeAnalysis.studyOrder} />

                  {/* Revision Schedule */}
                  <RevisionCard sessions={activeAnalysis.revisionSessions} />
                </div>
              </div>

              {/* Workspace Actions Panel */}
              <div className="flex flex-wrap gap-3 justify-end pt-4 border-t border-border/50">
                <Button variant="outline" className="gap-2" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4" />
                  Analyze Another
                </Button>
                <Button variant="outline" className="gap-2 border-primary/40 text-primary hover:bg-primary/5" onClick={handleCopyMarkdown}>
                  <Copy className="h-4 w-4" />
                  Copy Result (MD)
                </Button>
                <Button variant="outline" className="gap-2 border-primary/40 text-primary hover:bg-primary/5" onClick={handleDownloadJson}>
                  <Download className="h-4 w-4" />
                  Download JSON
                </Button>
              </div>
            </div>
          )}

          {/* Empty State Workspace */}
          {!activeAnalysis && !isLoading && (
            <Card className="border-border border-dashed bg-card/25 p-12 text-center">
              <CardContent className="space-y-4 max-w-md mx-auto">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Brain className="h-7 w-7 text-primary" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-foreground">Awaiting Topic Input</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Type in any technical concepts, programming languages, or academic subjects.
                    EduPilot AI will map out the complete study profile, confidence score, and roadmap.
                  </p>
                </div>
                {/* Suggestions block for quick-starts */}
                <div className="flex flex-col gap-1.5 items-center pt-2">
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    Try searching:
                  </span>
                  <div className="flex flex-wrap justify-center gap-2">
                    {["Deep Learning", "SQL Database Sharding", "TCP/IP Layer Model"].map((term) => (
                      <button
                        key={term}
                        onClick={() => handleAnalyze(term)}
                        className="text-xs px-2.5 py-1.5 rounded-lg border border-border bg-card/60 text-muted-foreground hover:text-primary hover:border-primary/30 transition-all font-semibold cursor-pointer"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
