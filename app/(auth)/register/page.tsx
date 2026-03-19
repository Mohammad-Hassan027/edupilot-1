"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { GraduationCap, Mail, Lock, Eye, EyeOff, User, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { validatePassword } from "@/lib/auth"

const features = [
  "AI-powered study assistant",
  "Smart flashcard generation",
  "Personalized study plans",
  "Progress analytics",
]

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const strength = password ? validatePassword(password) : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    if (strength && strength.score < 3) {
      const missing = Object.entries(strength.checks)
        .filter(([, v]) => !v)
        .map(([k]) => k.replace(/([A-Z])/g, " $1").toLowerCase())
      setError(`Password too weak. Missing: ${missing.join(", ")}`)
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: fullName }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Registration failed.")
        return
      }

      setSuccess(true)
    } catch {
      setError("Network error. Please check your connection.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = () => {
    window.location.href = "/api/auth/google"
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <Check className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Account created!</h2>
          <p className="text-muted-foreground">
            We&apos;ve sent a verification email to <strong>{email}</strong>. Please verify your email to get started.
          </p>
          <Button asChild className="w-full mt-4">
            <Link href="/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-primary/5 relative overflow-hidden items-center justify-center p-12">
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold text-foreground">Edu</span>
              <span className="text-2xl font-bold text-primary">Pilot</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Start your learning journey today</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of students who have transformed their study habits with EduPilot.
          </p>
          <ul className="space-y-4">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
                  <Check className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold text-foreground">Edu</span>
              <span className="text-xl font-bold text-primary">Pilot</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Create your account</h2>
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-foreground">Full name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="name" type="text" placeholder="Your full name" className="pl-10" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={isLoading} />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="name@example.com" className="pl-10" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Create a strong password" className="pl-10 pr-10" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Password strength indicator */}
              {strength && (
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {[0,1,2,3].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < strength.score ? strength.color : "bg-muted"}`} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Strength: <span className={`font-medium ${strength.score >= 3 ? "text-emerald-500" : strength.score >= 2 ? "text-yellow-500" : "text-red-500"}`}>{strength.label}</span>
                    {" · "}Must have 8+ chars, uppercase, number, special char
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" className="pl-10 pr-10" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isLoading} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button type="button" variant="outline" className="w-full gap-2" onClick={handleGoogleSignup} disabled={isLoading}>
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
