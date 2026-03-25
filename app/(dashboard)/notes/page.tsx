"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import {
  FileText,
  Video,
  Table2,
  Sparkles,
  Download,
  Copy,
  RefreshCw,
  FileUp,
  CheckCircle,
  Lightbulb,
  Link2,
  BookOpen,
  History,
} from "lucide-react"
import { cn } from "@/lib/utils"

type SourceMode = "pdf" | "video" | "spreadsheet"
type PromptType = "summary" | "explanation" | "concepts" | "bullets" | "revision"
type NoteTab = { type: "summary" | "concepts" | "bullets" | "revision"; title: string; content: string }
type SavedNote = {
  id: string
  source_type: SourceMode
  source_title: string
  source_label: string | null
  source_hint: string | null
  tabs: NoteTab[]
  created_at: string
}

const sourceOptions: Array<{
  id: SourceMode
  icon: typeof FileText
  title: string
  description: string
  accept?: string
  hints: string[]
}> = [
  {
    id: "pdf",
    icon: FileText,
    title: "PDF",
    description: "Upload a PDF and turn it into study notes.",
    accept: ".pdf",
    hints: [
      "Use chapter PDFs, lecture notes, handouts, or scanned text-based PDFs.",
      "After upload, choose what you want: summary, explanation, concepts, bullet notes, or revision notes.",
      "Best results come from clean PDFs under 18 MB.",
    ],
  },
  {
    id: "video",
    icon: Video,
    title: "Video Link",
    description: "Paste a YouTube or public video link.",
    hints: [
      "Paste a YouTube link or another public video URL.",
      "If a transcript is available, EduPilot will use it. Otherwise it will use public information about the video.",
      "Good for lectures, tutorials, and concept explainers.",
    ],
  },
  {
    id: "spreadsheet",
    icon: Table2,
    title: "Spreadsheet",
    description: "Upload CSV, XLS, or XLSX files and study the data.",
    accept: ".csv,.xls,.xlsx",
    hints: [
      "Upload CSV or Excel sheets with tabular study data.",
      "Great for marksheets, experiment logs, finance tables, and research summaries.",
      "After upload, select a prompt like concepts or bullet notes to shape the output.",
    ],
  },
]

const promptOptions: Array<{ id: PromptType; label: string; helper: string }> = [
  { id: "summary", label: "Summary", helper: "Short overview of the material." },
  { id: "explanation", label: "Topic Explanation", helper: "Tutor-style explanation in simple words." },
  { id: "concepts", label: "Concept Breakdown", helper: "Important concepts with explanations." },
  { id: "bullets", label: "Bullet Points", helper: "Exam-friendly bullet notes." },
  { id: "revision", label: "Revision Notes", helper: "Quick review notes and questions." },
]

export default function NotesPage() {
  const searchParams = useSearchParams()
  const [sourceMode, setSourceMode] = useState<SourceMode>("pdf")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState("")
  const [selectedPrompt, setSelectedPrompt] = useState<PromptType>("summary")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState("")
  const [generatedNotes, setGeneratedNotes] = useState<NoteTab[] | null>(null)
  const [generatedTitle, setGeneratedTitle] = useState("Generated Notes")
  const [sourceHint, setSourceHint] = useState("")
  const [history, setHistory] = useState<SavedNote[]>([])

  const selectedOption = useMemo(
    () => sourceOptions.find((option) => option.id === sourceMode) || sourceOptions[0],
    [sourceMode]
  )

  useEffect(() => {
    void loadHistory()
  }, [])

  useEffect(() => {
    const savedId = searchParams.get("saved")
    if (!savedId || !history.length) return
    const match = history.find((item) => item.id === savedId)
    if (!match) return
    setGeneratedTitle(match.source_title)
    setGeneratedNotes(match.tabs)
    setSourceHint(match.source_hint || match.source_label || "")
    setSourceMode(match.source_type)
  }, [history, searchParams])

  async function loadHistory() {
    try {
      const response = await fetch("/api/ai/notes", { cache: "no-store" })
      const data = await response.json()
      if (response.ok) setHistory(data.notes || [])
    } catch {
      // ignore history errors in UI
    }
  }

  function resetSourceInputs(nextSource: SourceMode) {
    setSourceMode(nextSource)
    setUploadedFile(null)
    setVideoUrl("")
    setGenerateError("")
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      setGenerateError("")
    }
  }

  async function uploadCurrentFile() {
    if (!uploadedFile) throw new Error("Please upload a file first.")
    const formData = new FormData()
    formData.append("files", uploadedFile)

    const response = await fetch("/api/ai/upload", {
      method: "POST",
      body: formData,
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.error || "Failed to upload file")
    return data.files?.[0]
  }

  async function handleGenerate() {
    if ((sourceMode === "pdf" || sourceMode === "spreadsheet") && !uploadedFile) return
    if (sourceMode === "video" && !videoUrl.trim()) return

    setIsGenerating(true)
    setGenerateError("")

    try {
      const files =
        sourceMode === "video"
          ? []
          : uploadedFile
            ? [await uploadCurrentFile()]
            : []

      const response = await fetch("/api/ai/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceMode,
          promptType: selectedPrompt,
          videoUrl,
          files,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to generate notes")

      setGeneratedTitle(data.title || "Generated Notes")
      setGeneratedNotes(data.tabs || [])
      setSourceHint(data.sourceHint || "")
      await loadHistory()
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : "Failed to generate notes")
    } finally {
      setIsGenerating(false)
    }
  }

  function copyTabContent(content: string) {
    void navigator.clipboard.writeText(content)
  }

  function downloadNotes() {
    if (!generatedNotes) return
    const text = [`# ${generatedTitle}`, sourceHint ? `> ${sourceHint}` : "", "", ...generatedNotes.map((tab) => `## ${tab.title}\n\n${tab.content}`)].join("\n")
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${generatedTitle.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "notes"}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Notes Generator</h1>
        <p className="text-muted-foreground">Create smart notes from PDFs, public video links, and spreadsheets.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {sourceOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => resetSourceInputs(option.id)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all",
                  sourceMode === option.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", sourceMode === option.id ? "bg-primary/20" : "bg-secondary")}>
                  <option.icon className={cn("h-5 w-5", sourceMode === option.id ? "text-primary" : "text-muted-foreground")} />
                </div>
                <span className="text-sm font-medium text-foreground">{option.title}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </button>
            ))}
          </div>

          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="h-5 w-5 text-primary" />
                How to use {selectedOption.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedOption.hints.map((hint, index) => (
                <div key={index} className="flex gap-3 rounded-xl bg-secondary/60 px-3 py-3 text-sm text-foreground">
                  <Badge variant="secondary" className="mt-0.5 h-5 min-w-5 justify-center rounded-full px-1.5">{index + 1}</Badge>
                  <span>{hint}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4">
              {sourceMode === "video" ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-secondary/40 p-4">
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                      <Link2 className="h-4 w-4 text-primary" />
                      Paste your video link
                    </label>
                    <Input
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="bg-background"
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      Best support: YouTube links with captions. Other public video links use whatever public context is available.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary/50">
                  {uploadedFile ? (
                    <div className="space-y-3">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <CheckCircle className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{uploadedFile.name}</p>
                        <p className="text-sm text-muted-foreground">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setUploadedFile(null)}>
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer space-y-3">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                        <FileUp className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Drop your file here or click to browse</p>
                        <p className="text-sm text-muted-foreground">Supports {selectedOption.accept?.replaceAll(",", ", ")}</p>
                      </div>
                      <input type="file" accept={selectedOption.accept} onChange={handleFileUpload} className="hidden" />
                    </label>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Choose what you want from it</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {promptOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedPrompt(option.id)}
                    className={cn(
                      "rounded-xl border px-4 py-3 text-left transition-all",
                      selectedPrompt === option.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-secondary/30 hover:border-primary/40"
                    )}
                  >
                    <p className="font-medium text-foreground">{option.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{option.helper}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full gap-2"
            size="lg"
            onClick={handleGenerate}
            disabled={isGenerating || ((sourceMode === "video" && !videoUrl.trim()) || (sourceMode !== "video" && !uploadedFile))}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating Notes...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Study Notes
              </>
            )}
          </Button>
          {generateError ? <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">{generateError}</div> : null}
        </div>

        <div className="space-y-4">
          {generatedNotes ? (
            <>
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-xl">{generatedTitle}</CardTitle>
                      {sourceHint ? <p className="mt-1 text-sm text-muted-foreground">{sourceHint}</p> : null}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" className="h-9 w-9" onClick={downloadNotes}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue={generatedNotes[0]?.type || "summary"} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 bg-secondary">
                      {generatedNotes.map((tab) => (
                        <TabsTrigger key={tab.type} value={tab.type}>{tab.title}</TabsTrigger>
                      ))}
                    </TabsList>
                    {generatedNotes.map((tab) => (
                      <TabsContent key={tab.type} value={tab.type} className="mt-4">
                        <div className="rounded-2xl border border-border/80 bg-background/40 p-4">
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <h3 className="font-semibold text-foreground">{tab.title}</h3>
                            <Button variant="outline" size="sm" className="gap-2" onClick={() => copyTabContent(tab.content)}>
                              <Copy className="h-4 w-4" />
                              Copy
                            </Button>
                          </div>
                          <MarkdownRenderer content={tab.content} className="text-sm" />
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>

              {history.length ? (
                <Card className="border-border bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <History className="h-5 w-5 text-primary" />
                      Saved Notes History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {history.slice(0, 6).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setGeneratedTitle(item.source_title)
                          setGeneratedNotes(item.tabs)
                          setSourceHint(item.source_hint || item.source_label || "")
                          setSourceMode(item.source_type)
                        }}
                        className="w-full rounded-xl border border-border/80 bg-background/40 px-3 py-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate font-medium text-foreground">{item.source_title}</p>
                          <Badge variant="secondary" className="capitalize">{item.source_type}</Badge>
                        </div>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{item.source_hint || item.source_label || "Saved note"}</p>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              ) : null}
            </>
          ) : (
            <Card className="border-border bg-card min-h-[420px]">
              <CardContent className="flex h-full min-h-[420px] items-center justify-center p-6">
                <div className="max-w-sm text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">No notes generated yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Choose PDF, Video Link, or Spreadsheet, then pick the type of notes you want to generate.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
