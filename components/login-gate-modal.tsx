"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle2, Sparkles } from "lucide-react"

interface LoginGateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  featureName?: string
}

const benefits = [
  "Save your learning progress",
  "Access all AI tools",
  "Track improvement over time",
  "Sync across devices",
]

export function LoginGateModal({ open, onOpenChange, featureName }: LoginGateModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border bg-card">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent">
            <Sparkles className="h-7 w-7 text-primary-foreground" />
          </div>
          <DialogTitle className="text-xl text-foreground">
            Unlock Full EduPilot Experience
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {featureName 
              ? `Sign in to access ${featureName} and unlock the full EduPilot experience.`
              : "Create a free account to:"}
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-3">
          {benefits.map((benefit) => (
            <div key={benefit} className="flex items-center gap-3 text-foreground">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
              <span className="text-sm">{benefit}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <Button asChild className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground">
            <Link href="/register">Sign up free</Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/login">Login</Link>
          </Button>
          <Button 
            variant="ghost" 
            className="w-full text-muted-foreground"
            onClick={() => onOpenChange(false)}
          >
            Continue as guest
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
