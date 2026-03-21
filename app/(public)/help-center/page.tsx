"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, ChevronDown, Mail, MessageSquare, Clock, Send, CheckCircle2, HelpCircle, BookOpen, CreditCard, Settings, Zap, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

const categories = [
  {
    icon: BookOpen,
    title: "Getting Started",
    description: "Learn the basics of using EduPilot",
    articles: 8,
  },
  {
    icon: Zap,
    title: "AI Features",
    description: "How to use AI tools effectively",
    articles: 12,
  },
  {
    icon: CreditCard,
    title: "Billing & Plans",
    description: "Pricing, payments, and subscriptions",
    articles: 6,
  },
  {
    icon: Settings,
    title: "Account Settings",
    description: "Manage your account and preferences",
    articles: 5,
  },
]

const faqs = [
  {
    question: "How do I generate AI notes?",
    answer: "Navigate to the Notes section in your dashboard, enter a topic or paste text, then click 'Generate Notes'. The AI will create comprehensive study notes within seconds. You can customize the format and export to various formats."
  },
  {
    question: "What is spaced repetition and how does it work?",
    answer: "Spaced repetition is a learning technique where you review material at increasing intervals. Our flashcard system uses the SM2 algorithm to schedule reviews at the optimal time for long-term retention. Cards you find difficult appear more often, while easier cards appear less frequently."
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel your subscription at any time from your account settings. Your access will continue until the end of your current billing period. We also offer a 7-day money-back guarantee on all paid plans."
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We use industry-standard encryption for all data transmission and storage. Your study materials and personal information are never shared with third parties. You can also export or delete your data at any time."
  },
  {
    question: "How does the AI Tutor work?",
    answer: "The AI Tutor is powered by advanced language models trained on educational content. Simply type your question or describe what you're struggling with, and the AI will provide explanations, examples, and step-by-step solutions. It adapts to your level and remembers context from your conversation."
  },
  {
    question: "Can I use EduPilot offline?",
    answer: "Currently, EduPilot requires an internet connection for AI features. However, you can export notes and flashcards for offline review. We're working on offline mode for future updates."
  },
  {
    question: "Do you offer student discounts?",
    answer: "Yes! Students with a valid .edu email address receive 20% off all paid plans. Contact our support team with your student email to apply the discount to your account."
  },
  {
    question: "How do I share notes with classmates?",
    answer: "Click the 'Share' button on any note or flashcard deck. You can generate a shareable link or invite specific users via email. You control whether others can view only or also edit the shared content."
  },
]

export default function HelpCenterPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [ticketSubmitted, setTicketSubmitted] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const [isSubmitting, setIsSubmitting]   = useState(false)
  const [submitError, setSubmitError]     = useState<string | null>(null)
  const [ticketName, setTicketName]       = useState("")
  const [ticketEmail, setTicketEmail]     = useState("")
  const [ticketCategory, setTicketCategory] = useState("")
  const [ticketSubject, setTicketSubject] = useState("")
  const [ticketMessage, setTicketMessage] = useState("")

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch("/api/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: ticketName, email: ticketEmail,
          category: ticketCategory, subject: ticketSubject, message: ticketMessage,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setSubmitError(data.error || "Failed to submit ticket. Please try again."); return }
      setTicketSubmitted(true)
    } catch {
      setSubmitError("Network error. Please check your connection and try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
            Help Center
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Find answers, get support, and learn how to make the most of EduPilot.
          </p>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 border-border bg-card pl-12 text-foreground"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="mb-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Card
              key={category.title}
              className="cursor-pointer border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg"
            >
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <category.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-1 font-semibold text-foreground">{category.title}</h3>
                <p className="mb-2 text-sm text-muted-foreground">{category.description}</p>
                <span className="text-xs text-primary">{category.articles} articles</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mb-16" id="faq">
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground">
              Quick answers to common questions
            </p>
          </div>

          <div className="mx-auto max-w-3xl space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="flex w-full items-center justify-between p-5 text-left"
                >
                  <span className="font-medium text-foreground pr-4">{faq.question}</span>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                      expandedFaq === index && "rotate-180"
                    )}
                  />
                </button>
                {expandedFaq === index && (
                  <div className="border-t border-border bg-secondary/30 px-5 py-4">
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact & Support */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Contact Info */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Contact Support</h2>
            <p className="text-muted-foreground">
              Can&apos;t find what you&apos;re looking for? Our support team is here to help.
            </p>

            <div className="space-y-4">
              <Card className="border-border bg-card">
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Email Support</h3>
                    <p className="text-sm text-muted-foreground mb-1">For general inquiries</p>
                    <a href="mailto:contact@edupilot.ai" className="text-sm text-primary hover:underline">
                      contact@edupilot.ai
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="flex items-start gap-4 p-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Support</h3>
                    <p className="text-sm text-muted-foreground">For technical support.</p>
                    <a
                      href="mailto:contact@edupilot.ai"
                      className="mt-1 text-sm font-medium text-primary hover:underline block"
                    >
                      contact@edupilot.ai
                    </a>
                    <a
                      href="tel:+916352751256"
                      className="mt-1 text-sm font-medium text-primary hover:underline block"
                    >
                      +91 63527 51256
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Response Time</h3>
                    <p className="text-sm text-muted-foreground mb-1">We typically respond within</p>
                    <span className="text-sm text-primary">24-48 hours</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Ticket Form */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Submit a Ticket</CardTitle>
              <CardDescription>
                Describe your issue and we&apos;ll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ticketSubmitted ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    Ticket submitted!
                  </h3>
                  <p className="text-muted-foreground">
                    A confirmation has been sent to your email. Our team will respond within 24 hours.
                  </p>
                </div>
              ) : (
                {submitError && (
                  <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                    {submitError}
                  </div>
                )}
                <form onSubmit={handleTicketSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        placeholder="Your name"
                        required
                        value={ticketName}
                        onChange={(e) => setTicketName(e.target.value)}
                        className="border-border bg-secondary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                        value={ticketEmail}
                        onChange={(e) => setTicketEmail(e.target.value)}
                        className="border-border bg-secondary"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select required value={ticketCategory} onValueChange={setTicketCategory}>
                      <SelectTrigger className="border-border bg-secondary">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical Issue</SelectItem>
                        <SelectItem value="billing">Billing</SelectItem>
                        <SelectItem value="feature">Feature Request</SelectItem>
                        <SelectItem value="bug">Bug Report</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="Brief description of your issue"
                      required
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      className="border-border bg-secondary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Please describe your issue in detail..."
                      rows={5}
                      required
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      className="border-border bg-secondary resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground"
                    disabled={isSubmitting}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Submitting..." : "Submit Ticket"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
