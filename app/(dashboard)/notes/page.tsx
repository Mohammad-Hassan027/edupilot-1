// "use client"

// import { useEffect, useMemo, useState } from "react"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Badge } from "@/components/ui/badge"
// import { MarkdownRenderer } from "@/components/markdown-renderer"
// import {
//   FileText,
//   Video,
//   Table2,
//   Sparkles,
//   Download,
//   Copy,
//   RefreshCw,
//   FileUp,
//   CheckCircle,
//   Lightbulb,
//   Link2,
//   BookOpen,
//   History,
// } from "lucide-react"
// import { cn } from "@/lib/utils"

// type SourceMode = "pdf" | "video" | "spreadsheet"
// type PromptType = "summary" | "explanation" | "concepts" | "bullets" | "revision"
// type NoteTab = { type: "summary" | "concepts" | "bullets" | "revision"; title: string; content: string }
// type SavedNote = {
//   id: string
//   source_type: SourceMode
//   source_title: string
//   source_label: string | null
//   source_hint: string | null
//   tabs: NoteTab[]
//   created_at: string
// }

// const sourceOptions: Array<{
//   id: SourceMode
//   icon: typeof FileText
//   title: string
//   description: string
//   accept?: string
//   hints: string[]
// }> = [
//   {
//     id: "pdf",
//     icon: FileText,
//     title: "PDF",
//     description: "Upload a PDF and turn it into study notes.",
//     accept: ".pdf",
//     hints: [
//       "Use chapter PDFs, lecture notes, handouts, or scanned text-based PDFs.",
//       "After upload, choose what you want: summary, explanation, concepts, bullet notes, or revision notes.",
//       "Best results come from clean PDFs under 18 MB.",
//     ],
//   },
//   {
//     id: "video",
//     icon: Video,
//     title: "Video Link",
//     description: "Paste a YouTube or public video link.",
//     hints: [
//       "Paste a YouTube link or another public video URL.",
//       "If a transcript is available, EduPilot will use it. Otherwise it will use public information about the video.",
//       "Good for lectures, tutorials, and concept explainers.",
//     ],
//   },
//   {
//     id: "spreadsheet",
//     icon: Table2,
//     title: "Spreadsheet",
//     description: "Upload CSV, XLS, or XLSX files and study the data.",
//     accept: ".csv,.xls,.xlsx",
//     hints: [
//       "Upload CSV or Excel sheets with tabular study data.",
//       "Great for marksheets, experiment logs, finance tables, and research summaries.",
//       "After upload, select a prompt like concepts or bullet notes to shape the output.",
//     ],
//   },
// ]

// const promptOptions: Array<{ id: PromptType; label: string; helper: string }> = [
//   { id: "summary", label: "Summary", helper: "Short overview of the material." },
//   { id: "explanation", label: "Topic Explanation", helper: "Tutor-style explanation in simple words." },
//   { id: "concepts", label: "Concept Breakdown", helper: "Important concepts with explanations." },
//   { id: "bullets", label: "Bullet Points", helper: "Exam-friendly bullet notes." },
//   { id: "revision", label: "Revision Notes", helper: "Quick review notes and questions." },
// ]

// export default function NotesPage() {
//   const [sourceMode, setSourceMode] = useState<SourceMode>("pdf")
//   const [uploadedFile, setUploadedFile] = useState<File | null>(null)
//   const [videoUrl, setVideoUrl] = useState("")
//   const [selectedPrompt, setSelectedPrompt] = useState<PromptType>("summary")
//   const [isGenerating, setIsGenerating] = useState(false)
//   const [generateError, setGenerateError] = useState("")
//   const [generatedNotes, setGeneratedNotes] = useState<NoteTab[] | null>(null)
//   const [generatedTitle, setGeneratedTitle] = useState("Generated Notes")
//   const [sourceHint, setSourceHint] = useState("")
//   const [history, setHistory] = useState<SavedNote[]>([])

//   const selectedOption = useMemo(
//     () => sourceOptions.find((option) => option.id === sourceMode) || sourceOptions[0],
//     [sourceMode]
//   )

//   useEffect(() => {
//     void loadHistory()
//   }, [])

//   useEffect(() => {
//     if (typeof window === "undefined") return
//     const savedId = new URLSearchParams(window.location.search).get("saved")
//     if (!savedId || !history.length) return
//     const match = history.find((item) => item.id === savedId)
//     if (!match) return
//     setGeneratedTitle(match.source_title)
//     setGeneratedNotes(match.tabs)
//     setSourceHint(match.source_hint || match.source_label || "")
//     setSourceMode(match.source_type)
//   }, [history])

//   async function loadHistory() {
//     try {
//       const response = await fetch("/api/ai/notes", { cache: "no-store" })
//       const data = await response.json()
//       if (response.ok) setHistory(data.notes || [])
//     } catch {
//       // ignore history errors in UI
//     }
//   }

//   function resetSourceInputs(nextSource: SourceMode) {
//     setSourceMode(nextSource)
//     setUploadedFile(null)
//     setVideoUrl("")
//     setGenerateError("")
//   }

//   function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
//     const file = e.target.files?.[0]
//     if (file) {
//       setUploadedFile(file)
//       setGenerateError("")
//     }
//   }

//   async function uploadCurrentFile() {
//     if (!uploadedFile) throw new Error("Please upload a file first.")
//     const formData = new FormData()
//     formData.append("files", uploadedFile)

//     const response = await fetch("/api/ai/upload", {
//       method: "POST",
//       body: formData,
//     })

//     const data = await response.json()
//     if (!response.ok) throw new Error(data.error || "Failed to upload file")
//     return data.files?.[0]
//   }

//   async function handleGenerate() {
//     if ((sourceMode === "pdf" || sourceMode === "spreadsheet") && !uploadedFile) return
//     if (sourceMode === "video" && !videoUrl.trim()) return

//     setIsGenerating(true)
//     setGenerateError("")

//     try {
//       const files = sourceMode === "video" ? [] : uploadedFile ? [await uploadCurrentFile()] : []

//       const response = await fetch("/api/ai/notes", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           sourceMode,
//           promptType: selectedPrompt,
//           videoUrl,
//           files,
//         }),
//       })

//       const data = await response.json()
//       if (!response.ok) throw new Error(data.error || "Failed to generate notes")

//       setGeneratedTitle(data.title || "Generated Notes")
//       setGeneratedNotes(data.tabs || [])
//       setSourceHint(data.sourceHint || "")
//       await loadHistory()
//     } catch (error) {
//       setGenerateError(error instanceof Error ? error.message : "Failed to generate notes")
//     } finally {
//       setIsGenerating(false)
//     }
//   }

//   function copyTabContent(content: string) {
//     void navigator.clipboard.writeText(content)
//   }

//   function downloadNotes() {
//     if (!generatedNotes) return
//     const text = [`# ${generatedTitle}`, sourceHint ? `> ${sourceHint}` : "", "", ...generatedNotes.map((tab) => `## ${tab.title}\n\n${tab.content}`)].join("\n")
//     const blob = new Blob([text], { type: "text/markdown;charset=utf-8" })
//     const url = URL.createObjectURL(blob)
//     const a = document.createElement("a")
//     a.href = url
//     a.download = `${generatedTitle.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "notes"}.md`
//     a.click()
//     URL.revokeObjectURL(url)
//   }

//   const canGenerate = !isGenerating && ((sourceMode === "video" && !!videoUrl.trim()) || (sourceMode !== "video" && !!uploadedFile))

//   return (
//     <div className="space-y-6 p-4 md:p-6">
//       <div>
//         <h1 className="text-2xl font-bold text-foreground">AI Notes Generator</h1>
//         <p className="text-muted-foreground">Create smart notes from PDFs, public video links, and spreadsheets.</p>
//       </div>

//       <div className="space-y-6">
//         <div className="grid gap-3 md:grid-cols-3">
//           {sourceOptions.map((option) => (
//             <button
//               key={option.id}
//               onClick={() => resetSourceInputs(option.id)}
//               className={cn(
//                 "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all",
//                 sourceMode === option.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"
//               )}
//             >
//               <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", sourceMode === option.id ? "bg-primary/20" : "bg-secondary")}>
//                 <option.icon className={cn("h-5 w-5", sourceMode === option.id ? "text-primary" : "text-muted-foreground")} />
//               </div>
//               <span className="text-sm font-medium text-foreground">{option.title}</span>
//               <span className="text-xs text-muted-foreground">{option.description}</span>
//             </button>
//           ))}
//         </div>

//         <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
//           <div className="space-y-4">
//             <Card className="border-border bg-card">
//               <CardHeader className="pb-3">
//                 <CardTitle className="flex items-center gap-2 text-lg">
//                   <Lightbulb className="h-5 w-5 text-primary" />
//                   How to use {selectedOption.title}
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-3">
//                 {selectedOption.hints.map((hint, index) => (
//                   <div key={index} className="flex gap-3 rounded-xl bg-secondary/60 px-3 py-3 text-sm text-foreground">
//                     <Badge variant="secondary" className="mt-0.5 h-5 min-w-5 justify-center rounded-full px-1.5">
//                       {index + 1}
//                     </Badge>
//                     <span>{hint}</span>
//                   </div>
//                 ))}
//               </CardContent>
//             </Card>

//             <Card className="border-border bg-card">
//               <CardContent className="p-4">
//                 {sourceMode === "video" ? (
//                   <div className="space-y-4">
//                     <div className="rounded-xl border border-border bg-secondary/40 p-4">
//                       <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
//                         <Link2 className="h-4 w-4 text-primary" />
//                         Paste your video link
//                       </label>
//                       <Input
//                         value={videoUrl}
//                         onChange={(e) => setVideoUrl(e.target.value)}
//                         placeholder="https://www.youtube.com/watch?v=..."
//                         className="bg-background"
//                       />
//                       <p className="mt-2 text-xs text-muted-foreground">
//                         Best support: YouTube links with captions. Other public video links use whatever public context is available.
//                       </p>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary/50">
//                     {uploadedFile ? (
//                       <div className="space-y-3">
//                         <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
//                           <CheckCircle className="h-8 w-8 text-primary" />
//                         </div>
//                         <div>
//                           <p className="font-medium text-foreground">{uploadedFile.name}</p>
//                           <p className="text-sm text-muted-foreground">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
//                         </div>
//                         <Button variant="outline" size="sm" onClick={() => setUploadedFile(null)}>
//                           Remove
//                         </Button>
//                       </div>
//                     ) : (
//                       <label className="cursor-pointer space-y-3">
//                         <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
//                           <FileUp className="h-8 w-8 text-muted-foreground" />
//                         </div>
//                         <div>
//                           <p className="font-medium text-foreground">Drop your file here or click to browse</p>
//                           <p className="text-sm text-muted-foreground">Supports {selectedOption.accept?.replaceAll(",", ", ")}</p>
//                         </div>
//                         <input type="file" accept={selectedOption.accept} onChange={handleFileUpload} className="hidden" />
//                       </label>
//                     )}
//                   </div>
//                 )}
//               </CardContent>
//             </Card>

//             <div className="space-y-3">
//               <Button className="w-full gap-2" size="lg" onClick={handleGenerate} disabled={!canGenerate}>
//                 {isGenerating ? (
//                   <>
//                     <RefreshCw className="h-4 w-4 animate-spin" />
//                     Generating Notes...
//                   </>
//                 ) : (
//                   <>
//                     <Sparkles className="h-4 w-4" />
//                     Generate Study Notes
//                   </>
//                 )}
//               </Button>
//               {generateError ? <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">{generateError}</div> : null}
//             </div>
//           </div>

//           <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
//             <Card className="border-border bg-card">
//               <CardHeader className="pb-3">
//                 <CardTitle className="text-lg">Choose what you want from it</CardTitle>
//                 <p className="text-sm text-muted-foreground">Pick the note format before generating.</p>
//               </CardHeader>
//               <CardContent>
//                 <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
//                   {promptOptions.map((option) => (
//                     <button
//                       key={option.id}
//                       onClick={() => setSelectedPrompt(option.id)}
//                       className={cn(
//                         "rounded-xl border px-4 py-3 text-left transition-all",
//                         selectedPrompt === option.id ? "border-primary bg-primary/10" : "border-border bg-secondary/30 hover:border-primary/40"
//                       )}
//                     >
//                       <p className="font-medium text-foreground">{option.label}</p>
//                       <p className="mt-1 text-xs text-muted-foreground">{option.helper}</p>
//                     </button>
//                   ))}
//                 </div>
//               </CardContent>
//             </Card>

//             <Card className="border-border bg-card">
//               <CardContent className="p-4">
//                 <div className="rounded-xl border border-border/70 bg-background/40 p-4">
//                   <p className="text-sm font-medium text-foreground">Current setup</p>
//                   <div className="mt-3 space-y-2 text-sm text-muted-foreground">
//                     <div className="flex items-center justify-between gap-3">
//                       <span>Source</span>
//                       <Badge variant="secondary">{selectedOption.title}</Badge>
//                     </div>
//                     <div className="flex items-center justify-between gap-3">
//                       <span>Output</span>
//                       <Badge variant="secondary">{promptOptions.find((item) => item.id === selectedPrompt)?.label}</Badge>
//                     </div>
//                     <div className="flex items-center justify-between gap-3">
//                       <span>Status</span>
//                       <Badge variant={sourceMode === "video" ? "outline" : uploadedFile ? "secondary" : "outline"}>
//                         {sourceMode === "video" ? (videoUrl.trim() ? "Link added" : "Waiting") : uploadedFile ? "File added" : "Waiting"}
//                       </Badge>
//                     </div>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         </div>

//         {generatedNotes ? (
//           <Card className="border-border bg-card">
//             <CardHeader className="pb-2">
//               <div className="flex items-start justify-between gap-3">
//                 <div>
//                   <CardTitle className="text-xl">{generatedTitle}</CardTitle>
//                   {sourceHint ? <p className="mt-1 text-sm text-muted-foreground">{sourceHint}</p> : null}
//                 </div>
//                 <div className="flex gap-2">
//                   <Button variant="outline" size="icon" className="h-9 w-9" onClick={downloadNotes}>
//                     <Download className="h-4 w-4" />
//                   </Button>
//                 </div>
//               </div>
//             </CardHeader>
//             <CardContent>
//               <Tabs defaultValue={generatedNotes[0]?.type || "summary"} className="w-full">
//                 <TabsList className="grid w-full grid-cols-4 bg-secondary">
//                   {generatedNotes.map((tab) => (
//                     <TabsTrigger key={tab.type} value={tab.type}>
//                       {tab.title}
//                     </TabsTrigger>
//                   ))}
//                 </TabsList>
//                 {generatedNotes.map((tab) => (
//                   <TabsContent key={tab.type} value={tab.type} className="mt-4">
//                     <div className="rounded-2xl border border-border/80 bg-background/40 p-4">
//                       <div className="mb-3 flex items-center justify-between gap-2">
//                         <h3 className="font-semibold text-foreground">{tab.title}</h3>
//                         <Button variant="outline" size="sm" className="gap-2" onClick={() => copyTabContent(tab.content)}>
//                           <Copy className="h-4 w-4" />
//                           Copy
//                         </Button>
//                       </div>
//                       <MarkdownRenderer content={tab.content} className="text-sm" />
//                     </div>
//                   </TabsContent>
//                 ))}
//               </Tabs>
//             </CardContent>
//           </Card>
//         ) : (
//           <Card className="min-h-[320px] border-border bg-card">
//             <CardContent className="flex h-full min-h-[320px] items-center justify-center p-6">
//               <div className="max-w-sm text-center">
//                 <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
//                   <BookOpen className="h-8 w-8 text-muted-foreground" />
//                 </div>
//                 <h3 className="text-lg font-semibold text-foreground">No notes generated yet</h3>
//                 <p className="mt-2 text-sm text-muted-foreground">
//                   Select a source, review the tips, choose the output style on the side, and generate your notes.
//                 </p>
//               </div>
//             </CardContent>
//           </Card>
//         )}

//         {history.length ? (
//           <Card className="border-border bg-card">
//             <CardHeader className="pb-3">
//               <CardTitle className="flex items-center gap-2 text-lg">
//                 <History className="h-5 w-5 text-primary" />
//                 Saved Notes History
//               </CardTitle>
//               <p className="text-sm text-muted-foreground">Your recently generated notes appear here for quick access.</p>
//             </CardHeader>
//             <CardContent>
//               <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
//                 {history.slice(0, 6).map((item) => (
//                   <button
//                     key={item.id}
//                     onClick={() => {
//                       setGeneratedTitle(item.source_title)
//                       setGeneratedNotes(item.tabs)
//                       setSourceHint(item.source_hint || item.source_label || "")
//                       setSourceMode(item.source_type)
//                     }}
//                     className="w-full rounded-xl border border-border/80 bg-background/40 px-3 py-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
//                   >
//                     <div className="flex items-center justify-between gap-2">
//                       <p className="truncate font-medium text-foreground">{item.source_title}</p>
//                       <Badge variant="secondary" className="capitalize">
//                         {item.source_type}
//                       </Badge>
//                     </div>
//                     <p className="mt-1 truncate text-xs text-muted-foreground">{item.source_hint || item.source_label || "Saved note"}</p>
//                   </button>
//                 ))}
//               </div>
//             </CardContent>
//           </Card>
//         ) : null}
//       </div>
//     </div>
//   )
// }
"use client"

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react"
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
type NoteTabType = "summary" | "concepts" | "bullets" | "revision"

type NoteTab = {
  type: NoteTabType
  title: string
  content: string
}

type SavedNote = {
  id: string
  source_type: SourceMode
  source_title: string
  source_label: string | null
  source_hint: string | null
  tabs: NoteTab[]
  created_at: string
}

const MAX_FILE_BYTES = 18 * 1024 * 1024

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
      "Choose the output style before generating the notes.",
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
      "If a transcript is available, EduPilot will use it for better note quality.",
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
      "Upload CSV or Excel files with structured tabular data.",
      "Useful for marksheets, records, experiments, and research tables.",
      "Pick summary, concepts, bullets, or revision format before generating.",
    ],
  },
]

const promptOptions: Array<{ id: PromptType; label: string; helper: string }> = [
  { id: "summary", label: "Summary", helper: "Short overview of the material." },
  { id: "explanation", label: "Topic Explanation", helper: "Simple tutor-style explanation." },
  { id: "concepts", label: "Concept Breakdown", helper: "Important concepts with clarity." },
  { id: "bullets", label: "Bullet Points", helper: "Exam-ready bullet notes." },
  { id: "revision", label: "Revision Notes", helper: "Quick revision and key recall points." },
]

export default function NotesPage() {
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
  const [activeTab, setActiveTab] = useState<NoteTabType>("summary")
  const [copiedTab, setCopiedTab] = useState<NoteTabType | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const pdfExportRef = useRef<HTMLDivElement | null>(null)

  const selectedOption = useMemo(
    () => sourceOptions.find((option) => option.id === sourceMode) || sourceOptions[0],
    [sourceMode]
  )

  useEffect(() => {
    void loadHistory()
  }, [])

  useEffect(() => {
    if (!generatedNotes?.length) return
    setActiveTab(generatedNotes[0].type)
  }, [generatedNotes])

  useEffect(() => {
    if (typeof window === "undefined") return

    const savedId = new URLSearchParams(window.location.search).get("saved")
    if (!savedId || !history.length) return

    const match = history.find((item) => item.id === savedId)
    if (!match) return

    setGeneratedTitle(match.source_title)
    setGeneratedNotes(match.tabs)
    setSourceHint(match.source_hint || match.source_label || "")
    setSourceMode(match.source_type)
    if (match.tabs?.length) {
      setActiveTab(match.tabs[0].type)
    }
  }, [history])

  async function loadHistory() {
    try {
      const response = await fetch("/api/ai/notes", { cache: "no-store" })
      const data = await response.json().catch(() => ({ notes: [] }))

      if (response.ok) {
        setHistory(data.notes || [])
      }
    } catch {
      // ignore history error in UI
    }
  }

  function resetSourceInputs(nextSource: SourceMode) {
    setSourceMode(nextSource)
    setUploadedFile(null)
    setVideoUrl("")
    setGenerateError("")
  }

  function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_BYTES) {
      setUploadedFile(null)
      setGenerateError("Please upload a file under 18 MB.")
      e.target.value = ""
      return
    }

    setUploadedFile(file)
    setGenerateError("")
  }

  async function uploadCurrentFile() {
    if (!uploadedFile) {
      throw new Error("Please upload a file first.")
    }

    const formData = new FormData()
    formData.append("files", uploadedFile)

    const response = await fetch("/api/ai/upload", {
      method: "POST",
      body: formData,
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(data.error || "Failed to upload file.")
    }

    return data.files?.[0]
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
          promptType: selectedPrompt,
          videoUrl,
          files,
        }),
      })

      const data = await response.json().catch(async () => ({
        error: response.ok ? "Failed to generate notes." : await response.text(),
      }))

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate notes.")
      }

      const tabs = Array.isArray(data.tabs) ? data.tabs : []

      setGeneratedTitle(data.title || "Generated Notes")
      setGeneratedNotes(tabs)
      setSourceHint(data.sourceHint || "")
      if (tabs.length) {
        setActiveTab(tabs[0].type)
      }

      await loadHistory()
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : "Failed to generate notes.")
    } finally {
      setIsGenerating(false)
    }
  }

  async function copyTabContent(tabType: NoteTabType, content: string) {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedTab(tabType)

      window.setTimeout(() => {
        setCopiedTab((prev) => (prev === tabType ? null : prev))
      }, 1800)
    } catch {
      setGenerateError("Unable to copy the text right now.")
    }
  }

  async function downloadNotesAsPdf() {
    if (!generatedNotes?.length || !pdfExportRef.current) return

    try {
      setIsDownloading(true)

      const html2pdfModule = await import("html2pdf.js")
      const html2pdf = html2pdfModule.default

      const filename =
        `${generatedTitle.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "notes"}.pdf`

      await html2pdf()
        .set({
          margin: [12, 12, 12, 12],
          filename,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: "#020817",
          },
          jsPDF: {
            unit: "mm",
            format: "a4",
            orientation: "portrait",
          },
          pagebreak: {
            mode: ["avoid-all", "css", "legacy"],
          },
        })
        .from(pdfExportRef.current)
        .save()
    } catch {
      setGenerateError("Failed to download PDF. Please check that html2pdf.js is installed correctly.")
    } finally {
      setIsDownloading(false)
    }
  }

  const canGenerate =
    !isGenerating &&
    ((sourceMode === "video" && !!videoUrl.trim()) ||
      (sourceMode !== "video" && !!uploadedFile && uploadedFile.size <= MAX_FILE_BYTES))

  const activeTabData = generatedNotes?.find((tab) => tab.type === activeTab) || generatedNotes?.[0]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">AI Notes Generator</h1>
        <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
          Generate clean, student-friendly notes from PDFs, public video links, and spreadsheets.
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid gap-3 md:grid-cols-3">
          {sourceOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => resetSourceInputs(option.id)}
              className={cn(
                "group rounded-2xl border p-4 text-left transition-all duration-200",
                sourceMode === option.id
                  ? "border-primary/70 bg-primary/10 shadow-[0_0_0_1px_rgba(234,179,8,0.18)]"
                  : "border-border bg-card/70 hover:border-primary/40 hover:bg-card"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
                    sourceMode === option.id
                      ? "border-primary/40 bg-primary/15"
                      : "border-white/10 bg-secondary"
                  )}
                >
                  <option.icon
                    className={cn(
                      "h-5 w-5",
                      sourceMode === option.id ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{option.title}</p>
                    {sourceMode === option.id ? (
                      <Badge className="border-primary/30 bg-primary/15 text-primary hover:bg-primary/15">
                        Selected
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            <Card className="overflow-hidden border-white/10 bg-card/70 backdrop-blur-xl">
              <CardHeader className="border-b border-white/10 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  How to use {selectedOption.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3 p-4">
                {selectedOption.hints.map((hint, index) => (
                  <div
                    key={index}
                    className="flex gap-3 rounded-2xl border border-white/10 bg-background/40 px-4 py-3"
                  >
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-7 text-foreground">{hint}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-white/10 bg-card/70 backdrop-blur-xl">
              <CardHeader className="border-b border-white/10 pb-4">
                <CardTitle className="text-lg">Add your source</CardTitle>
              </CardHeader>

              <CardContent className="p-4">
                {sourceMode === "video" ? (
                  <div className="rounded-2xl border border-white/10 bg-background/40 p-4">
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                      <Link2 className="h-4 w-4 text-primary" />
                      Paste your video link
                    </label>

                    <Input
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="border-white/10 bg-background/70"
                    />

                    <p className="mt-3 text-xs leading-6 text-muted-foreground">
                      Best support: YouTube links with captions. Other public video links use available public context.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border-2 border-dashed border-white/10 bg-background/30 p-6 transition-colors hover:border-primary/40">
                    {uploadedFile ? (
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                          <CheckCircle className="h-8 w-8 text-primary" />
                        </div>

                        <p className="max-w-full truncate font-semibold text-foreground">
                          {uploadedFile.name}
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {uploadedFile.size > 1024 * 1024
                            ? `${(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB`
                            : `${(uploadedFile.size / 1024).toFixed(1)} KB`}
                        </p>

                        <div className="mt-4 flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setUploadedFile(null)}>
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <label className="block cursor-pointer text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                          <FileUp className="h-8 w-8 text-muted-foreground" />
                        </div>

                        <p className="font-semibold text-foreground">
                          Drop your file here or click to browse
                        </p>

                        <p className="mt-2 text-sm text-muted-foreground">
                          Supports {selectedOption.accept?.replaceAll(",", ", ")}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Maximum file size: 18 MB
                        </p>

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
              <Button
                className="h-12 w-full gap-2 text-sm font-semibold"
                size="lg"
                onClick={handleGenerate}
                disabled={!canGenerate}
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

              {generateError ? (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {generateError}
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <Card className="overflow-hidden border-white/10 bg-card/70 backdrop-blur-xl">
              <CardHeader className="border-b border-white/10 pb-4">
                <CardTitle className="text-lg">Choose what you want</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Select the note format before generating.
                </p>
              </CardHeader>

              <CardContent className="p-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  {promptOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedPrompt(option.id)}
                      className={cn(
                        "rounded-2xl border px-4 py-3 text-left transition-all",
                        selectedPrompt === option.id
                          ? "border-primary/50 bg-primary/10 shadow-[0_0_0_1px_rgba(234,179,8,0.12)]"
                          : "border-white/10 bg-background/30 hover:border-primary/30 hover:bg-background/50"
                      )}
                    >
                      <p className="font-semibold text-foreground">{option.label}</p>
                      <p className="mt-1 text-xs leading-6 text-muted-foreground">{option.helper}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-white/10 bg-card/70 backdrop-blur-xl">
              <CardContent className="p-4">
                <div className="rounded-2xl border border-white/10 bg-background/35 p-4">
                  <p className="text-sm font-semibold text-foreground">Current setup</p>

                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Source</span>
                      <Badge variant="secondary">{selectedOption.title}</Badge>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Output</span>
                      <Badge variant="secondary">
                        {promptOptions.find((item) => item.id === selectedPrompt)?.label}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Status</span>
                      <Badge
                        variant={sourceMode === "video" ? "outline" : uploadedFile ? "secondary" : "outline"}
                      >
                        {sourceMode === "video"
                          ? videoUrl.trim()
                            ? "Link added"
                            : "Waiting"
                          : uploadedFile
                          ? "File added"
                          : "Waiting"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {generatedNotes?.length ? (
          <Card className="overflow-hidden border-white/10 bg-card/70 backdrop-blur-xl">
            <CardHeader className="border-b border-white/10 pb-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-bold text-foreground">
                    {generatedTitle}
                  </CardTitle>

                  {sourceHint ? (
                    <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                      {sourceHint}
                    </p>
                  ) : null}
                </div>

                <Button
                  variant="outline"
                  className="gap-2 self-start border-white/10 bg-background/40"
                  onClick={downloadNotesAsPdf}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download PDF
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-4 md:p-6">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as NoteTabType)} className="w-full">
                <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-2xl bg-background/40 p-2 md:grid-cols-4">
                  {generatedNotes.map((tab) => (
                    <TabsTrigger
                      key={tab.type}
                      value={tab.type}
                      className="rounded-xl border border-transparent px-3 py-3 text-sm font-medium text-muted-foreground data-[state=active]:border-primary/40 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                    >
                      {tab.title}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {generatedNotes.map((tab) => (
                  <TabsContent key={tab.type} value={tab.type} className="mt-5">
                    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#031126]/70 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
                      <div className="border-b border-white/10 px-5 py-4 md:px-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h2 className="text-xl font-semibold text-foreground md:text-2xl">
                              {tab.title}
                            </h2>
                            <div className="mt-3 h-px w-full max-w-[220px] bg-gradient-to-r from-primary/70 via-white/15 to-transparent" />
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 border-white/10 bg-background/40"
                            onClick={() => copyTabContent(tab.type, tab.content)}
                          >
                            <Copy className="h-4 w-4" />
                            {copiedTab === tab.type ? "Text copied" : "Copy"}
                          </Button>
                        </div>
                      </div>

                      <div className="px-5 py-6 md:px-6 md:py-7">
                        <div className="prose prose-invert max-w-none">
                          <MarkdownRenderer content={tab.content} className="text-[15px] leading-7" />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <Card className="min-h-[320px] overflow-hidden border-white/10 bg-card/70 backdrop-blur-xl">
            <CardContent className="flex min-h-[320px] items-center justify-center p-6">
              <div className="max-w-md text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>

                <h3 className="text-lg font-semibold text-foreground">No notes generated yet</h3>

                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  Select a source, choose the output style, and generate clean notes for learning and revision.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {history.length ? (
          <Card className="overflow-hidden border-white/10 bg-card/70 backdrop-blur-xl">
            <CardHeader className="border-b border-white/10 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="h-5 w-5 text-primary" />
                Saved Notes History
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Open your recent notes again anytime.
              </p>
            </CardHeader>

            <CardContent className="p-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {history.slice(0, 6).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setGeneratedTitle(item.source_title)
                      setGeneratedNotes(item.tabs)
                      setSourceHint(item.source_hint || item.source_label || "")
                      setSourceMode(item.source_type)
                      if (item.tabs?.length) {
                        setActiveTab(item.tabs[0].type)
                      }
                    }}
                    className="rounded-2xl border border-white/10 bg-background/35 px-4 py-4 text-left transition-all hover:border-primary/30 hover:bg-primary/5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold text-foreground">{item.source_title}</p>
                      <Badge variant="secondary" className="capitalize">
                        {item.source_type}
                      </Badge>
                    </div>

                    <p className="mt-2 truncate text-xs text-muted-foreground">
                      {item.source_hint || item.source_label || "Saved note"}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {generatedNotes?.length ? (
        <div className="pointer-events-none fixed left-[-99999px] top-0 opacity-0">
          <div
            ref={pdfExportRef}
            style={{
              width: "794px",
              background:
                "linear-gradient(180deg, rgba(2,6,23,1) 0%, rgba(3,17,38,1) 100%)",
              color: "#f8fafc",
              padding: "32px",
              fontFamily:
                'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            }}
          >
            <div
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "28px",
                background: "rgba(15,23,42,0.55)",
                padding: "28px",
                boxShadow: "0 20px 50px rgba(0,0,0,0.28)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div style={{ marginBottom: "24px" }}>
                <h1
                  style={{
                    margin: 0,
                    fontSize: "30px",
                    lineHeight: 1.25,
                    fontWeight: 800,
                    color: "#ffffff",
                  }}
                >
                  {generatedTitle}
                </h1>

                {sourceHint ? (
                  <p
                    style={{
                      marginTop: "10px",
                      marginBottom: 0,
                      fontSize: "14px",
                      lineHeight: 1.8,
                      color: "rgba(226,232,240,0.85)",
                    }}
                  >
                    {sourceHint}
                  </p>
                ) : null}
              </div>

              {generatedNotes.map((tab, index) => (
                <div
                  key={tab.type}
                  style={{
                    marginTop: index === 0 ? 0 : "26px",
                    padding: "22px 22px 18px 22px",
                    borderRadius: "22px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(2,12,27,0.7)",
                    pageBreakInside: "avoid",
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "22px",
                      lineHeight: 1.35,
                      fontWeight: 700,
                      color: "#ffffff",
                    }}
                  >
                    {tab.title}
                  </h2>

                  <div
                    style={{
                      height: "1px",
                      width: "180px",
                      marginTop: "12px",
                      marginBottom: "18px",
                      background:
                        "linear-gradient(90deg, rgba(234,179,8,0.95) 0%, rgba(255,255,255,0.18) 60%, rgba(255,255,255,0) 100%)",
                    }}
                  />

                  <MarkdownRenderer content={tab.content} className="text-[15px] leading-7" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}