"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Sun,
  Moon,
  Bell,
  Lock,
  Trash2,
  Shield,
  Mail,
  Smartphone,
  Volume2,
  ChevronRight,
  User
} from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    studyReminders: true,
    weeklyReport: false,
    sound: true,
  })

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      {/* Profile Shortcut Card */}
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="Profile" />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">AM</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-foreground">Alex Morgan</h3>
                <p className="text-sm text-muted-foreground">alex@example.com</p>
                <p className="text-xs text-muted-foreground mt-0.5">Pro Plan Member</p>
              </div>
            </div>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/profile">
                <User className="h-4 w-4" />
                Update Profile
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
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

      {/* Notifications */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Notifications
          </CardTitle>
          <CardDescription>Configure how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive updates via email</p>
              </div>
            </div>
            <Switch
              checked={notifications.email}
              onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive push notifications</p>
              </div>
            </div>
            <Switch
              checked={notifications.push}
              onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label>Study Reminders</Label>
                <p className="text-sm text-muted-foreground">Get reminded about scheduled sessions</p>
              </div>
            </div>
            <Switch
              checked={notifications.studyReminders}
              onCheckedChange={(checked) => setNotifications({ ...notifications, studyReminders: checked })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label>Sound Effects</Label>
                <p className="text-sm text-muted-foreground">Play sounds for notifications and timer</p>
              </div>
            </div>
            <Switch
              checked={notifications.sound}
              onCheckedChange={(checked) => setNotifications({ ...notifications, sound: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Security
          </CardTitle>
          <CardDescription>Manage your account security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Change Password</Label>
            <div className="grid gap-3">
              <Input type="password" placeholder="Current password" className="bg-secondary border-border" />
              <Input type="password" placeholder="New password" className="bg-secondary border-border" />
              <Input type="password" placeholder="Confirm new password" className="bg-secondary border-border" />
            </div>
            <Button className="gap-2">
              <Lock className="h-4 w-4" />
              Update Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50 bg-card">
        <CardHeader>
          <CardTitle className="text-base text-destructive flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-destructive/20 bg-destructive/5">
            <div>
              <p className="font-medium text-foreground">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button variant="destructive" className="gap-2">
              <Trash2 className="h-4 w-4" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
