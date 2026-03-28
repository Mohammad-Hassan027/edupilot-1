// "use client"

// import { useState } from "react"
// import Link from "next/link"
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Switch } from "@/components/ui/switch"
// import { Separator } from "@/components/ui/separator"
// import { UserAvatar } from "@/components/user-avatar"
// import { Alert, AlertDescription } from "@/components/ui/alert"
// import {
//   Sun, Moon, Bell, Lock, Trash2, Shield, Mail, Smartphone,
//   Volume2, ChevronRight, User, CheckCircle, AlertCircle, Loader2, Eye, EyeOff
// } from "lucide-react"
// import { useTheme } from "next-themes"
// import { useUser } from "@/hooks/use-user"

// export default function SettingsPage() {
//   const { theme, setTheme } = useTheme()
//   const { profile, email, subscription, isLoading } = useUser()

//   const [notifications, setNotifications] = useState({
//     email: true,
//     push: false,
//     studyReminders: true,
//     weeklyReport: false,
//     sound: true,
//   })

//   // Password change
//   const [currentPassword, setCurrentPassword] = useState("")
//   const [newPassword, setNewPassword] = useState("")
//   const [confirmPassword, setConfirmPassword] = useState("")
//   const [showCurrent, setShowCurrent] = useState(false)
//   const [showNew, setShowNew] = useState(false)
//   const [pwdLoading, setPwdLoading] = useState(false)
//   const [pwdStatus, setPwdStatus] = useState<"idle" | "success" | "error">("idle")
//   const [pwdError, setPwdError] = useState("")

//   // Delete account
//   const [deleteConfirm, setDeleteConfirm] = useState("")
//   const [deleteLoading, setDeleteLoading] = useState(false)

//   const displayName = profile?.full_name || email?.split("@")[0] || "User"
//   const currentPlanName = subscription?.plan_id === "premium" ? "Premium" : subscription?.plan_id === "pro" ? "Pro" : "Free"
//   const planLabel = subscription?.trial_active ? `${currentPlanName} Trial Active` :
//     subscription?.status === "active" ? `${currentPlanName} Plan` : "Free Plan"

//   const handlePasswordChange = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setPwdError("")
//     if (newPassword !== confirmPassword) {
//       setPwdError("New passwords do not match.")
//       return
//     }
//     if (newPassword.length < 8) {
//       setPwdError("New password must be at least 8 characters.")
//       return
//     }
//     setPwdLoading(true)
//     try {
//       const res = await fetch("/api/auth/change-password", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ currentPassword, newPassword }),
//       })
//       const data = await res.json()
//       if (!res.ok) {
//         setPwdError(data.error || "Failed to update password.")
//         setPwdStatus("error")
//         return
//       }
//       setPwdStatus("success")
//       setCurrentPassword("")
//       setNewPassword("")
//       setConfirmPassword("")
//       setTimeout(() => setPwdStatus("idle"), 3000)
//     } catch {
//       setPwdError("Network error. Please try again.")
//       setPwdStatus("error")
//     } finally {
//       setPwdLoading(false)
//     }
//   }

//   const handleDeleteAccount = async () => {
//     if (deleteConfirm !== "DELETE") return
//     setDeleteLoading(true)
//     try {
//       await fetch("/api/auth/delete-account", { method: "DELETE" })
//       window.location.href = "/"
//     } catch {
//       setDeleteLoading(false)
//     }
//   }

//   return (
//     <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
//       <div>
//         <h1 className="text-2xl font-bold text-foreground">Settings</h1>
//         <p className="text-muted-foreground">Manage your account settings and preferences</p>
//       </div>

//       {/* Profile Card - real data */}
//       <Card className="border-border bg-card">
//         <CardContent className="p-6">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-4">
//               {isLoading ? (
//                 <div className="h-14 w-14 rounded-full bg-secondary animate-pulse" />
//               ) : (
//                 <UserAvatar src={profile?.avatar_url} alt={displayName} className="h-14 w-14" iconClassName="h-9 w-9" />
//               )}
//               <div>
//                 <h3 className="font-semibold text-foreground">{isLoading ? "Loading..." : displayName}</h3>
//                 <p className="text-sm text-muted-foreground">{isLoading ? "" : email}</p>
//                 <p className="text-xs text-muted-foreground mt-0.5">{planLabel}</p>
//               </div>
//             </div>
//             <Button asChild variant="outline" className="gap-2">
//               <Link href="/profile">
//                 <User className="h-4 w-4" />
//                 Update Profile
//                 <ChevronRight className="h-4 w-4" />
//               </Link>
//             </Button>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Appearance */}
//       <Card className="border-border bg-card">
//         <CardHeader>
//           <CardTitle className="text-base">Appearance</CardTitle>
//           <CardDescription>Customize how EduPilot looks on your device</CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <div className="flex items-center justify-between">
//             <div className="space-y-0.5">
//               <Label>Theme</Label>
//               <p className="text-sm text-muted-foreground">Select your preferred theme</p>
//             </div>
//             <div className="flex gap-2">
//               <Button variant={theme === "light" ? "default" : "outline"} size="sm" className="gap-2" onClick={() => setTheme("light")}>
//                 <Sun className="h-4 w-4" />Light
//               </Button>
//               <Button variant={theme === "dark" ? "default" : "outline"} size="sm" className="gap-2" onClick={() => setTheme("dark")}>
//                 <Moon className="h-4 w-4" />Dark
//               </Button>

//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Notifications */}
//       <Card className="border-border bg-card">
//         <CardHeader>
//           <CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4 text-primary" />Notifications</CardTitle>
//           <CardDescription>Configure how you receive notifications</CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           {[
//             { key: "email", icon: Mail, label: "Email Notifications", desc: "Receive updates via email" },
//             { key: "push", icon: Smartphone, label: "Push Notifications", desc: "Receive push notifications" },
//             { key: "studyReminders", icon: Bell, label: "Study Reminders", desc: "Get reminded about scheduled sessions" },
//             { key: "weeklyReport", icon: Bell, label: "Weekly Report", desc: "Receive weekly progress summary" },
//             { key: "sound", icon: Volume2, label: "Sound Effects", desc: "Play sounds for notifications and timer" },
//           ].map((item, i) => (
//             <div key={item.key}>
//               {i > 0 && <Separator className="mb-4" />}
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-3">
//                   <item.icon className="h-4 w-4 text-muted-foreground" />
//                   <div className="space-y-0.5">
//                     <Label>{item.label}</Label>
//                     <p className="text-sm text-muted-foreground">{item.desc}</p>
//                   </div>
//                 </div>
//                 <Switch
//                   checked={notifications[item.key as keyof typeof notifications]}
//                   onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
//                 />
//               </div>
//             </div>
//           ))}
//         </CardContent>
//       </Card>

//       {/* Security - working password change */}
//       <Card className="border-border bg-card">
//         <CardHeader>
//           <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-primary" />Security</CardTitle>
//           <CardDescription>Manage your account security settings</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handlePasswordChange} className="space-y-3">
//             <Label>Change Password</Label>
//             <div className="relative">
//               <Input type={showCurrent ? "text" : "password"} placeholder="Current password" className="bg-secondary border-border pr-10"
//                 value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
//               <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
//                 {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
//               </button>
//             </div>
//             <div className="relative">
//               <Input type={showNew ? "text" : "password"} placeholder="New password (min 8 chars)" className="bg-secondary border-border pr-10"
//                 value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
//               <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
//                 {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
//               </button>
//             </div>
//             <Input type="password" placeholder="Confirm new password" className="bg-secondary border-border"
//               value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
//             {confirmPassword && newPassword !== confirmPassword && (
//               <p className="text-xs text-destructive">Passwords do not match</p>
//             )}
//             {pwdStatus === "success" && (
//               <Alert className="border-emerald-500/30 bg-emerald-500/10">
//                 <CheckCircle className="h-4 w-4 text-emerald-500" />
//                 <AlertDescription className="text-emerald-600">Password updated successfully!</AlertDescription>
//               </Alert>
//             )}
//             {pwdStatus === "error" && pwdError && (
//               <Alert className="border-destructive/30 bg-destructive/10">
//                 <AlertCircle className="h-4 w-4 text-destructive" />
//                 <AlertDescription className="text-destructive">{pwdError}</AlertDescription>
//               </Alert>
//             )}
//             <Button type="submit" className="gap-2" disabled={pwdLoading || newPassword !== confirmPassword}>
//               {pwdLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Updating...</> : <><Lock className="h-4 w-4" />Update Password</>}
//             </Button>
//           </form>
//         </CardContent>
//       </Card>

//       {/* Danger Zone */}
//       <Card className="border-destructive/50 bg-card">
//         <CardHeader>
//           <CardTitle className="text-base text-destructive flex items-center gap-2"><Trash2 className="h-4 w-4" />Danger Zone</CardTitle>
//           <CardDescription>Irreversible and destructive actions</CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <div className="flex flex-col gap-4 p-4 rounded-lg border border-destructive/20 bg-destructive/5">
//             <div>
//               <p className="font-medium text-foreground">Delete Account</p>
//               <p className="text-sm text-muted-foreground">Permanently delete your account and all data. Type <strong>DELETE</strong> to confirm.</p>
//             </div>
//             <div className="flex gap-2">
//               <Input placeholder='Type "DELETE" to confirm' value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} className="bg-secondary border-border" />
//               <Button variant="destructive" className="gap-2 shrink-0" disabled={deleteConfirm !== "DELETE" || deleteLoading} onClick={handleDeleteAccount}>
//                 {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
//                 Delete
//               </Button>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }
"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserAvatar } from "@/components/user-avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Sun,
  Moon,
  Lock,
  Trash2,
  Shield,
  ChevronRight,
  User,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useUser } from "@/hooks/use-user"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { profile, email, subscription, isLoading } = useUser()

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdStatus, setPwdStatus] = useState<"idle" | "success" | "error">("idle")
  const [pwdError, setPwdError] = useState("")

  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState("")
  const [showDeletePopup, setShowDeletePopup] = useState(false)

  const displayName = profile?.full_name || email?.split("@")[0] || "User"
  const currentPlanName =
    subscription?.plan_id === "premium"
      ? "Premium"
      : subscription?.plan_id === "pro"
        ? "Pro"
        : "Free"

  const planLabel = subscription?.trial_active
    ? `${currentPlanName} Trial Active`
    : subscription?.status === "active"
      ? `${currentPlanName} Plan`
      : "Free Plan"

  const canSubmitPassword =
    currentPassword.trim().length > 0 &&
    newPassword.trim().length >= 8 &&
    confirmPassword.trim().length > 0 &&
    newPassword === confirmPassword

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwdError("")
    setPwdStatus("idle")

    if (newPassword !== confirmPassword) {
      setPwdError("New passwords do not match.")
      setPwdStatus("error")
      return
    }

    if (newPassword.length < 8) {
      setPwdError("New password must be at least 8 characters.")
      setPwdStatus("error")
      return
    }

    if (currentPassword === newPassword) {
      setPwdError("New password must be different from current password.")
      setPwdStatus("error")
      return
    }

    setPwdLoading(true)

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setPwdError(data.error || "Failed to update password.")
        setPwdStatus("error")
        return
      }

      setPwdStatus("success")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

      setTimeout(() => {
        window.location.href = "/login"
      }, 1200)
    } catch {
      setPwdError("Network error. Please try again.")
      setPwdStatus("error")
    } finally {
      setPwdLoading(false)
    }
  }

  const handleDeleteAccountClick = () => {
    setDeleteError("")

    if (deleteConfirm.trim().toLowerCase() !== "delete") {
      setDeleteError('Please type "delete" to continue.')
      return
    }

    setShowDeletePopup(true)
  }

  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    setDeleteError("")

    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "DELETE",
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setDeleteError(data.error || "Failed to delete account.")
        setDeleteLoading(false)
        setShowDeletePopup(false)
        return
      }

      window.location.href = "/login"
    } catch {
      setDeleteError("Network error. Please try again.")
      setDeleteLoading(false)
      setShowDeletePopup(false)
    }
  }

  return (
    <>
      <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                {isLoading ? (
                  <div className="h-14 w-14 rounded-full bg-secondary animate-pulse" />
                ) : (
                  <UserAvatar
                    src={profile?.avatar_url}
                    alt={displayName}
                    className="h-14 w-14"
                    iconClassName="h-9 w-9"
                  />
                )}

                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground">
                    {isLoading ? "Loading..." : displayName}
                  </h3>
                  <p className="text-sm text-muted-foreground break-all">{isLoading ? "" : email}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{planLabel}</p>
                </div>
              </div>

              <Button asChild variant="outline" className="gap-2 shrink-0">
                <Link href="/profile">
                  <User className="h-4 w-4" />
                  Update Profile
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Appearance</CardTitle>
            <CardDescription>Customize how EduPilot looks on your device</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Theme</Label>
                <p className="text-sm text-muted-foreground">Select your preferred theme</p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  size="sm"
                  className="gap-2"
                  onClick={() => setTheme("light")}
                >
                  <Sun className="h-4 w-4" />
                  Light
                </Button>

                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  size="sm"
                  className="gap-2"
                  onClick={() => setTheme("dark")}
                >
                  <Moon className="h-4 w-4" />
                  Dark
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Security
            </CardTitle>
            <CardDescription>Manage your account security settings</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-3">
              <Label>Change Password</Label>

              <div className="relative">
                <Input
                  type={showCurrent ? "text" : "password"}
                  placeholder="Current password"
                  className="bg-secondary border-border pr-10"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  placeholder="New password (min 8 chars)"
                  className="bg-secondary border-border pr-10"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm new password"
                  className="bg-secondary border-border pr-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}

              {pwdStatus === "success" && (
                <Alert className="border-emerald-500/30 bg-emerald-500/10">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <AlertDescription className="text-emerald-600">
                    Password updated successfully. Redirecting to login...
                  </AlertDescription>
                </Alert>
              )}

              {pwdStatus === "error" && pwdError && (
                <Alert className="border-destructive/30 bg-destructive/10">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive">{pwdError}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="gap-2" disabled={pwdLoading || !canSubmitPassword}>
                {pwdLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Update Password
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-destructive/50 bg-card">
          <CardHeader>
            <CardTitle className="text-base text-destructive flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Danger Zone
            </CardTitle>
            <CardDescription>Irreversible and destructive actions</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 p-4 rounded-lg border border-destructive/20 bg-destructive/5">
              <div>
                <p className="font-medium text-foreground">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data. Type <strong>delete</strong> to confirm.
                </p>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder='Type "delete" to confirm'
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  className="bg-secondary border-border"
                />
                <Button
                  variant="destructive"
                  className="gap-2 shrink-0"
                  disabled={deleteLoading}
                  onClick={handleDeleteAccountClick}
                >
                  {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Delete
                </Button>
              </div>

              {deleteError ? (
                <p className="text-sm text-destructive">{deleteError}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showDeletePopup} onOpenChange={setShowDeletePopup}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is permanent. Your account and related data will be deleted from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>No</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void handleDeleteAccount()
              }}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Yes"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}