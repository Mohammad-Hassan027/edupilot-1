"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { GraduationCap, Mail, Lock, Eye, EyeOff, User, AlertCircle, Check, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { captureReferralCode, getStoredReferralCode, clearStoredReferralCode } from "@/lib/referral-client"

function PasswordStrengthBar({ password }: { password: string }) {
  const checks = {
    length:    password.length >= 8,
    upper:     /[A-Z]/.test(password),
    number:    /[0-9]/.test(password),
    special:   /[!@#$%^&*]/.test(password),
  }
  const score = Object.values(checks).filter(Boolean).length
  const colors = ["bg-destructive","bg-destructive","bg-amber-500","bg-amber-400","bg-emerald-500"]
  const labels = ["","Too weak","Weak","Fair","Strong"]
  if (!password) return null
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[0,1,2,3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? colors[score] : "bg-muted"}`} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Strength: <span className={score >= 3 ? "text-emerald-500 font-medium" : score >= 2 ? "text-amber-500 font-medium" : "text-destructive font-medium"}>{labels[score]}</span>
        {" · "}8+ chars, uppercase, number, special char
      </p>
    </div>
  )
}

export default function RegisterPage() {
  const router  = useRouter()
  const [fullName, setFullName]           = useState("")
  const [email, setEmail]                 = useState("")
  const [password, setPassword]           = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPw, setShowPw]               = useState(false)
  const [showCpw, setShowCpw]             = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const [isLoading, setIsLoading]         = useState(false)
  const [referralCode, setReferralCode]   = useState<string | null>(null)

  useEffect(() => {
    captureReferralCode()
    setReferralCode(getStoredReferralCode())
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirmPassword) { setError("Passwords do not match."); return }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return }

    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: fullName, referral_code: referralCode }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Registration failed."); return }

      clearStoredReferralCode()

      if (data.autoLogin) {
        router.push("/dashboard")
        router.refresh()
      } else {
        router.push("/login")
      }
    } catch {
      setError("Network error. Please check your connection.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary/5 relative overflow-hidden items-center justify-center p-12">
        <div className="relative z-10 max-w-md">
          <Link href="/" className="flex items-center gap-3 mb-8 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary transition-opacity group-hover:opacity-80">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold">Edu</span>
              <span className="text-2xl font-bold text-primary">Pilot</span>
            </div>
          </Link>
          <h1 className="text-4xl font-bold mb-4">Start your learning journey today</h1>
          <p className="text-lg text-muted-foreground mb-8">Join thousands of students who have transformed their study habits with EduPilot.</p>
          <ul className="space-y-3">
            {["AI-powered study assistant","Smart flashcard generation","Personalized study plans","Progress analytics"].map(f => (
              <li key={f} className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
                  <Check className="h-3.5 w-3.5 text-primary" />
                </div>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Edu<span className="text-primary">Pilot</span></span>
          </Link>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Create your account</h2>
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /><span>{error}</span>
            </div>
          )}

          {referralCode && (
            <div data-testid="referral-banner" className="mb-4 flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-primary">
              <Gift className="h-4 w-4 mt-0.5 shrink-0" />
              <span>You were invited by a friend! Sign up now and you&apos;ll both get bonus credits.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="text" placeholder="Your full name" className="pl-10" value={fullName}
                  onChange={(e) => setFullName(e.target.value)} disabled={isLoading} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="email" placeholder="name@example.com" className="pl-10" required value={email}
                  onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type={showPw ? "text" : "password"} placeholder="Create a strong password" className="pl-10 pr-10" required value={password}
                  onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <PasswordStrengthBar password={password} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type={showCpw ? "text" : "password"} placeholder="Repeat password" className="pl-10 pr-10" required value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} disabled={isLoading} />
                <button type="button" onClick={() => setShowCpw(!showCpw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showCpw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
            </div>
            <div className="flex items-start gap-2">
              <Checkbox id="terms" required className="mt-0.5" />
              <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                I agree to the{" "}
                <Link href="/terms-of-service" className="text-primary hover:underline">Terms of Service</Link>{" "}
                and{" "}
                <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>
              </label>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            <Button type="button" variant="outline" className="w-full gap-3" disabled={isLoading}
              onClick={() => window.location.href = "/api/auth/google"}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
