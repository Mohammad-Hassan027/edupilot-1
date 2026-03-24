// // "use client"

// // import { useState, useRef, useEffect } from "react"
// // import { Button } from "@/components/ui/button"
// // import { Input } from "@/components/ui/input"
// // import { ScrollArea } from "@/components/ui/scroll-area"
// // import { Card } from "@/components/ui/card"
// // import {
// //   Send, MessageSquareText, Sparkles, MessageSquare, Clock, ChevronRight,
// //   Copy, ThumbsUp, ThumbsDown, Mic, RefreshCw, BookOpen, FileQuestion, Lightbulb
// // } from "lucide-react"
// // import { cn } from "@/lib/utils"
// // import { LoginGateModal } from "@/components/login-gate-modal"
// // import { CreditsExhaustedModal } from "@/components/credits-exhausted-modal"
// // import { MarkdownRenderer } from "@/components/markdown-renderer"

// // interface Message {
// //   id:        string
// //   role:      "user" | "assistant"
// //   content:   string
// //   timestamp: Date
// // }

// // interface ChatSession {
// //   id:       string
// //   title:    string
// //   time:     string
// //   messages: number
// // }

// // const examplePrompts = [
// //   { icon: BookOpen,          label: "Explain a concept", prompt: "Explain the concept of REST APIs in simple terms" },
// //   { icon: FileQuestion,      label: "Quiz me",           prompt: "Create a 5 question quiz about JavaScript basics" },
// //   { icon: Lightbulb,         label: "Study tips",        prompt: "Give me effective strategies for learning programming" },
// //   { icon: MessageSquareText, label: "Solve a problem",   prompt: "Help me understand recursion step by step" },
// // ]

// // const initialMessages: Message[] = [
// //   {
// //     id:        "1",
// //     role:      "assistant",
// //     content:   "Hello! I'm your **EduPilot AI Tutor**. I can help you understand complex topics, create quizzes, explain concepts, and much more.\n\nWhat would you like to learn today?",
// //     timestamp: new Date(),
// //   },
// // ]

// // export default function AITutorPage() {
// //   const [messages, setMessages]         = useState<Message[]>(initialMessages)
// //   const [input, setInput]               = useState("")
// //   const [isTyping, setIsTyping]         = useState(false)
// //   const [showLoginModal, setShowLoginModal]     = useState(false)
// //   const [showCreditsModal, setShowCreditsModal] = useState(false)
// //   const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
// //   const [isLoadingHistory, setIsLoadingHistory] = useState(true)
// //   const messagesEndRef = useRef<HTMLDivElement>(null)

// //   useEffect(() => {
// //     fetch("/api/user/chat-history")
// //       .then(r => r.ok ? r.json() : null)
// //       .then(data => { if (data) setChatSessions(data.sessions || []) })
// //       .catch(() => {})
// //       .finally(() => setIsLoadingHistory(false))
// //   }, [])

// //   useEffect(() => {
// //     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
// //   }, [messages])

// //   const handleSend = async () => {
// //     if (!input.trim() || isTyping) return

// //     const userMessage: Message = {
// //       id:        Date.now().toString(),
// //       role:      "user",
// //       content:   input,
// //       timestamp: new Date(),
// //     }

// //     setMessages(prev => [...prev, userMessage])
// //     const sentInput = input
// //     setInput("")
// //     setIsTyping(true)

// //     try {
// //       const res  = await fetch("/api/ai/chat", {
// //         method:  "POST",
// //         headers: { "Content-Type": "application/json" },
// //         body:    JSON.stringify({ message: sentInput }),
// //       })
// //       const data = await res.json()

// //       if (!res.ok) {
// //         if (data.requiresLogin)   { setShowLoginModal(true);   setMessages(p => p.filter(m => m.id !== userMessage.id)); setInput(sentInput); return }
// //         if (data.requiresUpgrade) { setShowCreditsModal(true); return }
// //         throw new Error(data.error || "Failed to get AI response")
// //       }

// //       setMessages(prev => [...prev, {
// //         id:        (Date.now() + 1).toString(),
// //         role:      "assistant",
// //         content:   data.reply,
// //         timestamp: new Date(),
// //       }])
// //     } catch (err) {
// //       setMessages(prev => [...prev, {
// //         id:        (Date.now() + 1).toString(),
// //         role:      "assistant",
// //         content:   err instanceof Error ? err.message : "Something went wrong. Please try again.",
// //         timestamp: new Date(),
// //       }])
// //     } finally {
// //       setIsTyping(false)
// //     }
// //   }

// //   const handleNewChat = () => { setMessages(initialMessages); setInput("") }

// //   return (
// //     <>
// //       <div className="flex h-[calc(100vh-4rem)] gap-3 md:gap-4 p-3 md:p-6 overflow-hidden">

// //         {/* Chat History Sidebar */}
// //         <Card className="hidden lg:flex w-64 xl:w-72 flex-col border-border bg-card flex-shrink-0">
// //           <div className="flex items-center justify-between p-4 border-b border-border">
// //             <h2 className="font-semibold text-foreground">Chat History</h2>
// //             <Button size="sm" variant="ghost" className="text-primary" onClick={handleNewChat}>
// //               <RefreshCw className="h-4 w-4" />
// //             </Button>
// //           </div>
// //           <ScrollArea className="flex-1">
// //             <div className="p-2 space-y-1">
// //               {isLoadingHistory ? (
// //                 <div className="flex flex-col gap-2 p-2">
// //                   {[1, 2, 3].map(i => (
// //                     <div key={i} className="h-14 rounded-lg bg-secondary animate-pulse" />
// //                   ))}
// //                 </div>
// //               ) : chatSessions.length === 0 ? (
// //                 <div className="flex flex-col items-center justify-center py-10 text-center px-4">
// //                   <MessageSquare className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
// //                   <p className="text-sm text-muted-foreground">No chat history yet.</p>
// //                   <p className="text-xs text-muted-foreground mt-1">Your conversations will appear here.</p>
// //                 </div>
// //               ) : (
// //                 chatSessions.map(chat => (
// //                   <button key={chat.id} className="w-full flex items-start gap-3 p-3 rounded-lg text-left hover:bg-secondary transition-colors">
// //                     <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
// //                     <div className="flex-1 min-w-0">
// //                       <p className="text-sm font-medium text-foreground truncate">{chat.title}</p>
// //                       <div className="flex items-center gap-2 text-xs text-muted-foreground">
// //                         <Clock className="h-3 w-3" />
// //                         <span>{chat.time}</span>
// //                         <span>•</span>
// //                         <span>{chat.messages} messages</span>
// //                       </div>
// //                     </div>
// //                     <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
// //                   </button>
// //                 ))
// //               )}
// //             </div>
// //           </ScrollArea>
// //           <div className="p-4 border-t border-border">
// //             <Button className="w-full gap-2" size="sm" onClick={handleNewChat}>
// //               <Sparkles className="h-4 w-4" />
// //               New Chat
// //             </Button>
// //           </div>
// //         </Card>

// //         {/* Main Chat Area */}
// //         <div className="flex-1 flex flex-col bg-card rounded-lg md:rounded-xl border border-border overflow-hidden min-w-0">

// //           {/* Header */}
// //           <div className="flex items-center gap-3 p-3 md:p-4 border-b border-border flex-shrink-0">
// //             <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 flex-shrink-0">
// //               <MessageSquareText className="h-5 w-5 text-primary" />
// //             </div>
// //             <div className="flex-1 min-w-0">
// //               <h1 className="font-semibold text-foreground text-sm md:text-base">AI Study Tutor</h1>
// //               <div className="flex items-center gap-1.5">
// //                 <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
// //                 <span className="text-xs text-muted-foreground">Online • Ready to help</span>
// //               </div>
// //             </div>
// //           </div>

// //           {/* Messages */}
// //           <div className="flex-1 overflow-y-auto p-3 md:p-4 min-h-0">
// //             <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto">
// //               {messages.map(message => (
// //                 <div key={message.id} className={cn("flex gap-2 md:gap-3", message.role === "user" && "flex-row-reverse justify-end")}>

// //                   {/* Avatar */}
// //                   <div className={cn(
// //                     "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-medium",
// //                     message.role === "assistant" ? "bg-primary/20 text-primary" : "bg-primary text-primary-foreground"
// //                   )}>
// //                     {message.role === "assistant" ? <MessageSquareText className="h-4 w-4" /> : "You"}
// //                   </div>

// //                   {/* Bubble */}
// //                   <div className={cn(
// //                     "flex-1 space-y-2 max-w-xs md:max-w-xl lg:max-w-2xl",
// //                     message.role === "user" && "flex flex-col items-end"
// //                   )}>
// //                     <div className={cn(
// //                       "rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 break-words",
// //                       message.role === "assistant"
// //                         ? "bg-secondary text-foreground"
// //                         : "bg-primary text-primary-foreground"
// //                     )}>
// //                       {message.role === "assistant" ? (
// //                         // ── Rendered markdown for AI responses ──────────────
// //                         <MarkdownRenderer content={message.content} />
// //                       ) : (
// //                         // ── Plain text for user messages ─────────────────────
// //                         <p className="text-sm md:text-base leading-relaxed">
// //                           {message.content}
// //                         </p>
// //                       )}
// //                     </div>

// //                     {/* Action buttons */}
// //                     {message.role === "assistant" && (
// //                       <div className="flex items-center gap-1 md:gap-2 px-2">
// //                         <Button variant="ghost" size="icon"
// //                           className="h-7 w-7 text-muted-foreground hover:text-foreground"
// //                           onClick={() => navigator.clipboard.writeText(message.content)}>
// //                           <Copy className="h-3.5 w-3.5" />
// //                         </Button>
// //                         <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
// //                           <ThumbsUp className="h-3.5 w-3.5" />
// //                         </Button>
// //                         <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
// //                           <ThumbsDown className="h-3.5 w-3.5" />
// //                         </Button>
// //                       </div>
// //                     )}
// //                   </div>
// //                 </div>
// //               ))}

// //               {/* Typing indicator */}
// //               {isTyping && (
// //                 <div className="flex gap-2 md:gap-3">
// //                   <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20">
// //                     <MessageSquareText className="h-4 w-4 text-primary" />
// //                   </div>
// //                   <div className="rounded-lg md:rounded-xl bg-secondary px-4 py-3">
// //                     <div className="flex gap-1 items-center h-4">
// //                       <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
// //                       <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
// //                       <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
// //                     </div>
// //                   </div>
// //                 </div>
// //               )}
// //               <div ref={messagesEndRef} />
// //             </div>
// //           </div>

// //           {/* Example prompts */}
// //           {messages.length <= 1 && (
// //             <div className="px-3 md:px-4 pb-2 flex-shrink-0 overflow-x-auto">
// //               <div className="max-w-4xl mx-auto">
// //                 <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">Try asking:</p>
// //                 <div className="grid grid-cols-2 md:grid-cols-4 gap-1 md:gap-2">
// //                   {examplePrompts.map(prompt => (
// //                     <button key={prompt.label} onClick={() => setInput(prompt.prompt)}
// //                       className="flex items-center gap-1 md:gap-2 p-2 md:p-3 rounded-lg border border-border bg-secondary/50 text-left hover:bg-secondary transition-colors text-xs md:text-sm">
// //                       <prompt.icon className="h-3 w-3 md:h-4 md:w-4 text-primary shrink-0" />
// //                       <span className="text-foreground truncate">{prompt.label}</span>
// //                     </button>
// //                   ))}
// //                 </div>
// //               </div>
// //             </div>
// //           )}

// //           {/* Input */}
// //           <div className="p-3 md:p-4 border-t border-border flex-shrink-0">
// //             <div className="max-w-4xl mx-auto">
// //               <div className="relative flex items-center gap-2">
// //                 <div className="relative flex-1">
// //                   <Input
// //                     placeholder="Ask anything you want to learn..."
// //                     value={input}
// //                     onChange={e => setInput(e.target.value)}
// //                     onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
// //                     className="pr-10 bg-secondary border-border text-sm"
// //                     disabled={isTyping}
// //                   />
// //                   <Button variant="ghost" size="icon"
// //                     className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground">
// //                     <Mic className="h-4 w-4" />
// //                   </Button>
// //                 </div>
// //                 <Button onClick={handleSend} disabled={!input.trim() || isTyping} size="sm" className="shrink-0">
// //                   <Send className="h-4 w-4" />
// //                 </Button>
// //               </div>
// //               <p className="text-xs text-muted-foreground text-center mt-2">
// //                 AI can make mistakes. Consider checking important information.
// //               </p>
// //             </div>
// //           </div>
// //         </div>
// //       </div>

// //       <LoginGateModal open={showLoginModal} onOpenChange={setShowLoginModal} featureName="AI Tutor" />
// //       <CreditsExhaustedModal open={showCreditsModal} onOpenChange={setShowCreditsModal} feature="AI chat" />
// //     </>
// //   )
// // }
// "use client"

// import { useState, useRef, useEffect } from "react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { ScrollArea } from "@/components/ui/scroll-area"
// import { Card } from "@/components/ui/card"
// import {
//   Send, MessageSquareText, Sparkles, MessageSquare, Clock, ChevronRight,
//   Copy, ThumbsUp, ThumbsDown, Mic, RefreshCw, BookOpen, FileQuestion, Lightbulb
// } from "lucide-react"
// import { cn } from "@/lib/utils"
// import { LoginGateModal } from "@/components/login-gate-modal"
// import { CreditsExhaustedModal } from "@/components/credits-exhausted-modal"
// import { MarkdownRenderer } from "@/components/markdown-renderer"

// interface Message {
//   id: string
//   role: "user" | "assistant"
//   content: string
//   timestamp: Date
// }

// interface ChatSession {
//   id: string
//   title: string
//   time: string
//   messages: number
// }

// const examplePrompts = [
//   { icon: BookOpen,          label: "Explain a concept", prompt: "Explain the concept of REST APIs in simple terms" },
//   { icon: FileQuestion,      label: "Quiz me",           prompt: "Create a 5 question quiz about JavaScript basics" },
//   { icon: Lightbulb,         label: "Study tips",        prompt: "Give me effective strategies for learning programming" },
//   { icon: MessageSquareText, label: "Solve a problem",   prompt: "Help me understand recursion step by step" },
// ]

// const initialMessages: Message[] = [
//   {
//     id: "1",
//     role: "assistant",
//     content:
//       "Hello! I'm your **EduPilot AI Tutor**. I can help you understand complex topics, create quizzes, explain concepts, and much more.\n\nWhat would you like to learn today?",
//     timestamp: new Date(),
//   },
// ]

// export default function AITutorPage() {
//   const [messages, setMessages] = useState<Message[]>(initialMessages)
//   const [input, setInput] = useState("")
//   const [isTyping, setIsTyping] = useState(false)
//   const [showLoginModal, setShowLoginModal] = useState(false)
//   const [showCreditsModal, setShowCreditsModal] = useState(false)
//   const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
//   const [isLoadingHistory, setIsLoadingHistory] = useState(true)
//   const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
//   const messagesEndRef = useRef<HTMLDivElement>(null)

//   const loadChatHistory = async () => {
//     try {
//       const res = await fetch("/api/user/chat-history", { cache: "no-store" })
//       const data = res.ok ? await res.json() : { sessions: [] }
//       setChatSessions(data.sessions || [])
//     } catch {
//       setChatSessions([])
//     } finally {
//       setIsLoadingHistory(false)
//     }
//   }

//   useEffect(() => {
//     loadChatHistory()
//   }, [])

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
//   }, [messages])

//   const handleOpenSession = async (sessionId: string) => {
//     try {
//       const res = await fetch(`/api/user/chat-history/${sessionId}`, {
//         cache: "no-store",
//       })

//       const data = res.ok ? await res.json() : { messages: [] }

//       const loadedMessages: Message[] = (data.messages || []).map((m: any) => ({
//         id: m.id,
//         role: m.role,
//         content: m.content,
//         timestamp: new Date(m.timestamp),
//       }))

//       if (loadedMessages.length > 0) {
//         setMessages(loadedMessages)
//         setActiveSessionId(sessionId)
//       }
//     } catch (err) {
//       console.error(err)
//     }
//   }

//   const handleSend = async () => {
//     if (!input.trim() || isTyping) return

//     const userMessage: Message = {
//       id: Date.now().toString(),
//       role: "user",
//       content: input,
//       timestamp: new Date(),
//     }

//     setMessages((prev) => [...prev, userMessage])

//     const sentInput = input
//     setInput("")
//     setIsTyping(true)

//     try {
//       const res = await fetch("/api/ai/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           message: sentInput,
//           sessionId: activeSessionId,
//         }),
//       })

//       const data = await res.json()

//       if (!res.ok) {
//         if (data.requiresLogin) {
//           setShowLoginModal(true)
//           setMessages((p) => p.filter((m) => m.id !== userMessage.id))
//           setInput(sentInput)
//           return
//         }

//         if (data.requiresUpgrade) {
//           setShowCreditsModal(true)
//           return
//         }

//         throw new Error(data.error || "Failed to get AI response")
//       }

//       if (data.sessionId && !activeSessionId) {
//         setActiveSessionId(data.sessionId)
//       }

//       setMessages((prev) => [
//         ...prev,
//         {
//           id: (Date.now() + 1).toString(),
//           role: "assistant",
//           content: data.reply,
//           timestamp: new Date(),
//         },
//       ])

//       await loadChatHistory()
//     } catch (err) {
//       setMessages((prev) => [
//         ...prev,
//         {
//           id: (Date.now() + 1).toString(),
//           role: "assistant",
//           content:
//             err instanceof Error
//               ? err.message
//               : "Something went wrong. Please try again.",
//           timestamp: new Date(),
//         },
//       ])
//     } finally {
//       setIsTyping(false)
//     }
//   }

//   const handleNewChat = async () => {
//     await loadChatHistory()
//     setActiveSessionId(null)
//     setMessages(initialMessages)
//     setInput("")
//   }

//   return (
//     <>
//       <div className="flex h-[calc(100vh-4rem)] gap-3 md:gap-4 p-3 md:p-6 overflow-hidden">
//         <Card className="hidden lg:flex w-64 xl:w-72 flex-col border-border bg-card flex-shrink-0">
//           <div className="flex items-center justify-between p-4 border-b border-border">
//             <h2 className="font-semibold text-foreground">Chat History</h2>
//             <Button size="sm" variant="ghost" className="text-primary" onClick={handleNewChat}>
//               <RefreshCw className="h-4 w-4" />
//             </Button>
//           </div>

//           <ScrollArea className="flex-1">
//             <div className="p-2 space-y-1">
//               {isLoadingHistory ? (
//                 <div className="flex flex-col gap-2 p-2">
//                   {[1, 2, 3].map((i) => (
//                     <div key={i} className="h-14 rounded-lg bg-secondary animate-pulse" />
//                   ))}
//                 </div>
//               ) : chatSessions.length === 0 ? (
//                 <div className="flex flex-col items-center justify-center py-10 text-center px-4">
//                   <MessageSquare className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
//                   <p className="text-sm text-muted-foreground">No chat history yet.</p>
//                   <p className="text-xs text-muted-foreground mt-1">Your conversations will appear here.</p>
//                 </div>
//               ) : (
//                 chatSessions.map((chat) => (
//                   <button
//                     key={chat.id}
//                     onClick={() => handleOpenSession(chat.id)}
//                     className={cn(
//                       "w-full flex items-start gap-3 p-3 rounded-lg text-left hover:bg-secondary transition-colors",
//                       activeSessionId === chat.id && "bg-secondary"
//                     )}
//                   >
//                     <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
//                     <div className="flex-1 min-w-0">
//                       <p className="text-sm font-medium text-foreground truncate">{chat.title}</p>
//                       <div className="flex items-center gap-2 text-xs text-muted-foreground">
//                         <Clock className="h-3 w-3" />
//                         <span>{chat.time}</span>
//                         <span>•</span>
//                         <span>{chat.messages} messages</span>
//                       </div>
//                     </div>
//                     <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
//                   </button>
//                 ))
//               )}
//             </div>
//           </ScrollArea>

//           <div className="p-4 border-t border-border">
//             <Button className="w-full gap-2" size="sm" onClick={handleNewChat}>
//               <Sparkles className="h-4 w-4" />
//               New Chat
//             </Button>
//           </div>
//         </Card>

//         <div className="flex-1 flex flex-col bg-card rounded-lg md:rounded-xl border border-border overflow-hidden min-w-0">
//           <div className="flex items-center gap-3 p-3 md:p-4 border-b border-border flex-shrink-0">
//             <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 flex-shrink-0">
//               <MessageSquareText className="h-5 w-5 text-primary" />
//             </div>
//             <div className="flex-1 min-w-0">
//               <h1 className="font-semibold text-foreground text-sm md:text-base">AI Study Tutor</h1>
//               <div className="flex items-center gap-1.5">
//                 <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
//                 <span className="text-xs text-muted-foreground">Online • Ready to help</span>
//               </div>
//             </div>
//           </div>

//           <div className="flex-1 overflow-y-auto p-3 md:p-4 min-h-0">
//             <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto">
//               {messages.map((message) => (
//                 <div
//                   key={message.id}
//                   className={cn("flex gap-2 md:gap-3", message.role === "user" && "flex-row-reverse justify-end")}
//                 >
//                   <div
//                     className={cn(
//                       "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-medium",
//                       message.role === "assistant"
//                         ? "bg-primary/20 text-primary"
//                         : "bg-primary text-primary-foreground"
//                     )}
//                   >
//                     {message.role === "assistant" ? <MessageSquareText className="h-4 w-4" /> : "You"}
//                   </div>

//                   <div
//                     className={cn(
//                       "flex-1 space-y-2 max-w-xs md:max-w-xl lg:max-w-2xl",
//                       message.role === "user" && "flex flex-col items-end"
//                     )}
//                   >
//                     <div
//                       className={cn(
//                         "rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 break-words",
//                         message.role === "assistant"
//                           ? "bg-secondary text-foreground"
//                           : "bg-primary text-primary-foreground"
//                       )}
//                     >
//                       {message.role === "assistant" ? (
//                         <MarkdownRenderer content={message.content} />
//                       ) : (
//                         <p className="text-sm md:text-base leading-relaxed">
//                           {message.content}
//                         </p>
//                       )}
//                     </div>

//                     {message.role === "assistant" && (
//                       <div className="flex items-center gap-1 md:gap-2 px-2">
//                         <Button
//                           variant="ghost"
//                           size="icon"
//                           className="h-7 w-7 text-muted-foreground hover:text-foreground"
//                           onClick={() => navigator.clipboard.writeText(message.content)}
//                         >
//                           <Copy className="h-3.5 w-3.5" />
//                         </Button>
//                         <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
//                           <ThumbsUp className="h-3.5 w-3.5" />
//                         </Button>
//                         <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
//                           <ThumbsDown className="h-3.5 w-3.5" />
//                         </Button>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               ))}

//               {isTyping && (
//                 <div className="flex gap-2 md:gap-3">
//                   <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20">
//                     <MessageSquareText className="h-4 w-4 text-primary" />
//                   </div>
//                   <div className="rounded-lg md:rounded-xl bg-secondary px-4 py-3">
//                     <div className="flex gap-1 items-center h-4">
//                       <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
//                       <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
//                       <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
//                     </div>
//                   </div>
//                 </div>
//               )}

//               <div ref={messagesEndRef} />
//             </div>
//           </div>

//           {messages.length <= 1 && (
//             <div className="px-3 md:px-4 pb-2 flex-shrink-0 overflow-x-auto">
//               <div className="max-w-4xl mx-auto">
//                 <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">Try asking:</p>
//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-1 md:gap-2">
//                   {examplePrompts.map((prompt) => (
//                     <button
//                       key={prompt.label}
//                       onClick={() => setInput(prompt.prompt)}
//                       className="flex items-center gap-1 md:gap-2 p-2 md:p-3 rounded-lg border border-border bg-secondary/50 text-left hover:bg-secondary transition-colors text-xs md:text-sm"
//                     >
//                       <prompt.icon className="h-3 w-3 md:h-4 md:w-4 text-primary shrink-0" />
//                       <span className="text-foreground truncate">{prompt.label}</span>
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           )}

//           <div className="p-3 md:p-4 border-t border-border flex-shrink-0">
//             <div className="max-w-4xl mx-auto">
//               <div className="relative flex items-center gap-2">
//                 <div className="relative flex-1">
//                   <Input
//                     placeholder="Ask anything you want to learn..."
//                     value={input}
//                     onChange={(e) => setInput(e.target.value)}
//                     onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
//                     className="pr-10 bg-secondary border-border text-sm"
//                     disabled={isTyping}
//                   />
//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
//                   >
//                     <Mic className="h-4 w-4" />
//                   </Button>
//                 </div>
//                 <Button onClick={handleSend} disabled={!input.trim() || isTyping} size="sm" className="shrink-0">
//                   <Send className="h-4 w-4" />
//                 </Button>
//               </div>
//               <p className="text-xs text-muted-foreground text-center mt-2">
//                 AI can make mistakes. Consider checking important information.
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>

//       <LoginGateModal open={showLoginModal} onOpenChange={setShowLoginModal} featureName="AI Tutor" />
//       <CreditsExhaustedModal open={showCreditsModal} onOpenChange={setShowCreditsModal} feature="AI chat" />
//     </>
//   )
// }
"use client"

import { Suspense, useState, useRef, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
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

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  sources?: ResourceLink[]
}

interface ChatSession {
  id: string
  title: string
  time: string
  messages: number
}

type FeedbackType = "like" | "dislike" | null

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
      "Hello! I'm your **EduPilot AI Tutor**. I can help you understand complex topics, create quizzes, explain concepts, and much more.\n\nWhat would you like to learn today?",
    timestamp: new Date(),
    sources: [],
  },
]

function AITutorContent() {
  const searchParams = useSearchParams()
  const targetSessionId = searchParams.get("session")

  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showCreditsModal, setShowCreditsModal] = useState(false)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [isOpeningSession, setIsOpeningSession] = useState(false)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)

  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [messageFeedback, setMessageFeedback] = useState<Record<string, FeedbackType>>({})
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackMessageId, setFeedbackMessageId] = useState<string | null>(null)
  const [feedbackText, setFeedbackText] = useState("")

  const [showSourcesSidebar, setShowSourcesSidebar] = useState(false)
  const [activeSources, setActiveSources] = useState<ResourceLink[]>([])
  const [activeSourceTitle, setActiveSourceTitle] = useState("Sources")

  const messagesEndRef = useRef<HTMLDivElement>(null)

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

  const handleOpenSession = useCallback(async (sessionId: string) => {
    try {
      setIsOpeningSession(true)

      const res = await fetch(`/api/user/chat-history/${sessionId}`, {
        cache: "no-store",
      })

      const data = res.ok ? await res.json() : { messages: [] }

      const loadedMessages: Message[] = (data.messages || []).map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.timestamp),
        sources: m.sources || [],
      }))

      if (loadedMessages.length > 0) {
        setMessages(loadedMessages)
        setActiveSessionId(sessionId)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsOpeningSession(false)
    }
  }, [])

  useEffect(() => {
    loadChatHistory()
  }, [loadChatHistory])

  useEffect(() => {
    if (targetSessionId) {
      handleOpenSession(targetSessionId)
    }
  }, [targetSessionId, handleOpenSession])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isTyping) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])

    const sentInput = input
    setInput("")
    setIsTyping(true)

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: sentInput,
          sessionId: activeSessionId,
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
        },
      ])

      loadChatHistory()
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            err instanceof Error
              ? err.message
              : "Something went wrong. Please try again.",
          sources: [],
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  const handleNewChat = () => {
    setActiveSessionId(null)
    setMessages(initialMessages)
    setInput("")
    setShowSourcesSidebar(false)
    setActiveSources([])
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
      <div className="flex h-[calc(100vh-4rem)] gap-3 md:gap-4 p-3 md:p-6 overflow-hidden">
        <Card className="hidden lg:flex w-64 xl:w-72 flex-col border-border bg-card flex-shrink-0">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Chat History</h2>
            <Button size="sm" variant="ghost" className="text-primary" onClick={handleNewChat}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {isLoadingHistory ? (
                <div className="flex flex-col gap-2 p-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 rounded-lg bg-secondary animate-pulse" />
                  ))}
                </div>
              ) : chatSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                  <MessageSquare className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">No chat history yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Your conversations will appear here.</p>
                </div>
              ) : (
                chatSessions.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => handleOpenSession(chat.id)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-lg text-left hover:bg-secondary transition-colors",
                      activeSessionId === chat.id && "bg-secondary"
                    )}
                  >
                    <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{chat.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{chat.time}</span>
                        <span>•</span>
                        <span>{chat.messages} messages</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-border">
            <Button className="w-full gap-2" size="sm" onClick={handleNewChat}>
              <Sparkles className="h-4 w-4" />
              New Chat
            </Button>
          </div>
        </Card>

        <div className="flex-1 flex flex-col bg-card rounded-lg md:rounded-xl border border-border overflow-hidden min-w-0">
          <div className="flex items-center justify-between gap-3 p-3 md:p-4 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 flex-shrink-0">
                <MessageSquareText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-semibold text-foreground text-sm md:text-base">AI Study Tutor</h1>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">
                    {isOpeningSession ? "Opening chat..." : "Online • Ready to help"}
                  </span>
                </div>
              </div>
            </div>

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

          <div className="flex flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto p-3 md:p-4 min-h-0">
              <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto">
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
                          message.role === "assistant"
                            ? "bg-primary/20 text-primary"
                            : "bg-primary text-primary-foreground"
                        )}
                      >
                        {message.role === "assistant" ? <MessageSquareText className="h-4 w-4" /> : "You"}
                      </div>

                      <div
                        className={cn(
                          "flex-1 space-y-2 max-w-xs md:max-w-xl lg:max-w-2xl",
                          message.role === "user" && "flex flex-col items-end"
                        )}
                      >
                        <div
                          className={cn(
                            "rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 break-words",
                            message.role === "assistant"
                              ? "bg-secondary text-foreground"
                              : "bg-primary text-primary-foreground"
                          )}
                        >
                          {message.role === "assistant" ? (
                            <MarkdownRenderer content={message.content} />
                          ) : (
                            <p className="text-sm md:text-base leading-relaxed">{message.content}</p>
                          )}
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
                          <div className="flex items-center gap-1 md:gap-2 px-2">
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

                            {feedback !== "like" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  "h-7 w-7",
                                  feedback === "dislike"
                                    ? "text-red-400"
                                    : "text-muted-foreground hover:text-foreground"
                                )}
                                onClick={() => handleDislike(message.id)}
                              >
                                <ThumbsDown className="h-3.5 w-3.5" />
                              </Button>
                            )}
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
                    <div className="rounded-lg md:rounded-xl bg-secondary px-4 py-3">
                      <div className="flex gap-1 items-center h-4">
                        <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {showSourcesSidebar && (
              <aside className="hidden xl:flex w-[340px] border-l border-border bg-card/80 backdrop-blur-sm flex-col">
                <div className="flex items-center justify-between p-4 border-b border-border">
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

                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-3">
                    {activeSources.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No references available.</p>
                    ) : (
                      activeSources.map((link, index) => (
                        <a
                          key={`${link.url}-${index}`}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-xl border border-border bg-secondary/40 p-3 hover:bg-secondary transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground break-words">{link.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">{link.source}</p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
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
            <div className="px-3 md:px-4 pb-2 flex-shrink-0 overflow-x-auto">
              <div className="max-w-4xl mx-auto">
                <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">Try asking:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1 md:gap-2">
                  {examplePrompts.map((prompt) => (
                    <button
                      key={prompt.label}
                      onClick={() => setInput(prompt.prompt)}
                      className="flex items-center gap-1 md:gap-2 p-2 md:p-3 rounded-lg border border-border bg-secondary/50 text-left hover:bg-secondary transition-colors text-xs md:text-sm"
                    >
                      <prompt.icon className="h-3 w-3 md:h-4 md:w-4 text-primary shrink-0" />
                      <span className="text-foreground truncate">{prompt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="p-3 md:p-4 border-t border-border flex-shrink-0">
            <div className="max-w-4xl mx-auto">
              <div className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="Ask anything you want to learn..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    className="pr-10 bg-secondary border-border text-sm"
                    disabled={isTyping}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={handleSend} disabled={!input.trim() || isTyping} size="sm" className="shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                AI can make mistakes. Consider checking important information.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
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

            <div className="p-5 space-y-5">
              <p className="text-sm text-muted-foreground">
                Share your feedback so we can improve the response.
              </p>

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
                    onClick={() =>
                      setFeedbackText((prev) => (prev ? `${prev}\n${tag}` : tag))
                    }
                    className="rounded-full border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Share details (optional)"
                className="w-full min-h-[120px] rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary resize-none"
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