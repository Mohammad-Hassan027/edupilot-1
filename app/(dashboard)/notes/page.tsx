"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  Upload, 
  Type, 
  Presentation, 
  Sparkles, 
  Download,
  Copy,
  BookOpen,
  List,
  Lightbulb,
  RefreshCw,
  FileUp,
  CheckCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

const uploadOptions = [
  {
    id: "pdf",
    icon: FileText,
    title: "Upload PDF",
    description: "Extract and summarize PDF documents",
    accept: ".pdf",
  },
  {
    id: "text",
    icon: Type,
    title: "Paste Text",
    description: "Paste your notes or text content",
    accept: null,
  },
  {
    id: "slides",
    icon: Presentation,
    title: "Upload Slides",
    description: "Process PowerPoint or Google Slides",
    accept: ".pptx,.ppt",
  },
]

interface GeneratedNote {
  type: "summary" | "concepts" | "bullets" | "revision"
  title: string
  content: string
  icon: string
}


export default function NotesPage() {
  const [selectedUpload, setSelectedUpload] = useState<string>("text")
  const [inputText, setInputText] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedNotes, setGeneratedNotes] = useState<GeneratedNote[] | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const [generateError, setGenerateError] = useState("")

  const handleGenerate = async () => {
    if (selectedUpload === "text" && !inputText.trim()) return
    setIsGenerating(true)
    setGenerateError("")
    try {
      const prompt = selectedUpload === "text"
        ? `You are an expert study notes creator. Convert the following content into comprehensive study notes.

Content:
${inputText}

Create 4 types of notes:
1. SUMMARY: A concise 3-4 sentence summary of the key points
2. KEY CONCEPTS: List the 5-7 most important concepts with brief explanations
3. BULLET POINTS: Create organized bullet point notes covering all major topics
4. REVISION QUESTIONS: Generate 5 questions for self-testing

Format each section clearly with its label.`
        : `Generate comprehensive study notes about the uploaded ${selectedUpload} content. Include summary, key concepts, bullet points, and revision questions.`

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.requiresLogin) { setGenerateError("Please log in to use the Notes Generator."); return }
        if (data.requiresUpgrade) { setGenerateError("No credits left. Activate your trial to continue."); return }
        setGenerateError(data.error || "Failed to generate notes")
        return
      }

      const rawText: string = data.reply || ""
      const parsed: GeneratedNote[] = [
        {
          type: "summary",
          title: "Summary",
          content: extractSection(rawText, ["SUMMARY", "Summary"]) || rawText.slice(0, 500),
          icon: "summary",
        },
        {
          type: "concepts",
          title: "Key Concepts",
          content: extractSection(rawText, ["KEY CONCEPTS", "Key Concepts"]) || "",
          icon: "concepts",
        },
        {
          type: "bullets",
          title: "Bullet Points",
          content: extractSection(rawText, ["BULLET POINTS", "Bullet Points"]) || "",
          icon: "bullets",
        },
        {
          type: "revision",
          title: "Revision Questions",
          content: extractSection(rawText, ["REVISION QUESTIONS", "Revision Questions"]) || "",
          icon: "revision",
        },
      ].filter(n => n.content.trim().length > 0)

      setGeneratedNotes(parsed.length > 0 ? parsed : [{ type: "summary", title: "Notes", content: rawText, icon: "summary" }])
    } catch {
      setGenerateError("Network error. Please check your connection.")
    } finally {
      setIsGenerating(false)
    }
  }

  function extractSection(text: string, headings: string[]): string {
    for (const heading of headings) {
      const idx = text.indexOf(heading)
      if (idx === -1) continue
      const start = idx + heading.length
      // Find next heading or end
      const nextMatch = text.slice(start).search(/
[A-Z][A-Z ]+:/)
      const end = nextMatch === -1 ? undefined : start + nextMatch
      return text.slice(start, end).replace(/^[:.\s]+/, "").trim()
    }
    return ""
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Notes Generator</h1>
        <p className="text-muted-foreground">Upload content and let AI create comprehensive study notes</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <div className="space-y-4">
          {/* Upload Options */}
          <div className="grid grid-cols-3 gap-3">
            {uploadOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedUpload(option.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all",
                  selectedUpload === option.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    selectedUpload === option.id ? "bg-primary/20" : "bg-secondary"
                  )}
                >
                  <option.icon
                    className={cn(
                      "h-5 w-5",
                      selectedUpload === option.id ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                </div>
                <span className="text-sm font-medium text-foreground">{option.title}</span>
              </button>
            ))}
          </div>

          {/* Input Area */}
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              {selectedUpload === "text" ? (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Paste your notes, lecture content, or any text you want to convert into study notes..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="min-h-[300px] resize-none bg-secondary border-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    {inputText.length} characters
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors">
                  {uploadedFile ? (
                    <div className="text-center space-y-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto">
                        <CheckCircle className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{uploadedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(uploadedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setUploadedFile(null)}>
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer text-center space-y-3 p-6">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary mx-auto">
                        <FileUp className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          Drop your file here or click to browse
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Supports {selectedUpload === "pdf" ? "PDF files" : "PPTX files"}
                        </p>
                      </div>
                      <input
                        type="file"
                        accept={uploadOptions.find((o) => o.id === selectedUpload)?.accept || ""}
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Button
            className="w-full gap-2"
            size="lg"
            onClick={handleGenerate}
            disabled={isGenerating || (selectedUpload === "text" ? !inputText.trim() : !uploadedFile)}
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
          {generateError && (
            <div className="mt-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              {generateError}
            </div>
          )}
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          {generatedNotes ? (
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-secondary">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="concepts">Concepts</TabsTrigger>
                <TabsTrigger value="bullets">Bullets</TabsTrigger>
                <TabsTrigger value="revision">Revision</TabsTrigger>
              </TabsList>
              {generatedNotes.map((note) => (
                <TabsContent key={note.type} value={note.type} className="mt-4">
                  <Card className="border-border bg-card">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div className="flex items-center gap-2">
                        <note.icon className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{note.title}</CardTitle>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-sm text-foreground bg-transparent p-0 m-0">
                          {note.content}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <Card className="border-border bg-card h-full min-h-[400px] flex items-center justify-center">
              <div className="text-center space-y-4 p-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary mx-auto">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">No notes generated yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Upload a file or paste text, then click generate to create AI-powered study notes
                  </p>
                </div>
              </div>
            </Card>
          )}

          {generatedNotes && (
            <Button variant="outline" className="w-full gap-2">
              <Download className="h-4 w-4" />
              Download All Notes
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
