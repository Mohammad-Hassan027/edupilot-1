"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Camera, Save, User, Mail, Clock, BookOpen, Trophy,
  X, Trash2, Loader2, CalendarDays, Edit2, CheckCircle
} from "lucide-react"
import { useUser } from "@/hooks/use-user"

export default function ProfilePage() {
  const { profile, email, credits, subscription, isLoading, refetch } = useUser()

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [statusMsg, setStatusMsg] = useState("")

  const [fullName, setFullName] = useState("")
  const [bio, setBio] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Populate fields when data loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "")
      setBio(profile.bio || "")
    }
  }, [profile])

  const displayName = profile?.full_name || email?.split("@")[0] || "User"
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
  const avatarSrc = profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`

  const currentPlanName = subscription?.plan_id === "premium" ? "Premium" : subscription?.plan_id === "pro" ? "Pro" : "Free"
  const planLabel = subscription?.trial_active
    ? `${currentPlanName} Trial Active`
    : subscription?.status === "active"
      ? `${currentPlanName} Member`
      : "Free Member"

  const totalCreditsUsed = (credits?.ai_chat_used ?? 0) + (credits?.flashcards_used ?? 0) + (credits?.study_plan_used ?? 0)

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
    : "—"

  const handleSave = async () => {
    if (!fullName.trim()) {
      setStatus("error")
      setStatusMsg("Full name is required.")
      return
    }
    setIsSaving(true)
    setStatus("idle")
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName.trim(), bio: bio.trim() }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || "Failed to save profile")
      }
      setStatus("success")
      setStatusMsg("Profile updated successfully!")
      setIsEditing(false)
      refetch()
      setTimeout(() => setStatus("idle"), 3000)
    } catch (err) {
      setStatus("error")
      setStatusMsg(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFullName(profile?.full_name || "")
    setBio(profile?.bio || "")
    setStatus("idle")
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setStatus("error")
      setStatusMsg("Image must be under 2MB.")
      return
    }
    // Convert to base64 data URL and save as avatar_url
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      try {
        await fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatar_url: dataUrl }),
        })
        refetch()
        setStatus("success")
        setStatusMsg("Photo updated!")
        setTimeout(() => setStatus("idle"), 2000)
      } catch {
        setStatus("error")
        setStatusMsg("Failed to upload photo.")
      }
    }
    reader.readAsDataURL(file)
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="lg:col-span-2 h-64 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Status alert */}
      {status !== "idle" && (
        <Alert className={status === "success" ? "border-emerald-500/30 bg-emerald-500/10" : "border-destructive/30 bg-destructive/10"}>
          <CheckCircle className={`h-4 w-4 ${status === "success" ? "text-emerald-500" : "text-destructive"}`} />
          <AlertDescription className={status === "success" ? "text-emerald-600" : "text-destructive"}>{statusMsg}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your personal information</p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" className="gap-2" onClick={handleCancel} disabled={isSaving}>
                <X className="h-4 w-4" />Cancel
              </Button>
              <Button className="gap-2" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving...</> : <><Save className="h-4 w-4" />Save Changes</>}
              </Button>
            </>
          ) : (
            <Button variant="outline" className="gap-2" onClick={() => setIsEditing(true)}>
              <Edit2 className="h-4 w-4" />Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Avatar Card */}
        <Card className="border-border bg-card">
          <CardContent className="p-6 flex flex-col items-center gap-4 text-center">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarSrc} alt={displayName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">{initials}</AvatarFallback>
              </Avatar>
              {isEditing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 transition-opacity"
                >
                  <Camera className="h-4 w-4" />
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoUpload} />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-foreground">{displayName}</h2>
              <p className="text-sm text-muted-foreground">{email}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{planLabel}</p>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Trophy className="h-3 w-3" />{totalCreditsUsed} Actions
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" />
                {subscription?.trial_active ? `${currentPlanName} Trial` : subscription?.status === "active" ? currentPlanName : "Free"}
              </Badge>
            </div>

            <div className="text-xs text-muted-foreground flex items-center gap-1 pt-2 border-t border-border w-full justify-center">
              <CalendarDays className="h-3 w-3" />Member since {memberSince}
            </div>

            {isEditing && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive gap-1.5 w-full"
                onClick={() => {
                  fetch("/api/user/profile", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ avatar_url: null }),
                  }).then(() => refetch())
                }}
              >
                <Trash2 className="h-4 w-4" />Remove Photo
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="lg:col-span-2 border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name <span className="text-destructive">*</span></Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={!isEditing}
                className="bg-secondary border-border disabled:opacity-100"
                placeholder="Your full name"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />Email
              </Label>
              <Input
                type="email"
                value={email ?? ""}
                disabled
                className="bg-secondary/50 border-border opacity-60"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={!isEditing}
                className="bg-secondary border-border disabled:opacity-100 min-h-[80px] resize-none"
                placeholder="Tell us a bit about yourself..."
                maxLength={300}
              />
              {isEditing && <p className="text-xs text-muted-foreground text-right">{bio.length}/300</p>}
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card className="lg:col-span-3 border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />Learning Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "AI Chats Used", value: credits?.ai_chat_used ?? 0, icon: "💬" },
                { label: "Flashcard Sessions", value: credits?.flashcards_used ?? 0, icon: "🃏" },
                { label: "Study Plans", value: credits?.study_plan_used ?? 0, icon: "📋" },
                { label: "Plan Status", value: planLabel, icon: "⭐" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-border bg-secondary/50 p-4 text-center">
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <p className="text-lg font-bold text-foreground">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
