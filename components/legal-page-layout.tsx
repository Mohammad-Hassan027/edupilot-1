"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface Section {
  id: string
  title: string
}

interface LegalPageLayoutProps {
  title: string
  effectiveDate: string
  sections: Section[]
  children: React.ReactNode
}

export function LegalPageLayout({ title, effectiveDate, sections, children }: LegalPageLayoutProps) {
  const [activeSection, setActiveSection] = useState<string>("")

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { rootMargin: "-100px 0px -66% 0px" }
    )

    sections.forEach((section) => {
      const element = document.getElementById(section.id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [sections])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="flex gap-12">
          {/* Table of Contents - Desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24">
              <h3 className="mb-4 text-sm font-semibold text-foreground">On this page</h3>
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={cn(
                      "block w-full text-left text-sm py-1.5 px-3 rounded-md transition-colors",
                      activeSection === section.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 max-w-[900px]">
            <header className="mb-12">
              <h1 className="text-3xl font-bold text-foreground md:text-4xl">{title}</h1>
              <p className="mt-4 text-muted-foreground">
                Last updated: {effectiveDate}
              </p>
            </header>

            <div className="prose prose-slate dark:prose-invert max-w-none">
              {children}
            </div>

            {/* Contact Section */}
            <div className="mt-16 rounded-xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground">Questions?</h3>
              <p className="mt-2 text-muted-foreground">
                If you have any questions about this policy, please contact us at{" "}
                <a 
                  href="mailto:support@edupilot.ai" 
                  className="text-primary hover:underline"
                >
                  support@edupilot.ai
                </a>
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
