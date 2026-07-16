"use client"

import { useEffect } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { captureReferralCode } from "@/lib/referral-client"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Capture ?ref=CODE on any auth page (login/register/forgot-password) so a
  // referral code survives even if the user doesn't land on /register first.
  useEffect(() => {
    captureReferralCode()
  }, [])

  return (
    <div className="relative min-h-screen bg-background">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      {children}
    </div>
  )
}
