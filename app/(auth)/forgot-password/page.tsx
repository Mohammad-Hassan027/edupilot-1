"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { GraduationCap, Mail, ArrowLeft, CheckCircle, Lock, Eye, EyeOff, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Step = "email" | "otp" | "newPassword" | "success"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep]         = useState<Step>("email")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]       = useState("")
  const [email, setEmail]       = useState("")
  const [otp, setOtp]           = useState("")
  const [newPassword, setNewPassword]         = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword]       = useState(false)
  const [showConfirm, setShowConfirm]         = useState(false)
  // We keep verified email for the reset step
  const [verifiedEmail, setVerifiedEmail]     = useState("")

  // ── Step 1: Send OTP ────────────────────────────────────────────────────────
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    try {
      const res  = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to send code. Please try again.")
        return
      }
      setStep("otp")
    } catch {
      setError("Network error. Please check your connection.")
    } finally {
      setIsLoading(false)
    }
  }

  // ── Step 2: Verify OTP ─────────────────────────────────────────────────────
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) { setError("Please enter the complete 6-digit code."); return }
    setIsLoading(true)
    setError("")
    try {
      const res  = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), token: otp }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Invalid code. Please try again.")
        return
      }
      setVerifiedEmail(data.email || email.trim())
      setStep("newPassword")
    } catch {
      setError("Network error. Please check your connection.")
    } finally {
      setIsLoading(false)
    }
  }

  // ── Step 3: Set new password ────────────────────────────────────────────────
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return }
    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return }
    setIsLoading(true)
    try {
      const res  = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Pass email so the server can update the right user
        body: JSON.stringify({ password: newPassword, email: verifiedEmail }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to reset password.")
        return
      }
      setStep("success")
    } catch {
      setError("Network error. Please check your connection.")
    } finally {
      setIsLoading(false)
    }
  }

  const stepIndex = { email: 0, otp: 1, newPassword: 2, success: 3 }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md">

        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-8 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary transition-opacity group-hover:opacity-80">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-2xl font-bold text-foreground">Edu</span>
            <span className="text-2xl font-bold text-primary">Pilot</span>
          </div>
        </Link>

        {/* Step indicator */}
        {step !== "success" && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {(["email", "otp", "newPassword"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  s === step                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                  stepIndex[step]  > i          ? "bg-emerald-500 text-white" :
                                                  "bg-secondary text-muted-foreground"
                }`}>
                  {stepIndex[step] > i ? "✓" : i + 1}
                </div>
                {i < 2 && (
                  <div className={`h-0.5 w-10 transition-colors ${stepIndex[step] > i ? "bg-emerald-500" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* ── STEP 1: Enter Email ──────────────────────────────────────────── */}
        {step === "email" && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-2">Reset your password</h1>
              <p className="text-sm text-muted-foreground">
                Enter your registered email address and we&apos;ll send you a 6-digit verification code.
              </p>
            </div>
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email" type="email" placeholder="name@example.com"
                    className="pl-9" value={email}
                    onChange={(e) => setEmail(e.target.value)} required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending code..." : "Send Verification Code"}
              </Button>
            </form>
          </>
        )}

        {/* ── STEP 2: Enter OTP ───────────────────────────────────────────── */}
        {step === "otp" && (
          <>
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Check your email</h1>
              <p className="text-sm text-muted-foreground">
                We sent a 6-digit code to{" "}
                <strong className="text-foreground">{email}</strong>.<br />
                Check your inbox (and spam folder).
              </p>
            </div>
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">6-Digit Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  placeholder="· · · · · ·"
                  className="text-center text-3xl tracking-[0.8em] font-mono h-14 bg-secondary border-border"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 6)
                    setOtp(val)
                    if (error) setError("")
                  }}
                  autoFocus
                  autoComplete="one-time-code"
                />
                <p className={`text-xs text-center transition-colors ${otp.length === 6 ? "text-emerald-500" : "text-muted-foreground"}`}>
                  {otp.length === 6 ? "✓ Code complete" : `${otp.length} / 6 digits entered`}
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
                {isLoading ? "Verifying..." : "Verify Code"}
              </Button>
              <button
                type="button"
                onClick={() => { setStep("email"); setOtp(""); setError("") }}
                className="w-full text-sm text-muted-foreground hover:text-foreground text-center transition-colors"
              >
                Didn&apos;t receive it? Go back and try again
              </button>
            </form>
          </>
        )}

        {/* ── STEP 3: New Password ─────────────────────────────────────────── */}
        {step === "newPassword" && (
          <>
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                <Lock className="h-8 w-8 text-emerald-500" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Create new password</h1>
              <p className="text-sm text-muted-foreground">Code verified! Choose a strong new password.</p>
            </div>
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPwd">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="newPwd" type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters" className="pl-9 pr-10"
                    value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    required minLength={8}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPwd">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPwd" type={showConfirm ? "text" : "password"}
                    placeholder="Repeat password" className="pl-9 pr-10"
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
              </div>
              <Button
                type="submit" className="w-full"
                disabled={isLoading || newPassword !== confirmPassword || newPassword.length < 8}
              >
                {isLoading ? "Updating password..." : "Set New Password"}
              </Button>
            </form>
          </>
        )}

        {/* ── STEP 4: Success ──────────────────────────────────────────────── */}
        {step === "success" && (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle className="h-10 w-10 text-emerald-500" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Password updated!</h1>
            <p className="text-muted-foreground mb-6 text-sm">
              Your password has been reset successfully.<br />
              You can now log in with your new password.
            </p>
            <Button className="w-full" onClick={() => router.push("/login")}>
              Go to Login
            </Button>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
