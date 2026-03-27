"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserAvatar } from "@/components/user-avatar"
import {
  Camera,
  Save,
  User,
  Mail,
  Clock,
  BookOpen,
  X,
  Trash2,
  Loader2,
  CalendarDays,
  Edit2,
  CheckCircle,
  Shield,
  ImagePlus,
} from "lucide-react"
import { useUser } from "@/hooks/use-user"

export default function ProfilePage() {
  const { profile, email, subscription, isLoading, refetch, setUserState } = useUser()

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [statusMsg, setStatusMsg] = useState("")
  const [fullName, setFullName] = useState("")
  const [bio, setBio] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setFullName(profile?.full_name || "")
    setBio(profile?.bio || "")
  }, [profile?.full_name, profile?.bio])

  const displayName = profile?.full_name || email?.split("@")[0] || "User"
  const hasUnsavedChanges = isEditing && (fullName !== (profile?.full_name || "") || bio !== (profile?.bio || ""))

  const currentPlanName = subscription?.plan_id === "premium" ? "Premium" : subscription?.plan_id === "pro" ? "Pro" : "Free"
  const membershipStatus = subscription?.trial_active
    ? `${currentPlanName} Trial`
    : subscription?.status === "active"
      ? `${currentPlanName} Active`
      : "Free"

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
    : "—"

  const profileCompleteness = useMemo(() => {
    let score = 0
    if (profile?.avatar_url) score += 34
    if (profile?.full_name) score += 33
    if (profile?.bio) score += 33
    return Math.min(score, 100)
  }, [profile?.avatar_url, profile?.bio, profile?.full_name])

  const updateProfileState = (updates: Record<string, unknown>) => {
    setUserState((prev) => ({
      ...prev,
      profile: prev.profile
        ? { ...prev.profile, ...updates, updated_at: new Date().toISOString() }
        : (prev.profile as typeof prev.profile),
    }))
  }

  const showMessage = (kind: "success" | "error", message: string, timeout = 3000) => {
    setStatus(kind)
    setStatusMsg(message)
    window.setTimeout(() => setStatus("idle"), timeout)
  }

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
        body: JSON.stringify({ full_name: fullName.trim(), bio: bio.trim() || null }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to save profile")
      }

      updateProfileState({
        full_name: data.data?.full_name ?? fullName.trim(),
        bio: data.data?.bio ?? (bio.trim() || null),
      })

      setIsEditing(false)
      showMessage("success", "Profile updated successfully.")
      await refetch(true, true)
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

  const updatePhoto = async (avatarUrl: string | null, successMessage: string) => {
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: avatarUrl }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to update photo")
      }

      updateProfileState({ avatar_url: data.data?.avatar_url ?? avatarUrl })
      showMessage("success", successMessage, 2000)
      await refetch(true, true)
    } catch (err) {
      setStatus("error")
      setStatusMsg(err instanceof Error ? err.message : "Failed to update photo.")
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setStatus("error")
      setStatusMsg("Please upload a valid image file.")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setStatus("error")
      setStatusMsg("Image must be under 2MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      await updatePhoto(dataUrl, "Profile photo updated.")
    }
    reader.readAsDataURL(file)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
        <Skeleton className="h-8 w-52" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl lg:col-span-2" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      {status !== "idle" && (
        <Alert className={status === "success" ? "border-emerald-500/30 bg-emerald-500/10" : "border-destructive/30 bg-destructive/10"}>
          <CheckCircle className={`h-4 w-4 ${status === "success" ? "text-emerald-500" : "text-destructive"}`} />
          <AlertDescription className={status === "success" ? "text-emerald-600" : "text-destructive"}>{statusMsg}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account details, photo, and membership info.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasUnsavedChanges ? <Badge variant="secondary">Unsaved changes</Badge> : null}
          {isEditing ? (
            <>
              <Button variant="outline" className="gap-2" onClick={handleCancel} disabled={isSaving}>
                <X className="h-4 w-4" />Cancel
              </Button>
              <Button className="gap-2" onClick={handleSave} disabled={isSaving || !hasUnsavedChanges}>
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
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
            <div className="relative">
              <UserAvatar src={profile?.avatar_url} alt={displayName} className="h-28 w-28 border border-border" iconClassName="h-16 w-16" />
              {isEditing && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-opacity hover:opacity-90"
                >
                  <Camera className="h-4 w-4" />
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoUpload} />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-foreground">{displayName}</h2>
              <p className="text-sm text-muted-foreground break-all">{email}</p>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" />
                {membershipStatus}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Shield className="h-3 w-3" />
                {profileCompleteness}% complete
              </Badge>
            </div>

            <div className="flex w-full items-center justify-center gap-1 border-t border-border pt-2 text-xs text-muted-foreground">
              <CalendarDays className="h-3 w-3" />Member since {memberSince}
            </div>

            <div className="w-full rounded-xl border border-border bg-secondary/40 p-3 text-left text-xs text-muted-foreground">
              <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
                <ImagePlus className="h-3.5 w-3.5 text-primary" />Profile image
              </div>
              All users now start with the same default profile icon. You can upload your own image anytime.
            </div>

            {isEditing && profile?.avatar_url ? (
              <Button
                variant="ghost"
                size="sm"
                className="w-full gap-1.5 text-destructive hover:text-destructive"
                onClick={() => updatePhoto(null, "Profile photo removed.")}
              >
                <Trash2 className="h-4 w-4" />Remove Photo
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-border bg-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-primary" />Personal Information
            </CardTitle>
            <CardDescription>Your account details are saved to your EduPilot profile.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name <span className="text-destructive">*</span></Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={!isEditing}
                className="border-border bg-secondary disabled:opacity-100"
                placeholder="Your full name"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />Email
              </Label>
              <Input type="email" value={email ?? ""} disabled className="border-border bg-secondary/50 opacity-70" />
              <p className="text-xs text-muted-foreground">Email is managed by authentication and cannot be changed here.</p>
            </div>

            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={!isEditing}
                className="min-h-[120px] resize-none border-border bg-secondary disabled:opacity-100"
                placeholder="Tell us a bit about yourself, your goals, or what you are learning..."
                maxLength={300}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>This helps personalize your learning experience later.</span>
                <span>{bio.length}/300</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4 text-primary" />Account Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { label: "Plan Status", value: membershipStatus, icon: "⭐" },
                { label: "Membership", value: currentPlanName, icon: "🛡️" },
                { label: "Member Since", value: memberSince, icon: "📅" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-border bg-secondary/50 p-4 text-center">
                  <div className="mb-1 text-2xl">{item.icon}</div>
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
