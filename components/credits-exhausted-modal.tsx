"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles, Zap } from "lucide-react"
import Link from "next/link"

interface CreditsExhaustedModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feature?: string
}

export function CreditsExhaustedModal({ open, onOpenChange, feature }: CreditsExhaustedModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border bg-card">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent">
            <Zap className="h-7 w-7 text-primary-foreground" />
          </div>
          <DialogTitle className="text-xl text-foreground">
            Free Credits Used
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            You have used your free {feature ?? "AI"} credits. Activate your 14-day trial to get unlimited access.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
          <p className="text-3xl font-bold text-primary">₹1</p>
          <p className="text-sm text-muted-foreground mt-1">One-time verification · Refunded instantly</p>
          <div className="mt-3 flex items-center justify-center gap-2 text-sm text-emerald-500">
            <Sparkles className="h-4 w-4" />
            14-day unlimited access
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground -mt-2 mb-2">
          🔒 Test payment mode · Use Razorpay test cards
        </p>

        <div className="flex flex-col gap-3">
          <Button asChild className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90">
            <Link href="/billing">Activate 14-day trial</Link>
          </Button>
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => onOpenChange(false)}>
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
