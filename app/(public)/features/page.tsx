import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Brain, FileText, Calendar, Layers, HelpCircle, Mic, Sparkles, Zap, Shield, Users, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const mainFeatures = [
  {
    icon: FileText,
    title: "AI Notes Generator",
    description: "Transform any topic into comprehensive, well-structured study notes. Our AI understands context and creates notes that match your learning style.",
    benefits: [
      "Generate notes from any topic or text",
      "Multiple formats: outline, summary, detailed",
      "Export to PDF, Notion, or Markdown",
      "Smart highlighting and key concepts",
    ],
    color: "from-primary to-yellow-500",
    image: "/features/ai-notes.jpg",
  },
  {
    icon: Brain,
    title: "AI Tutor Chatbot",
    description: "Your personal AI tutor available 24/7. Get instant explanations, solve problems step-by-step, and deepen your understanding of any subject.",
    benefits: [
      "Conversational learning experience",
      "Step-by-step problem solving",
      "Contextual explanations",
      "Multi-language support",
    ],
    color: "from-accent to-blue-400",
    image: "/features/ai-tutor.jpg",
  },
  {
    icon: Calendar,
    title: "Smart Study Planner",
    description: "AI-optimized study schedules that adapt to your pace, goals, and available time. Never miss a deadline or cram before exams again.",
    benefits: [
      "Personalized study schedules",
      "Goal tracking and reminders",
      "Adaptive planning based on progress",
      "Calendar integration",
    ],
    color: "from-emerald-500 to-teal-400",
    image: "/features/study-planner.jpg",
  },
  {
    icon: Layers,
    title: "Flashcards with SM2",
    description: "Master any subject with scientifically proven spaced repetition. Our SM2 algorithm ensures you review at the optimal time for maximum retention.",
    benefits: [
      "Auto-generate from notes",
      "Spaced repetition algorithm",
      "Progress tracking",
      "Image and audio support",
    ],
    color: "from-violet-500 to-purple-400",
    image: "/features/flashcards.jpg",
  },
  {
    icon: HelpCircle,
    title: "Quiz Generator",
    description: "Automatically generate quizzes from your notes to test your knowledge. Multiple question types and instant feedback help you identify weak areas.",
    benefits: [
      "Multiple choice and open-ended",
      "Instant grading and feedback",
      "Difficulty adaptation",
      "Performance analytics",
    ],
    color: "from-rose-500 to-pink-400",
    image: "/features/quiz.jpg",
  },
  {
    icon: Mic,
    title: "AI Voice Assistant",
    description: "Learn on the go with voice-enabled tutoring. Ask questions, get explanations, and even have your notes read aloud.",
    benefits: [
      "Voice-based Q&A",
      "Text-to-speech notes",
      "Hands-free learning",
      "Multiple voice options",
    ],
    color: "from-orange-500 to-amber-400",
    image: "/features/voice-assistant.jpg",
  },
]

const additionalFeatures = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Powered by cutting-edge AI models for instant responses",
    image: "/features/lightning-fast.jpg",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your data is encrypted and never shared with third parties",
    image: "/features/secure-private.jpg",
  },
  {
    icon: Users,
    title: "Collaborative",
    description: "Share notes and study materials with friends and classmates",
    image: "/features/collaborative.jpg",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Track your progress with detailed learning analytics",
    image: "/features/analytics.jpg",
  },
]

export default function FeaturesPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mx-auto mb-20 max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Powered by EduPilot</span>
          </div>
          <h1 className="mb-6 text-4xl font-bold text-foreground md:text-5xl">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              learn smarter
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Six powerful AI tools designed to transform how you study. Each feature works
            seamlessly together to create the ultimate learning experience.
          </p>
        </div>

        {/* Main Features */}
        <div className="space-y-24">
          {mainFeatures.map((feature, index) => (
            <div
              key={feature.title}
              className={cn(
                "grid items-center gap-12 lg:grid-cols-2",
                index % 2 === 1 && "lg:flex-row-reverse"
              )}
            >
              {/* Content */}
              <div className={cn(index % 2 === 1 && "lg:order-2")}>
                <div
                  className={cn(
                    "mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br",
                    feature.color
                  )}
                >
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <h2 className="mb-4 text-3xl font-bold text-foreground">
                  {feature.title}
                </h2>
                <p className="mb-6 text-lg text-muted-foreground">
                  {feature.description}
                </p>
                <ul className="space-y-3">
                  {feature.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-3 text-foreground">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <ArrowRight className="h-3 w-3 text-primary" />
                      </div>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual */}
              <div className={cn("relative", index % 2 === 1 && "lg:order-1")}>
                <Card className="overflow-hidden border-border bg-card">
                  <CardContent className="p-0">
                    <div className="aspect-video bg-gradient-to-br from-secondary to-muted overflow-hidden">
                      <Image
                        src={feature.image}
                        alt={feature.title}
                        width={600}
                        height={400}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </CardContent>
                </Card>
                {/* Decorative elements */}
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
                <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-accent/10 blur-2xl" />
              </div>
            </div>
          ))}
        </div>

        {/* Additional Features */}
        <div className="mt-32">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground">
              And much more
            </h2>
            <p className="text-lg text-muted-foreground">
              Additional features to enhance your learning experience
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {additionalFeatures.map((feature) => (
              <Card key={feature.title} className="border-border bg-card overflow-hidden">
                <CardContent className="p-0">
                  {/* Image */}
                  <div className="aspect-video bg-gradient-to-br from-secondary to-muted overflow-hidden">
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      width={300}
                      height={200}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  {/* Text */}
                  <div className="p-4 text-center">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="mb-1 font-semibold text-foreground text-sm">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-24 text-center">
          <h2 className="mb-4 text-2xl font-bold text-foreground">
            Ready to transform your learning?
          </h2>
          <p className="mb-8 text-muted-foreground">
            Start your free trial today and experience the future of studying.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground">
              <Link href="/register">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
