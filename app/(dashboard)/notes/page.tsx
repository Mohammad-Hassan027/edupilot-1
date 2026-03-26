"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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
  Plus,
  Eye,
} from "lucide-react"
import { cn } from "@/lib/utils"

type SourceMode = "pdf" | "video" | "spreadsheet"
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

type UploadedFileMeta = {
  name: string
  url: string
  type: string
  size: number
}

const MAX_FILE_BYTES = 5 * 1024 * 1024

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
      "EduPilot will automatically generate Summary, Concept Breakdown, Bullet Points, and Revision Notes.",
      "Please upload files under 5 MB for best speed and reliability.",
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
      "EduPilot will automatically generate all note sections for the video.",
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
      "EduPilot will automatically create Summary, Concept Breakdown, Bullet Points, and Revision Notes.",
      "Please upload files under 5 MB.",
    ],
  },
]

function formatFileSize(size: number) {
  return size > 1024 * 1024 ? `${(size / (1024 * 1024)).toFixed(2)} MB` : `${(size / 1024).toFixed(1)} KB`
}

function normalizeNoteContent(content: string, tabTitle: string) {
  const cleaned = content
    .replace(/\r\n/g, "\n")
    .replace(/^\s*#{1,6}\s*(summary|concept breakdown|bullet points|revision notes)\s*$/gim, "")
    .replace(/^\s*\*\*(summary|concept breakdown|bullet points|revision notes)\*\*\s*$/gim, "")
    .replace(/^\s*#{1,6}\s*key point\s*$/gim, "### Key Point")
    .replace(/^\s*\*\*key point\*\*\s*$/gim, "### Key Point")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  if (!cleaned) {
    return `${tabTitle}\n\nNo content available.`
  }

  return cleaned
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function renderPrintableHtml(content: string) {
  const lines = normalizeNoteContent(content, "Notes").split("\n")
  const html: string[] = []
  let inList = false
  let inOrderedList = false

  const closeLists = () => {
    if (inList) {
      html.push("</ul>")
      inList = false
    }
    if (inOrderedList) {
      html.push("</ol>")
      inOrderedList = false
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (!line) {
      closeLists()
      continue
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      closeLists()
      html.push('<hr class="divider" />')
      continue
    }

    if (line.startsWith("### ")) {
      closeLists()
      html.push(`<h3>${escapeHtml(line.replace(/^###\s+/, ""))}</h3>`)
      continue
    }

    if (line.startsWith("## ")) {
      closeLists()
      html.push(`<h2>${escapeHtml(line.replace(/^##\s+/, ""))}</h2>`)
      continue
    }

    if (line.startsWith("# ")) {
      closeLists()
      html.push(`<h1>${escapeHtml(line.replace(/^#\s+/, ""))}</h1>`)
      continue
    }

    if (/^[-*]\s+/.test(line)) {
      if (!inList) {
        closeLists()
        html.push('<ul class="bullet-list">')
        inList = true
      }
      html.push(`<li>${escapeHtml(line.replace(/^[-*]\s+/, ""))}</li>`)
      continue
    }

    if (/^\d+\.\s+/.test(line)) {
      if (!inOrderedList) {
        closeLists()
        html.push('<ol class="ordered-list">')
        inOrderedList = true
      }
      html.push(`<li>${escapeHtml(line.replace(/^\d+\.\s+/, ""))}</li>`)
      continue
    }

    closeLists()
    html.push(`<p>${escapeHtml(line)}</p>`)
  }

  closeLists()
  return html.join("\n")
}

export default function NotesPage() {
  const [sourceMode, setSourceMode] = useState<SourceMode>("pdf")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedFileMeta, setUploadedFileMeta] = useState<UploadedFileMeta | null>(null)
  const [videoUrl, setVideoUrl] = useState("")
  const [activeTab, setActiveTab] = useState<NoteTab["type"]>("summary")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [generateError, setGenerateError] = useState("")
  const [generatedNotes, setGeneratedNotes] = useState<NoteTab[] | null>(null)
  const [generatedTitle, setGeneratedTitle] = useState("Generated Notes")
  const [sourceHint, setSourceHint] = useState("")
  const [history, setHistory] = useState<SavedNote[]>([])
  const [currentSavedId, setCurrentSavedId] = useState<string | null>(null)
  const [copiedTab, setCopiedTab] = useState<NoteTab["type"] | null>(null)
  const copiedTimerRef = useRef<number | null>(null)

  const selectedOption = useMemo(
    () => sourceOptions.find((option) => option.id === sourceMode) || sourceOptions[0],
    [sourceMode]
  )

  useEffect(() => {
    void loadHistory()
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const savedId = new URLSearchParams(window.location.search).get("saved")
    if (!savedId) return

    const match = history.find((item) => item.id === savedId)
    if (match) {
      openSavedNote(match)
      return
    }

    void loadSavedNote(savedId)
  }, [history])

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) {
        window.clearTimeout(copiedTimerRef.current)
      }
    }
  }, [])

  async function loadHistory() {
    try {
      const response = await fetch("/api/ai/notes", { cache: "no-store" })
      const data = await response.json().catch(() => ({ notes: [] }))

      if (response.ok) {
        setHistory(data.notes || [])
      }
    } catch {
      //
    }
  }

  function openSavedNote(note: SavedNote) {
    const normalizedTabs = note.tabs.map((tab) => ({
      ...tab,
      content: normalizeNoteContent(tab.content, tab.title),
    }))

    setCurrentSavedId(note.id)
    setGeneratedTitle(note.source_title)
    setGeneratedNotes(normalizedTabs)
    setSourceHint(note.source_hint || note.source_label || "")
    setSourceMode(note.source_type)
    setActiveTab(normalizedTabs[0]?.type || "summary")

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      url.searchParams.set("saved", note.id)
      window.history.replaceState({}, "", url.toString())
    }
  }

  async function loadSavedNote(noteId: string) {
    try {
      const response = await fetch(`/api/ai/notes/${noteId}`, { cache: "no-store" })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.note) return

      const note = data.note as SavedNote
      setHistory((prev) => (prev.some((item) => item.id === note.id) ? prev : [note, ...prev]))
      openSavedNote(note)
    } catch {
      //
    }
  }

  function resetGeneratedView() {
    setCurrentSavedId(null)
    setGeneratedNotes(null)
    setGeneratedTitle("Generated Notes")
    setSourceHint("")
    setActiveTab("summary")

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      url.searchParams.delete("saved")
      window.history.replaceState({}, "", url.toString())
    }
  }

  function resetSourceInputs(nextSource: SourceMode) {
    setSourceMode(nextSource)
    setUploadedFile(null)
    setUploadedFileMeta(null)
    setVideoUrl("")
    setGenerateError("")
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_BYTES) {
      setUploadedFile(null)
      setUploadedFileMeta(null)
      setGenerateError("Please upload a file under 5 MB.")
      e.target.value = ""
      return
    }

    setUploadedFile(file)
    setUploadedFileMeta(null)
    setGenerateError("")
  }

  async function uploadCurrentFile() {
    if (!uploadedFile) throw new Error("Please upload a file first.")

    if (
      uploadedFileMeta &&
      uploadedFileMeta.name === uploadedFile.name &&
      uploadedFileMeta.size === uploadedFile.size &&
      uploadedFileMeta.type === (uploadedFile.type || "application/octet-stream")
    ) {
      return uploadedFileMeta
    }

    setIsUploading(true)

    const formData = new FormData()
    formData.append("files", uploadedFile)

    const response = await fetch("/api/ai/upload", {
      method: "POST",
      body: formData,
    })

    const data = await response.json().catch(() => ({}))
    setIsUploading(false)

    if (!response.ok) {
      throw new Error(data.error || "Failed to upload file")
    }

    const uploaded = data.files?.[0] as UploadedFileMeta | undefined
    if (!uploaded) {
      throw new Error("Upload succeeded but no file data was returned.")
    }

    setUploadedFileMeta(uploaded)
    return uploaded
  }

  async function handleGenerate() {
    if ((sourceMode === "pdf" || sourceMode === "spreadsheet") && !uploadedFile) return
    if (sourceMode === "video" && !videoUrl.trim()) return

    setIsGenerating(true)
    setGenerateError("")

    try {
      const files = sourceMode === "video" ? [] : uploadedFile ? [await uploadCurrentFile()] : []

      const response = await fetch("/api/ai/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceMode,
          videoUrl,
          files,
        }),
      })

      const data = await response.json().catch(async () => ({
        error: response.ok ? "Failed to generate notes" : await response.text(),
      }))

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate notes")
      }

      const tabs = Array.isArray(data.tabs)
        ? data.tabs.map((tab: NoteTab) => ({
            ...tab,
            content: normalizeNoteContent(tab.content, tab.title),
          }))
        : []

      setCurrentSavedId(data.savedNote?.id || null)
      setGeneratedTitle(data.title || "Generated Notes")
      setGeneratedNotes(tabs)
      setSourceHint(data.sourceHint || "")
      setActiveTab(tabs[0]?.type || "summary")

      if (data.savedNote) {
        setHistory((prev) => [data.savedNote as SavedNote, ...prev.filter((item) => item.id !== data.savedNote.id)].slice(0, 12))
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href)
          url.searchParams.set("saved", data.savedNote.id)
          window.history.replaceState({}, "", url.toString())
        }
      } else {
        await loadHistory()
      }
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : "Failed to generate notes")
    } finally {
      setIsGenerating(false)
    }
  }

  async function copyTabContent(tab: NoteTab) {
    await navigator.clipboard.writeText(tab.content)
    setCopiedTab(tab.type)

    if (copiedTimerRef.current) {
      window.clearTimeout(copiedTimerRef.current)
    }

    copiedTimerRef.current = window.setTimeout(() => {
      setCopiedTab(null)
    }, 1800)
  }

  function downloadNotes(customNote?: { title: string; sourceHint?: string | null; tabs: NoteTab[] }) {
    const noteTitle = customNote?.title || generatedTitle
    const noteSourceHint = customNote?.sourceHint || sourceHint
    const noteTabs = customNote?.tabs || generatedNotes

    if (!noteTabs) return

    const printWindow = window.open("", "_blank", "width=1200,height=900")
    if (!printWindow) return

    const tabsHtml = noteTabs
      .map(
        (tab, index) => `
          <section class="section-card ${index > 0 ? "page-break" : ""}">
            <div class="section-head">
              <div>
                <p class="section-label">EduPilot Notes</p>
                <h2>${escapeHtml(tab.title)}</h2>
              </div>
            </div>
            <div class="section-body">
              ${renderPrintableHtml(tab.content)}
            </div>
          </section>
        `
      )
      .join("")

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>${escapeHtml(noteTitle)}</title>
          <style>
            :root { color-scheme: dark; }
            * { box-sizing: border-box; }
            @page {
              size: A4;
              margin: 18mm;
            }
            body {
              margin: 0;
              font-family: Inter, Arial, sans-serif;
              background:
                radial-gradient(circle at top, rgba(245, 158, 11, 0.08), transparent 28%),
                linear-gradient(180deg, #041224 0%, #07162a 100%);
              color: #f8fafc;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .sheet {
              max-width: 980px;
              margin: 0 auto;
              min-height: 100vh;
              padding: 28px;
            }
            .hero {
              border: 1px solid rgba(255,255,255,0.08);
              border-radius: 28px;
              background: rgba(8, 18, 35, 0.88);
              box-shadow: 0 18px 60px rgba(0,0,0,0.35);
              overflow: hidden;
              margin-bottom: 22px;
            }
            .hero-inner {
              padding: 34px;
              background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(245,158,11,0.03));
            }
            .eyebrow {
              display: inline-block;
              padding: 8px 12px;
              border-radius: 999px;
              background: rgba(245, 158, 11, 0.14);
              color: #fbbf24;
              font-size: 12px;
              font-weight: 700;
              letter-spacing: 0.08em;
              text-transform: uppercase;
            }
            .hero h1 {
              margin: 18px 0 10px;
              font-size: 34px;
              line-height: 1.2;
              color: #ffffff;
            }
            .hint {
              margin: 0;
              color: #a5b4cc;
              font-size: 15px;
              line-height: 1.8;
            }
            .section-card {
              border: 1px solid rgba(255,255,255,0.08);
              border-radius: 24px;
              background: rgba(8, 18, 35, 0.88);
              box-shadow: 0 18px 60px rgba(0,0,0,0.22);
              overflow: hidden;
              margin-bottom: 22px;
            }
            .page-break {
              page-break-before: always;
              break-before: page;
            }
            .section-head {
              padding: 24px 28px;
              border-bottom: 1px solid rgba(255,255,255,0.08);
              background: rgba(255,255,255,0.02);
            }
            .section-label {
              margin: 0 0 8px;
              color: #fbbf24;
              font-size: 12px;
              font-weight: 700;
              letter-spacing: 0.18em;
              text-transform: uppercase;
            }
            .section-head h2 {
              margin: 0;
              font-size: 26px;
              color: #ffffff;
            }
            .section-body {
              padding: 28px;
            }
            .section-body h1,
            .section-body h2,
            .section-body h3 {
              color: #ffffff;
              margin: 24px 0 12px;
            }
            .section-body h1 { font-size: 28px; }
            .section-body h2 {
              font-size: 20px;
              padding-top: 8px;
              border-top: 1px solid rgba(255,255,255,0.08);
            }
            .section-body h3 {
              font-size: 17px;
              color: #fbbf24;
            }
            .section-body p,
            .section-body li {
              color: #dbe7f6;
              font-size: 15px;
              line-height: 1.9;
            }
            .divider {
              border: none;
              border-top: 1px solid rgba(255,255,255,0.08);
              margin: 18px 0;
            }
            .bullet-list,
            .ordered-list {
              margin: 0;
              padding-left: 22px;
            }
            .bullet-list li,
            .ordered-list li {
              margin-bottom: 8px;
            }
          </style>
        </head>
        <body>
          <div class="sheet">
            <section class="hero">
              <div class="hero-inner">
                <div class="eyebrow">EduPilot Notes Export</div>
                <h1>${escapeHtml(noteTitle)}</h1>
                <p class="hint">${escapeHtml(noteSourceHint || "Smart notes generated from your selected study material.")}</p>
              </div>
            </section>
            ${tabsHtml}
          </div>
          <script>
            window.onload = () => window.print();
          </script>
        </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
  }

  const canGenerate =
    !isGenerating &&
    ((sourceMode === "video" && !!videoUrl.trim()) ||
      (sourceMode !== "video" && !!uploadedFile && uploadedFile.size <= MAX_FILE_BYTES))

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Notes Generator</h1>
        <p className="text-muted-foreground">
          Create smart notes from PDFs, public video links, and spreadsheets.
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid gap-3 md:grid-cols-3">
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
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  sourceMode === option.id ? "bg-primary/20" : "bg-secondary"
                )}
              >
                <option.icon
                  className={cn(
                    "h-5 w-5",
                    sourceMode === option.id ? "text-primary" : "text-muted-foreground"
                  )}
                />
              </div>
              <span className="text-sm font-medium text-foreground">{option.title}</span>
              <span className="text-xs text-muted-foreground">{option.description}</span>
            </button>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  How to use {selectedOption.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedOption.hints.map((hint, index) => (
                  <div
                    key={index}
                    className="flex gap-3 rounded-xl bg-secondary/60 px-3 py-3 text-sm text-foreground"
                  >
                    <Badge
                      variant="secondary"
                      className="mt-0.5 h-5 min-w-5 justify-center rounded-full px-1.5"
                    >
                      {index + 1}
                    </Badge>
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
                          <p className="text-sm text-muted-foreground">{formatFileSize(uploadedFile.size)}</p>
                          {uploadedFileMeta ? (
                            <p className="mt-1 text-xs text-emerald-400">
                              Uploaded once. Reused for faster note generation.
                            </p>
                          ) : null}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setUploadedFile(null)
                            setUploadedFileMeta(null)
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer space-y-3">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                          <FileUp className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            Drop your file here or click to browse
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Supports {selectedOption.accept?.replaceAll(",", ", ")}
                          </p>
                          <p className="text-xs text-muted-foreground">Maximum file size: 5 MB</p>
                        </div>
                        <input
                          type="file"
                          accept={selectedOption.accept}
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button className="w-full gap-2" size="lg" onClick={handleGenerate} disabled={!canGenerate}>
                {isGenerating || isUploading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    {isUploading ? "Uploading file..." : "Generating Notes..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Study Notes
                  </>
                )}
              </Button>

              {generateError ? (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {generateError}
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <History className="h-5 w-5 text-primary" />
                  Saved Notes History
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Open your recent generated notes from here.
                </p>
              </CardHeader>
              <CardContent>
                {history.length ? (
                  <div className="space-y-3">
                    {history.slice(0, 8).map((item) => {
                      const isActive = currentSavedId === item.id

                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "rounded-xl border bg-background/40 px-4 py-3 transition-colors",
                            isActive
                              ? "border-primary/60 bg-primary/10"
                              : "border-border/80 hover:border-primary/40 hover:bg-primary/5"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate font-medium text-foreground">{item.source_title}</p>
                                <Badge variant="secondary" className="capitalize">
                                  {item.source_type}
                                </Badge>
                              </div>
                              <p className="mt-1 truncate text-xs text-muted-foreground">
                                {item.source_hint || item.source_label || "Saved note"}
                              </p>
                              <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
                                {new Date(item.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center gap-2">
                            <Button
                              variant={isActive ? "default" : "outline"}
                              size="sm"
                              className="gap-2 rounded-lg"
                              onClick={() => openSavedNote(item)}
                            >
                              <Eye className="h-4 w-4" />
                              Open
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 rounded-lg"
                              onClick={() =>
                                downloadNotes({
                                  title: item.source_title,
                                  sourceHint: item.source_hint || item.source_label || "",
                                  tabs: item.tabs.map((tab) => ({
                                    ...tab,
                                    content: normalizeNoteContent(tab.content, tab.title),
                                  })),
                                })
                              }
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-border/70 bg-background/30 px-4 py-5 text-sm text-muted-foreground">
                    No saved history yet.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="rounded-xl border border-border/70 bg-background/40 p-4">
                  <p className="text-sm font-medium text-foreground">Current setup</p>
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between gap-3">
                      <span>Source</span>
                      <Badge variant="secondary">{selectedOption.title}</Badge>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Status</span>
                      <Badge
                        variant={sourceMode === "video" ? "outline" : uploadedFile ? "secondary" : "outline"}
                      >
                        {sourceMode === "video"
                          ? videoUrl.trim()
                            ? "Link added"
                            : "Waiting"
                          : uploadedFile
                          ? uploadedFileMeta
                            ? "Ready"
                            : "File added"
                          : "Waiting"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {generatedNotes ? (
          <Card className="border-border bg-card">
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold">{generatedTitle}</CardTitle>
                  {sourceHint ? (
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">{sourceHint}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="gap-2" onClick={resetGeneratedView}>
                    <Plus className="h-4 w-4" />
                    Add New
                  </Button>
                  <Button variant="outline" size="icon" className="h-11 w-11 shrink-0" onClick={() => downloadNotes()}>
                    <Download className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as NoteTab["type"])} className="w-full">
                <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-2xl bg-secondary p-2 md:grid-cols-4">
                  {generatedNotes.map((tab) => (
                    <TabsTrigger
                      key={tab.type}
                      value={tab.type}
                      className="rounded-xl px-4 py-3 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground"
                    >
                      {tab.title}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {generatedNotes.map((tab) => (
                  <TabsContent key={tab.type} value={tab.type} className="mt-5">
                    <div className="overflow-hidden rounded-[28px] border border-border/80 bg-background/40 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
                      <div className="border-b border-white/10 bg-white/[0.02] px-5 py-5 md:px-7">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/90">
                              EduPilot Notes
                            </p>
                            <h3 className="mt-2 text-xl font-semibold text-foreground">{tab.title}</h3>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 rounded-xl px-4"
                            onClick={() => copyTabContent(tab)}
                          >
                            <Copy className="h-4 w-4" />
                            {copiedTab === tab.type ? "Text copied" : "Copy"}
                          </Button>
                        </div>
                      </div>

                      <div className="px-5 py-6 md:px-7 md:py-7">
                        <MarkdownRenderer content={tab.content} className="text-sm" />
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <Card className="min-h-[320px] border-border bg-card">
            <CardContent className="flex h-full min-h-[320px] items-center justify-center p-6">
              <div className="max-w-sm text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">No notes generated yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Select a source, review the tips, and generate your notes.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}