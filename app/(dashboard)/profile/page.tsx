"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserAvatar } from "@/components/user-avatar"
import { Camera, Save, User, Mail, X, Trash2, Loader2, Edit2, CheckCircle } from "lucide-react"
import { useUser } from "@/hooks/use-user"
import type { Profile } from "@/types"

export default function ProfilePage() {
  const { profile, email, isLoading, refetch, setUserState, fullName: userFullName } = useUser()

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [statusMsg, setStatusMsg] = useState("")
  const [fullName, setFullName] = useState("")
  const [bio, setBio] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setFullName(profile?.full_name || userFullName || "")
    setBio(profile?.bio || "")
    setAvatarUrl(profile?.avatar_url || null)
  }, [profile?.full_name, profile?.bio, profile?.avatar_url, userFullName])

  const displayName = fullName || profile?.full_name || userFullName || email?.split("@")[0] || "User"

  const hasUnsavedChanges =
    isEditing &&
    (fullName !== (profile?.full_name || userFullName || "") ||
      bio !== (profile?.bio || ""))

  const updateProfileState = (updates: Record<string, unknown>) => {
    setUserState((prev) => ({
      ...prev,
      authName: typeof updates.full_name === "string" ? updates.full_name : prev.authName,
      profile: prev.profile
        ? { ...prev.profile, ...updates, updated_at: new Date().toISOString() }
        : ({
            id: "temp-profile",
            user_id: "",
            full_name:
              typeof updates.full_name === "string"
                ? updates.full_name
                : fullName || userFullName || null,
            avatar_url:
              Object.prototype.hasOwnProperty.call(updates, "avatar_url")
                ? (updates.avatar_url as string | null)
                : avatarUrl,
            bio:
              Object.prototype.hasOwnProperty.call(updates, "bio")
                ? (updates.bio as string | null)
                : bio || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Profile),
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

      const nextName = data.data?.full_name ?? fullName.trim()
      const nextBio = data.data?.bio ?? (bio.trim() || null)

      updateProfileState({
        full_name: nextName,
        bio: nextBio,
      })

      setFullName(nextName)
      setBio(nextBio || "")
      setIsEditing(false)
      showMessage("success", "Profile updated successfully.")
      await refetch(true, true)
      window.dispatchEvent(new CustomEvent("user-data-refresh", { detail: { authName: nextName } }))
    } catch (err) {
      setStatus("error")
      setStatusMsg(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFullName(profile?.full_name || userFullName || "")
    setBio(profile?.bio || "")
    setAvatarUrl(profile?.avatar_url || null)
    setStatus("idle")
  }

  const updatePhoto = async (nextAvatarUrl: string | null, successMessage: string) => {
    const previousAvatarUrl = avatarUrl

    setAvatarUrl(nextAvatarUrl)
    updateProfileState({ avatar_url: nextAvatarUrl })

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: nextAvatarUrl }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to update photo")
      }

      const finalAvatarUrl =
        Object.prototype.hasOwnProperty.call(data.data ?? {}, "avatar_url")
          ? (data.data.avatar_url as string | null)
          : nextAvatarUrl

      setAvatarUrl(finalAvatarUrl)
      updateProfileState({ avatar_url: finalAvatarUrl })

      showMessage("success", successMessage, 2000)
      await refetch(true, true)
    } catch (err) {
      setAvatarUrl(previousAvatarUrl)
      updateProfileState({ avatar_url: previousAvatarUrl })
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
          <AlertDescription className={status === "success" ? "text-emerald-600" : "text-destructive"}>
            {statusMsg}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account details and photo.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasUnsavedChanges ? <Badge variant="secondary">Unsaved changes</Badge> : null}
          {isEditing ? (
            <>
              <Button variant="outline" className="gap-2" onClick={handleCancel} disabled={isSaving}>
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button className="gap-2" onClick={handleSave} disabled={isSaving || !hasUnsavedChanges}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button variant="outline" className="gap-2" onClick={() => setIsEditing(true)}>
              <Edit2 className="h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
            <div className="relative">
              <UserAvatar
                src={avatarUrl}
                alt={displayName}
                className="h-28 w-28 border border-border"
                iconClassName="h-16 w-16"
              />

              {isEditing && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-opacity hover:opacity-90"
                >
                  <Camera className="h-4 w-4" />
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-foreground">{displayName}</h2>
              <p className="break-all text-sm text-muted-foreground">{email}</p>
            </div>

            {isEditing && avatarUrl ? (
              <Button
                variant="ghost"
                size="sm"
                className="w-full gap-1.5 text-destructive hover:text-destructive"
                onClick={() => updatePhoto(null, "Profile photo removed.")}
              >
                <Trash2 className="h-4 w-4" />
                Remove Photo
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-border bg-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-primary" />
              Personal Information
            </CardTitle>
            <CardDescription>Your existing profile data is loaded here automatically.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>
                Full Name <span className="text-destructive">*</span>
              </Label>
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
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Email
              </Label>
              <Input
                type="email"
                value={email ?? ""}
                disabled
                className="border-border bg-secondary/50 opacity-70"
              />
              <p className="text-xs text-muted-foreground">
                Email is managed by authentication and cannot be changed here.
              </p>
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
      </div>
    </div>
  )
}