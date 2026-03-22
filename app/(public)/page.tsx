"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/supabase-client"
import Image from "next/image"
import { ArrowRight, Brain, FileText, Calendar, Layers, HelpCircle, Mic, Sparkles, CheckCircle2, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const features = [
  {
    icon: FileText,
    title: "AI Notes Generator",
    description: "Transform any topic into comprehensive, well-structured study notes with our AI-powered generator.",
    color: "from-primary to-yellow-500",
    href: "/notes",
  },
  {
    icon: Brain,
    title: "AI Tutor Chatbot",
    description: "Get instant answers and explanations from your personal AI tutor available 24/7.",
    color: "from-accent to-blue-400",
    href: "/ai-tutor",
  },
  {
    icon: Calendar,
    title: "Smart Study Planner",
    description: "AI-optimized study schedules that adapt to your learning pace and goals.",
    color: "from-emerald-500 to-teal-400",
    href: "/planner",
  },
  {
    icon: Layers,
    title: "Flashcards + SM2",
    description: "Scientifically proven spaced repetition system for maximum retention.",
    color: "from-violet-500 to-purple-400",
    href: "/flashcards",
  },
  {
    icon: HelpCircle,
    title: "Quiz Generator",
    description: "Auto-generate quizzes from your notes to test your knowledge effectively.",
    color: "from-rose-500 to-pink-400",
    href: "/quiz",
  },
  {
    icon: Mic,
    title: "AI Voice Assistant",
    description: "Learn on the go with voice-enabled AI tutoring and note-taking.",
    color: "from-orange-500 to-amber-400",
    href: "/ai-voice",
  },
]

const stats = [
  { value: "10K+", label: "Active Learners" },
  { value: "1k+", label: "Notes Generated" },
  { value: "50%", label: "Satisfaction Rate" },
  { value: "3.5", label: "App Store Rating" },
]

const blogPosts = [
  {
    slug: "how-to-learn-faster-using-ai",
    title: "How to Learn Faster Using AI",
    description: "Discover proven strategies for accelerating your learning with AI-powered tools and techniques.",
    category: "Learning",
    image: "/blog/LearnFasterUsingAI.png",
  },
  {
    slug: "how-ai-tutors-help-learning",
    title: "How AI Tutors Help Learning",
    description: "Learn how conversational AI can accelerate your understanding of complex topics through personalized tutoring.",
    category: "Learning",
    image: "/blog/HowAITutorsHelpLearning.png",
  },
  {
    slug: "how-to-plan-study-using-ai",
    title: "How to Plan Study Using AI",
    description: "Tips and strategies for maximizing your learning efficiency with AI-powered planning.",
    category: "Guide",
    image: "/blog/HowtoPlanStudyUsingAI.png",
  },
  {
    slug: "how-spaced-repetition-works",
    title: "How Spaced Repetition Works",
    description: "The science behind spaced repetition and how to use it effectively for maximum knowledge retention.",
    category: "Science",
    image: "/blog/HowSpacedRepetitionWorks.png",
  },
  {
    slug: "how-quizzes-improve-retention",
    title: "How Quizzes Improve Retention",
    description: "The science behind testing yourself and how quizzes dramatically improve long-term memory.",
    category: "Science",
    image: "/blog/HowQuizzesImproveRetention.png",
  },
  {
    slug: "getting-started-edupilot",
    title: "Getting Started with EduPilot",
    description: "A complete guide to setting up and using all EduPilot features for maximum learning efficiency.",
    category: "Guide",
    image: "/blog/GettingStartedwithEduPilot.png",
  },
]

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn]   = useState(false)
  const [userName, setUserName]       = useState<string | null>(null)

  useEffect(() => {
    // Instant read from local session — no network call
    getSupabaseBrowserClient().auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsLoggedIn(true)
        const u = session.user
        const name =
          u.user_metadata?.full_name ||
          u.user_metadata?.name ||
          u.email?.split("@")[0] ||
          "User"
        setUserName(name)
      }
    })
    const { data: { subscription } } = getSupabaseBrowserClient().auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        setIsLoggedIn(true)
        const u = session.user
        const name = u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split("@")[0] || "User"
        setUserName(name)
      } else {
        setIsLoggedIn(false)
        setUserName(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        {/* Background Effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute right-0 top-1/2 h-[400px] w-[400px] rounded-full bg-accent/10 blur-3xl" />
        </div>

        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-sm backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Powered by EduPilot</span>
            </div>

            {/* Title */}
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl text-balance">
              The intelligent workspace for{" "}
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                learners
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl text-pretty">
              EduPilot combines AI notes, tutoring, planning, flashcards, and quizzes into one
              intelligent study platform. Study smarter, not harder.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground gap-2">
                <Link href={isLoggedIn ? "/dashboard" : "/register"}>
                  {isLoggedIn ? (userName ? `Welcome, ${userName.split(" ")[0]}` : "Go to Dashboard") : "Start for Free"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="gap-2">
                <Link href="/features">
                  <Play className="h-4 w-4" />
                  View Demo
                </Link>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl font-bold text-foreground md:text-3xl">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Everything you need to excel
            </h2>
            <p className="text-lg text-muted-foreground">
              Powerful AI tools designed to transform how you learn
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Link key={feature.title} href={feature.href} className="group">
                <Card className="h-full relative overflow-hidden border-border bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
                  <CardContent className="p-6">
                    {/* Icon */}
                    <div
                      className={cn(
                        "mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br",
                        feature.color
                      )}
                    >
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>

                    {/* Content */}
                    <h3 className="mb-2 text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>

                    {/* Hover Arrow */}
                    <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="border-y border-border bg-card/50 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Start learning in minutes
            </h2>
            <p className="text-lg text-muted-foreground">
              Three simple steps to transform your study experience
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Create your account",
                description: "Sign up for free and set your learning goals",
              },
              {
                step: "02",
                title: "Add your materials",
                description: "Upload notes or let AI generate them for you",
              },
              {
                step: "03",
                title: "Learn smarter",
                description: "Use AI tools to study efficiently and track progress",
              },
            ].map((item, index) => (
              <div key={item.step} className="relative text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-2xl font-bold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>

                {/* Connector line */}
                {index < 2 && (
                  <div className="absolute right-0 top-8 hidden h-0.5 w-1/2 bg-gradient-to-r from-border to-transparent md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <h2 className="mb-2 text-3xl font-bold text-foreground md:text-4xl">
                Latest from our Insight
              </h2>
              <p className="text-lg text-muted-foreground">
                Tips, guides, and insights to help you learn better
              </p>
            </div>
            <Button variant="outline" asChild className="hidden md:flex">
              <Link href="/blogs">
                View all posts
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blogs/${post.slug}`}
                className="group"
              >
                <Card className="h-full overflow-hidden border-border bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
                  {/* Image */}
                  <div className="aspect-video overflow-hidden bg-gradient-to-br from-secondary to-muted">
                    <Image
                      src={post.image}
                      alt={post.title}
                      width={600}
                      height={400}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  <CardContent className="p-5">
                    {/* Title */}
                    <h3 className="mb-2 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                      {post.title}
                    </h3>

                    {/* Description */}
                    <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                      {post.description}
                    </p>

                    {/* Read More */}
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                      Read more <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Button variant="outline" asChild>
              <Link href="/blogs">
                View all posts
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-accent p-8 md:p-16">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white blur-3xl" />
            </div>

            <div className="relative z-10 text-center">
              <h2 className="mb-4 text-3xl font-bold text-primary-foreground md:text-4xl">
                Ready to transform your learning?
              </h2>
              <p className="mx-auto mb-8 max-w-xl text-lg text-primary-foreground/80">
                Join thousands of students who are already studying smarter with EduPilot.
                Start your free trial today.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  variant="secondary"
                  asChild
                  className="bg-white text-primary hover:bg-white/90"
                >
                  <Link href={isLoggedIn ? "/dashboard" : "/register"}>
                    {isLoggedIn ? "Go to Dashboard" : "Get Started Free"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  asChild
                  className="text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </div>

              {/* Features list */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                {["No credit card required", "14-day free trial", "Cancel anytime"].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-primary-foreground/80">
                    <CheckCircle2 className="h-4 w-4" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
