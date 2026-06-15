"use client"

import { Suspense, useState, useRef, useEffect, useCallback, type ChangeEvent } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Send,
  MessageSquareText,
  Sparkles,
  MessageSquare,
  Clock,
  ChevronRight,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Mic,
  RefreshCw,
  BookOpen,
  FileQuestion,
  Lightbulb,
  X,
  ExternalLink,
  PanelRightOpen,
  Plus,
  Paperclip,
  Globe,
  ImageIcon,
  Loader2,
  Trash2,
  Download,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { LoginGateModal } from "@/components/login-gate-modal"
import { CreditsExhaustedModal } from "@/components/credits-exhausted-modal"
import { MarkdownRenderer } from "@/components/markdown-renderer"

interface ResourceLink {
  title: string
  url: string
  source: string
}

interface MediaAttachment {
  type: "image"
  url: string
}

interface UploadedFile {
  name: string
  url?: string
  type: string
  size: number
  file?: File
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  sources?: ResourceLink[]
  media?: MediaAttachment
  attachments?: UploadedFile[]
  mode?: ToolMode
}

interface ChatSession {
  id: string
  title: string
  time: string
  messages: number
}

type FeedbackType = "like" | "dislike" | null
type ToolMode = "chat" | "web_search" | "image_generation"
type ToolHint = "file_upload" | "web_search" | null

const examplePrompts = [
  { icon: BookOpen, label: "Explain a concept", prompt: "Explain the concept of REST APIs in simple terms" },
  { icon: FileQuestion, label: "Quiz me", prompt: "Create a 5 question quiz about JavaScript basics" },
  { icon: Lightbulb, label: "Study tips", prompt: "Give me effective strategies for learning programming" },
  { icon: MessageSquareText, label: "Solve a problem", prompt: "Help me understand recursion step by step" },
]

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Hello! I'm your **EduPilot AI Tutor**. I can help you understand complex topics, create quizzes, explain concepts, search the web, and review uploaded files.\n\nWhat would you like to learn today?",
    timestamp: new Date(),
    sources: [],
    mode: "chat",
  },
]

const modeLabels: Record<ToolMode, string> = {
  chat: "Chat",
  web_search: "Web search",
  image_generation: "Image generation",
}

const chatSuggestions = [
  "Explain this topic in simple terms with examples",
  "Summarize this concept in short bullet points",
  "Create 5 quiz questions from this topic",
]

const webSearchSuggestions = [
  "Find the latest updates on AI in education and summarize them simply",
  "Search the web for the best free resources to learn React in 2026",
  "Compare Next.js and React based on recent web sources",
]

const fileUploadSuggestions = [
  "Upload PDF, TXT, MD, CSV, JSON, code files, images, or ZIP files.",
  "After uploading, ask: Summarize this file, explain this code, or create quiz questions from it.",
]

function cleanAIResponse(text: string) {
  return text
    // remove lines with ====
    .replace(/={3,}/g, "")
    // remove extra blank lines
    .replace(/\n\s*\n/g, "\n\n")
    .trim()
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getAudioExtension(mimeType: string) {
  if (mimeType.includes("webm")) return "webm"
  if (mimeType.includes("ogg")) return "ogg"
  if (mimeType.includes("mp4") || mimeType.includes("mpeg") || mimeType.includes("mpga")) return "mp3"
  if (mimeType.includes("wav")) return "wav"
  return "webm"
}

declare global {
  interface Window {
    SpeechRecognition?: {
      new (): SpeechRecognition
    }
    webkitSpeechRecognition?: {
      new (): SpeechRecognition
    }
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}

interface SpeechRecognitionEvent {
  resultIndex: number
  results: {
    [index: number]: {
      isFinal: boolean
      0: {
        transcript: string
      }
    }
    length: number
  }
}

interface SpeechRecognitionErrorEvent {
  error: string
}

function AITutorContent() {
  const searchParams = useSearchParams()
  const targetSessionId = searchParams.get("session")
  const initialQuery = searchParams.get("q")

  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showCreditsModal, setShowCreditsModal] = useState(false)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [isOpeningSession, setIsOpeningSession] = useState(false)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [activeMode, setActiveMode] = useState<ToolMode>("chat")
  const [activeHint, setActiveHint] = useState<ToolHint>(null)
  const [selectedFiles, setSelectedFiles] = useState<UploadedFile[]>([])
  const [isUploadingFiles, setIsUploadingFiles] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)

  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [messageFeedback, setMessageFeedback] = useState<Record<string, FeedbackType>>({})
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackMessageId, setFeedbackMessageId] = useState<string | null>(null)
  const [feedbackText, setFeedbackText] = useState("")

  const [showSourcesSidebar, setShowSourcesSidebar] = useState(false)
  const [activeSources, setActiveSources] = useState<ResourceLink[]>([])
  const [activeSourceTitle, setActiveSourceTitle] = useState("Sources")

  useEffect(() => {
    if (!initialQuery || targetSessionId) return
    setInput((current) => (current.trim().length > 0 ? current : initialQuery))
  }, [initialQuery, targetSessionId])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null)
  const speechTranscriptRef = useRef("")

  const loadChatHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/user/chat-history", { cache: "no-store" })
      const data = res.ok ? await res.json() : { sessions: [] }
      setChatSessions(data.sessions || [])
    } catch {
      setChatSessions([])
    } finally {
      setIsLoadingHistory(false)
    }
  }, [])

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/user/chat-history/${sessionId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        throw new Error("Failed to delete chat")
      }

      setChatSessions((prev) => prev.filter((chat) => chat.id !== sessionId))

      if (activeSessionId === sessionId) {
        setActiveSessionId(null)
        setMessages(initialMessages)
        setInput("")
        setSelectedFiles([])
        setActiveMode("chat")
        setActiveHint(null)
        setShowSourcesSidebar(false)
        setActiveSources([])
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleOpenSession = async (sessionId: string) => {
    try {
      setIsOpeningSession(true)
      setActiveSessionId(sessionId)

      const res = await fetch(`/api/user/chat-history/${sessionId}`, {
        cache: "no-store",
      })

      const data = res.ok ? await res.json() : { messages: [] }

      const loadedMessages: Message[] = (data.messages || []).map((m: Message & { timestamp: string }) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.timestamp),
        sources: m.sources || [],
      }))

      if (loadedMessages.length > 0) {
        setMessages(loadedMessages)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsOpeningSession(false)
    }
  }

  useEffect(() => {
    fetch("/api/user/chat-history", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setChatSessions(data.sessions || [])
      })
      .catch(() => {})
      .finally(() => setIsLoadingHistory(false))
  }, [])

  useEffect(() => {
    if (targetSessionId) {
      handleOpenSession(targetSessionId)
    }
  }, [targetSessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    return () => {
      speechRecognitionRef.current?.stop()
      speechRecognitionRef.current = null
      mediaRecorderRef.current = null
      audioChunksRef.current = []
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }
  }, [])

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const handleAddFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return

    setSelectedFiles((prev) => {
      const existingKeys = new Set(prev.map((file) => `${file.name}-${file.size}-${file.type}`))
      const nextFiles = [...prev]

      files.forEach((file) => {
        const key = `${file.name}-${file.size}-${file.type}`
        if (!existingKeys.has(key)) {
          nextFiles.push({
            name: file.name,
            type: file.type || "application/octet-stream",
            size: file.size,
            file,
          })
        }
      })

      return nextFiles
    })

    event.target.value = ""
  }

  const removeSelectedFile = (indexToRemove: number) => {
    setSelectedFiles((prev) => prev.filter((_, index) => index !== indexToRemove))
  }

  const uploadSelectedFiles = async () => {
    if (!selectedFiles.length) return [] as UploadedFile[]

    const pendingFiles = selectedFiles.filter((item) => item.file)
    if (!pendingFiles.length) return selectedFiles

    const formData = new FormData()
    pendingFiles.forEach((item) => {
      if (item.file) formData.append("files", item.file)
    })

    setIsUploadingFiles(true)

    try {
      const res = await fetch("/api/ai/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload files")
      }

      return (data.files || []) as UploadedFile[]
    } finally {
      setIsUploadingFiles(false)
    }
  }

  const handleToolSelect = (mode: ToolMode | "file_upload") => {
    if (mode === "file_upload") {
      setActiveHint("file_upload")
      openFilePicker()
      return
    }

    if (mode === "chat") {
      setActiveHint(null)
      setActiveMode("chat")
      return
    }

    if (mode === "web_search") {
      setActiveHint("web_search")
    } else {
      setActiveHint(null)
    }

    setActiveMode(mode)
  }

  const pushAssistantError = (message: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: message,
        timestamp: new Date(),
        sources: [],
      },
    ])
  }

  const releaseAudioResources = () => {
    mediaRecorderRef.current = null
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    mediaStreamRef.current = null
  }

  const stopVoiceRecording = () => {
    const recognition = speechRecognitionRef.current
    if (recognition) {
      recognition.stop()
      return
    }

    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== "inactive") {
      recorder.stop()
    }
  }

  const transcribeRecordedAudio = async (audioBlob: Blob, recordedMimeType: string) => {
    if (!audioBlob.size) {
      throw new Error("No voice was captured. Please try again.")
    }

    const formData = new FormData()
    const extension = getAudioExtension(recordedMimeType)
    formData.append("file", new File([audioBlob], `edupilot-voice.${extension}`, { type: recordedMimeType }))

    const response = await fetch("/api/ai/transcribe", {
      method: "POST",
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Failed to transcribe voice")
    }

    const transcript = typeof data.text === "string" ? data.text.trim() : ""

    if (!transcript || /^thank you[.! ]*$/i.test(transcript)) {
      throw new Error("I could not clearly hear your voice. Please speak closer to the microphone and try again.")
    }

    setInput((prev) => (prev ? `${prev} ${transcript}` : transcript))
  }

  const startBrowserSpeechRecognition = () => {
    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionConstructor) {
      return false
    }

    const recognition = new SpeechRecognitionConstructor()
    speechRecognitionRef.current = recognition
    speechTranscriptRef.current = ""

    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onresult = (event) => {
      let finalTranscript = ""
      let interimTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]
        const transcript = result[0]?.transcript?.trim() || ""

        if (result.isFinal) {
          finalTranscript += `${transcript} `
        } else {
          interimTranscript += `${transcript} `
        }
      }

      const combinedTranscript = `${speechTranscriptRef.current} ${finalTranscript} ${interimTranscript}`.trim()
      if (combinedTranscript) {
        setInput(combinedTranscript)
      }

      if (finalTranscript.trim()) {
        speechTranscriptRef.current = `${speechTranscriptRef.current} ${finalTranscript}`.trim()
      }
    }

    recognition.onerror = (event) => {
      speechRecognitionRef.current = null
      setIsRecording(false)

      if (event.error !== "no-speech" && event.error !== "aborted") {
        pushAssistantError("Voice recognition failed. Please check microphone permission and try again.")
      }
    }

    recognition.onend = () => {
      speechRecognitionRef.current = null
      setIsRecording(false)

      const cleanedTranscript = speechTranscriptRef.current.trim() || input.trim()
      if (!cleanedTranscript) {
        pushAssistantError("I could not hear anything. Please try speaking again.")
        return
      }

      setInput(cleanedTranscript)
    }

    recognition.start()
    setIsRecording(true)
    return true
  }

  const startVoiceRecording = async () => {
    if (typeof window === "undefined") return

    if (startBrowserSpeechRecognition()) {
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      pushAssistantError("Voice recording is not supported in this browser.")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const supportedMimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"]
      const mimeType = supportedMimeTypes.find((type) => MediaRecorder.isTypeSupported(type))
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)

      mediaStreamRef.current = stream
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onerror = () => {
        setIsRecording(false)
        releaseAudioResources()
        pushAssistantError("Voice recording failed. Please try again.")
      }

      recorder.onstop = async () => {
        const recordedMimeType = recorder.mimeType || "audio/webm"
        const audioBlob = new Blob(audioChunksRef.current, { type: recordedMimeType })
        audioChunksRef.current = []
        setIsRecording(false)
        releaseAudioResources()

        setIsTranscribing(true)
        try {
          await transcribeRecordedAudio(audioBlob, recordedMimeType)
        } catch (error) {
          pushAssistantError(error instanceof Error ? error.message : "Voice transcription failed. Please try again.")
        } finally {
          setIsTranscribing(false)
        }
      }

      recorder.start(250)
      setIsRecording(true)
    } catch (error) {
      releaseAudioResources()
      setIsRecording(false)
      const message = error instanceof Error ? error.message : "Microphone permission was denied."
      pushAssistantError(message.includes("denied") ? "Microphone permission was denied." : message)
    }
  }

  const handleMicClick = async () => {
    if (isTyping || isUploadingFiles || isTranscribing) return

    if (isRecording) {
      stopVoiceRecording()
      return
    }

    await startVoiceRecording()
  }

  const handleSend = async () => {
    if ((!(input.trim() || selectedFiles.length) || isTyping || isUploadingFiles || isRecording || isTranscribing)) return

    const messageText = input.trim()
    const pendingFiles = [...selectedFiles]

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content:
        messageText ||
        (pendingFiles.length
          ? `Uploaded ${pendingFiles.length} file${pendingFiles.length > 1 ? "s" : ""} for review.`
          : ""),
      timestamp: new Date(),
      attachments: pendingFiles,
      mode: activeMode,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setSelectedFiles([])
    setIsTyping(true)

    try {
      const uploadedFiles = await uploadSelectedFiles()

      if (activeMode === "image_generation") {
        if (!messageText) {
          throw new Error("Please enter an image prompt.")
        }

        const res = await fetch("/api/ai/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: messageText }),
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to generate image")

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `Here is your generated image for: **${messageText}**`,
            timestamp: new Date(),
            media: { type: "image", url: data.imageUrl },
            mode: activeMode,
          },
        ])
      } else {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: messageText,
            sessionId: activeSessionId,
            mode: activeMode === "web_search" ? "web_search" : "chat",
            attachments: uploadedFiles,
          }),
        })

        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || "Failed to get AI response")
        }

        if (data.sessionId) {
          setActiveSessionId(data.sessionId)
        }

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: data.reply,
            sources: data.sources || [],
            timestamp: new Date(),
            mode: activeMode,
          },
        ])

        loadChatHistory()
      }
    } catch (err) {
      pushAssistantError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setIsTyping(false)
    }
  }

  const handleNewChat = () => {
    if (isRecording) {
      stopVoiceRecording()
    }

    setActiveSessionId(null)
    setMessages(initialMessages)
    setInput("")
    setSelectedFiles([])
    setActiveMode("chat")
    setActiveHint(null)
    setShowSourcesSidebar(false)
    setActiveSources([])
  }

  const handleExportChat = () => {
    if (messages.length <= 1) return

    const currentSession = chatSessions.find((s) => s.id === activeSessionId)
    const sessionName = currentSession
      ? currentSession.title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase().slice(0, 50)
      : "study-session"

    const markdownContent = messages
      .map((msg) => {
        const role = msg.role === "user" ? "👤 **You**" : "🤖 **EduPilot**";
        const timestampStr = msg.timestamp ? ` *(${new Date(msg.timestamp).toLocaleTimeString()})*` : "";
        let text = `${role}${timestampStr}:\n${msg.content}\n`;

        if (msg.attachments && msg.attachments.length > 0) {
          text += "\n**Attachments:**\n";
          msg.attachments.forEach((file) => {
            text += `- ${file.name} (${formatFileSize(file.size)})\n`;
          });
        }

        if (msg.media && msg.media.type === "image") {
          text += `\n![Generated Image](${msg.media.url})\n`;
        }

        if (msg.sources && msg.sources.length > 0) {
          text += "\n**Sources:**\n";
          msg.sources.forEach((source) => {
            text += `- [${source.title}](${source.url}) (${source.source})\n`;
          });
        }

        return text;
      })
      .join("\n---\n\n");

    const blob = new Blob([markdownContent], { type: "text/markdown;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    
    link.setAttribute("href", url)
    link.setAttribute("download", `${sessionName}-${new Date().toISOString().split("T")[0]}.md`)
    link.style.visibility = "hidden"
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleCopy = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 1800)
    } catch (error) {
      console.error("Copy failed:", error)
    }
  }

  const handleLike = (messageId: string) => {
    setMessageFeedback((prev) => ({
      ...prev,
      [messageId]: "like",
    }))
  }

  const handleDislike = (messageId: string) => {
    setMessageFeedback((prev) => ({
      ...prev,
      [messageId]: "dislike",
    }))
    setFeedbackMessageId(messageId)
    setShowFeedbackModal(true)
  }

  const handleOpenSources = (message: Message) => {
    setActiveSources(message.sources || [])
    setActiveSourceTitle("Sources")
    setShowSourcesSidebar(true)
  }

  const submitFeedback = () => {
    console.log("Feedback submitted", {
      messageId: feedbackMessageId,
      feedback: feedbackText,
      type: "dislike",
    })

    setFeedbackText("")
    setFeedbackMessageId(null)
    setShowFeedbackModal(false)
  }

  return (
    <>
      <div className="flex h-[calc(100vh-4rem)] gap-3 overflow-hidden p-3 md:gap-4 md:p-6">
        <Card className="hidden h-full w-72 flex-shrink-0 flex-col overflow-hidden border-border bg-card lg:flex xl:w-80">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="font-semibold text-foreground">Chat History</h2>
            <Button size="sm" variant="ghost" className="text-primary" onClick={handleNewChat}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="h-0 flex-1">
            <div className="space-y-1 p-2">
              {isLoadingHistory ? (
                <div className="flex flex-col gap-2 p-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 animate-pulse rounded-lg bg-secondary" />
                  ))}
                </div>
              ) : chatSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                  <MessageSquare className="mb-2 h-8 w-8 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">No chat history yet.</p>
                  <p className="mt-1 text-xs text-muted-foreground">Your conversations will appear here.</p>
                </div>
              ) : (
                chatSessions.map((chat) => (
                  <div
                    key={chat.id}
                    className={cn(
                      "group flex items-start gap-3 overflow-hidden rounded-lg p-3 text-left transition-colors hover:bg-secondary",
                      activeSessionId === chat.id && "bg-secondary"
                    )}
                  >
                    <button
                      onClick={() => handleOpenSession(chat.id)}
                      className="flex min-w-0 flex-1 items-start gap-3 overflow-hidden text-left"
                    >
                      <MessageSquare className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />

                      <div className="min-w-0 flex-1 overflow-hidden">
                        <p
                          className="overflow-hidden text-sm font-medium leading-5 text-foreground"
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {chat.title}
                        </p>

                        <div className="mt-1 flex items-center gap-2 overflow-hidden text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span className="shrink-0">{chat.time}</span>
                          <span className="shrink-0">•</span>
                          <span className="truncate">{chat.messages} messages</span>
                        </div>
                      </div>
                    </button>

                    <div className="flex items-start gap-1 pl-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0 text-muted-foreground transition-opacity hover:text-destructive desktop-hover-only"
                        onClick={(event) => {
                          event.stopPropagation()
                          handleDeleteSession(chat.id)
                        }}
                        aria-label="Delete chat"
                        title="Delete chat"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="border-t border-border p-4">
            <Button className="w-full gap-2" size="sm" onClick={handleNewChat}>
              <Sparkles className="h-4 w-4" />
              New Chat
            </Button>
          </div>
        </Card>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card md:rounded-xl">
          <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-border p-3 md:p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/20">
                <MessageSquareText className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-sm font-semibold text-foreground md:text-base">AI Study Tutor</h1>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 flex-shrink-0 animate-pulse rounded-full bg-emerald-500" />
                  <span className="text-xs text-muted-foreground">
                    {isOpeningSession ? "Opening chat..." : "Online • Ready to help"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeMode !== "chat" && <Badge variant="secondary">{modeLabels[activeMode]}</Badge>}
              {messages.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportChat}
                  className="gap-2 border-border hover:bg-secondary text-foreground"
                  title="Export chat to Markdown"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Export Chat</span>
                </Button>
              )}
              {showSourcesSidebar && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSourcesSidebar(false)}
                  className="gap-2"
                >
                  <PanelRightOpen className="h-4 w-4" />
                  Hide Sources
                </Button>
              )}
            </div>
          </div>

          <div className="flex min-h-0 flex-1">
            <div className="min-h-0 flex-1 overflow-y-auto p-3 md:p-4">
              <div className="mx-auto max-w-4xl space-y-4 md:space-y-6">
                {messages.map((message) => {
                  const feedback = messageFeedback[message.id]
                  const hasSources = message.role === "assistant" && (message.sources?.length || 0) > 0

                  return (
                    <div
                      key={message.id}
                      className={cn("flex gap-2 md:gap-3", message.role === "user" && "flex-row-reverse justify-end")}
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-medium",
                          message.role === "assistant" ? "bg-primary/20 text-primary" : "bg-primary text-primary-foreground"
                        )}
                      >
                        {message.role === "assistant" ? <MessageSquareText className="h-4 w-4" /> : "You"}
                      </div>

                      <div
                        className={cn(
                          "max-w-xs flex-1 space-y-2 md:max-w-xl lg:max-w-2xl",
                          message.role === "user" && "flex flex-col items-end"
                        )}
                      >
                        <div
                          className={cn(
                            "break-words rounded-lg px-3 py-2 md:rounded-xl md:px-4 md:py-3",
                            message.role === "assistant"
                              ? "border border-white/5 bg-gradient-to-br from-secondary via-secondary to-secondary/80 text-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
                              : "bg-primary text-primary-foreground"
                          )}
                        >
                          {message.role === "assistant" ? (
                            <MarkdownRenderer content={cleanAIResponse(message.content)} />
                          ) : (
                            <p className="text-sm leading-relaxed md:text-base">{cleanAIResponse(message.content)}</p>
                          )}

                          {message.attachments?.length ? (
                            <div className="mt-3 space-y-2">
                              {message.attachments.map((file, index) => (
                                <div
                                  key={`${file.name}-${index}`}
                                  className={cn(
                                    "rounded-lg border px-3 py-2 text-xs",
                                    message.role === "assistant"
                                      ? "border-border/70 bg-background/60"
                                      : "border-primary-foreground/20 bg-primary-foreground/10"
                                  )}
                                >
                                  <div className="flex items-center gap-2 font-medium">
                                    <Paperclip className="h-3.5 w-3.5" />
                                    <span className="truncate">{file.name}</span>
                                  </div>
                                  <p className="mt-1 opacity-80">{formatFileSize(file.size)} • {file.type}</p>
                                </div>
                              ))}
                            </div>
                          ) : null}

                          {message.media?.type === "image" ? (
                            <div className="mt-3 overflow-hidden rounded-xl border border-border/60 bg-background/40 p-2">
                              <img
                                src={message.media.url}
                                alt="Generated image"
                                className="h-auto w-full rounded-lg"
                              />
                              <div className="mt-2 flex justify-end">
                                <a
                                  href={message.media.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                >
                                  Open image <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              </div>
                            </div>
                          ) : null}

                        </div>

                        {hasSources && (
                          <div className="px-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-full"
                              onClick={() => handleOpenSources(message)}
                            >
                              Sources
                            </Button>
                          </div>
                        )}

                        {message.role === "assistant" && (
                          <div className="flex items-center gap-1 px-2 md:gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "h-7 w-7",
                                copiedMessageId === message.id
                                  ? "text-emerald-400"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                              onClick={() => handleCopy(message.id, message.content)}
                              title={copiedMessageId === message.id ? "Done" : "Copy"}
                            >
                              {copiedMessageId === message.id ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "h-7 w-7",
                                feedback === "like"
                                  ? "text-emerald-400"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                              onClick={() => handleLike(message.id)}
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "h-7 w-7",
                                feedback === "dislike"
                                  ? "text-rose-400"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                              onClick={() => handleDislike(message.id)}
                            >
                              <ThumbsDown className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {isTyping && (
                  <div className="flex gap-2 md:gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                      <MessageSquareText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="rounded-lg bg-secondary px-4 py-3 md:rounded-xl">
                      <div className="flex h-4 items-center gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "0ms" }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "150ms" }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {showSourcesSidebar && (
              <aside className="hidden w-[340px] flex-col border-l border-border bg-card/80 backdrop-blur-sm xl:flex">
                <div className="flex items-center justify-between border-b border-border p-4">
                  <h3 className="font-semibold text-foreground">{activeSourceTitle}</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowSourcesSidebar(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <ScrollArea className="h-0 flex-1">
                  <div className="space-y-3 p-4">
                    {activeSources.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No references available.</p>
                    ) : (
                      activeSources.map((link, index) => (
                        <a
                          key={`${link.url}-${index}`}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-xl border border-border bg-secondary/40 p-3 transition-colors hover:bg-secondary"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="break-words text-sm font-medium text-foreground">{link.title}</p>
                              <p className="mt-1 text-xs text-muted-foreground">{link.source}</p>
                            </div>
                            <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          </div>
                        </a>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </aside>
            )}
          </div>

          {messages.length <= 1 && (
            <div className="flex-shrink-0 overflow-x-auto px-3 pb-2 md:px-4">
              <div className="mx-auto max-w-4xl">
                <p className="mb-2 text-xs text-muted-foreground md:mb-3 md:text-sm">Try asking:</p>
                <div className="grid grid-cols-2 gap-1 md:grid-cols-4 md:gap-2">
                  {examplePrompts.map((prompt) => (
                    <button
                      key={prompt.label}
                      onClick={() => setInput(prompt.prompt)}
                      className="flex items-center gap-1 rounded-lg border border-border bg-secondary/50 p-2 text-left text-xs transition-colors hover:bg-secondary md:gap-2 md:p-3 md:text-sm"
                    >
                      <prompt.icon className="h-3 w-3 shrink-0 text-primary md:h-4 md:w-4" />
                      <span className="truncate text-foreground">{prompt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex-shrink-0 border-t border-border p-3 md:p-4">
            <div className="mx-auto max-w-4xl space-y-3">
              {(activeMode === "chat" || activeHint === "web_search" || activeHint === "file_upload" || selectedFiles.length > 0) && (
                <div className="rounded-2xl border border-border bg-secondary/40 p-3">
                  {activeMode === "chat" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        Chat prompts
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {chatSuggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => setInput(suggestion)}
                            className="rounded-full border border-border bg-background px-3 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-secondary"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeHint === "web_search" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Globe className="h-4 w-4 text-primary" />
                        Web Search demo prompts
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {webSearchSuggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => setInput(suggestion)}
                            className="rounded-full border border-border bg-background px-3 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-secondary"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {(activeHint === "file_upload" || selectedFiles.length > 0) && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Paperclip className="h-4 w-4 text-primary" />
                        File Upload guide
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        {fileUploadSuggestions.map((item) => (
                          <p key={item}>{item}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs text-foreground"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      <span className="max-w-[180px] truncate">{file.name}</span>
                      <span className="text-muted-foreground">{formatFileSize(file.size)}</span>
                      <button type="button" onClick={() => removeSelectedFile(index)} className="text-muted-foreground hover:text-foreground">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder={
                      activeMode === "image_generation"
                        ? "Image generation is coming soon..."
                        : activeMode === "web_search"
                            ? "Search the web and ask EduPilot to explain..."
                            : "Ask anything you want to learn..."
                    }
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    className="border-border bg-secondary pl-12 pr-10 text-sm"
                    disabled={isTyping || isUploadingFiles || isRecording || isTranscribing}
                  />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-1 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full text-muted-foreground hover:text-foreground"
                        disabled={isTyping || isUploadingFiles || isRecording || isTranscribing}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-60">
                      <DropdownMenuItem onClick={() => handleToolSelect("chat")} className="gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Chat
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled className="gap-2 opacity-60">
                        <ImageIcon className="h-4 w-4" />
                        <div className="flex items-center gap-2">
                          <span>Image generation</span>
                          <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px]">Coming Soon</Badge>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToolSelect("file_upload")} className="gap-2">
                        <Paperclip className="h-4 w-4" />
                        File upload
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToolSelect("web_search")} className="gap-2">
                        <Globe className="h-4 w-4" />
                        Web search
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleMicClick}
                    className={cn(
                      "absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2",
                      isRecording ? "text-rose-400 hover:text-rose-300" : "text-muted-foreground hover:text-foreground"
                    )}
                    disabled={isTyping || isUploadingFiles || isTranscribing}
                    title={isRecording ? "Stop recording" : isTranscribing ? "Transcribing..." : "Record your question"}
                  >
                    {isTranscribing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className={cn("h-4 w-4", isRecording && "animate-pulse")} />}
                  </Button>
                </div>

                <Button
                  onClick={handleSend}
                  disabled={(!(input.trim() || selectedFiles.length) || isTyping || isUploadingFiles || isRecording || isTranscribing)}
                  size="sm"
                  className="shrink-0"
                >
                  {isTyping || isUploadingFiles || isTranscribing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Mode: {modeLabels[activeMode]}</Badge>
                  {activeMode !== "chat" && (
                    <button
                      className="hover:text-foreground"
                      onClick={() => {
                        setActiveMode("chat")
                        setActiveHint(null)
                      }}
                    >
                      Reset to chat
                    </button>
                  )}
                  {isRecording && <span className="text-rose-400">Recording your question...</span>}
                  {isTranscribing && <span>Converting voice to text...</span>}
                </div>
                <p>AI can make mistakes. Consider checking important information.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" multiple accept=".txt,.md,.pdf,.json,.csv,.zip,.png,.jpg,.jpeg,.webp,.gif,.ts,.tsx,.js,.jsx,.py,.java,.html,.css,.sql,.xml,.yml,.yaml" className="hidden" onChange={handleAddFiles} />

      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border p-5">
              <h2 className="text-2xl font-semibold text-foreground">Share feedback</h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl"
                onClick={() => setShowFeedbackModal(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-5 p-5">
              <p className="text-sm text-muted-foreground">Share your feedback so we can improve the response.</p>

              <div className="flex flex-wrap gap-3">
                {[
                  "Incorrect or incomplete",
                  "Not what I asked for",
                  "Slow or buggy",
                  "Style or tone",
                  "Safety or legal concern",
                  "Other",
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setFeedbackText((prev) => (prev ? `${prev}\n${tag}` : tag))}
                    className="rounded-full border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Share details (optional)"
                className="min-h-[120px] w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />

              <div className="rounded-xl bg-secondary/70 px-4 py-3 text-sm text-muted-foreground">
                Your conversation will be included with your feedback to help improve the response.
              </div>

              <div className="flex justify-end">
                <Button onClick={submitFeedback}>Submit</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <LoginGateModal open={showLoginModal} onOpenChange={setShowLoginModal} featureName="AI Tutor" />
      <CreditsExhaustedModal open={showCreditsModal} onOpenChange={setShowCreditsModal} feature="AI chat" />
    </>
  )
}

export default function AITutorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center p-6 text-sm text-muted-foreground">
          Loading AI Tutor...
        </div>
      }
    >
      <AITutorContent />
    </Suspense>
  )
}
