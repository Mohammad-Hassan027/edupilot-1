"use client"

import Link from "next/link"
import { Home, LayoutDashboard, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-1/4 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-[300px] w-[300px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>

        {/* 404 Number */}
        <div className="mb-6">
          <span className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            404
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
          Page not found
        </h1>

        {/* Description */}
        <p className="text-muted-foreground mb-8">
          The page you are looking for does not exist. It might have been moved or deleted.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild className="w-full sm:w-auto gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full sm:w-auto gap-2">
            <Link href="/dashboard">
              <LayoutDashboard className="h-4 w-4" />
              Go Dashboard
            </Link>
          </Button>
        </div>

        {/* Back Link */}
        <div className="mt-8">
          <button
            onClick={() => typeof window !== "undefined" && window.history.back()}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Go back to previous page
          </button>
        </div>
      </div>
    </div>
  )
}
