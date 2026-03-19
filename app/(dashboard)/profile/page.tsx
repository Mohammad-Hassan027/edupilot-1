"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  Camera,
  Save,
  User,
  Mail,
  Target,
  Clock,
  BookOpen,
  Trophy,
  Phone,
  X,
  Trash2,
  Loader2,
  CalendarDays
} from "lucide-react"

const learningGoals = [
  "Complete Calculus Course",
  "Master Organic Chemistry",
  "Improve Physics Grades",
]

const studyPreferences = ["Morning", "Afternoon", "Evening", "Night"]

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [profileImage, setProfileImage] = useState("https://api.dicebear.com/7.x/avataaars/svg?seed=Alex")
  const [showSuccess, setShowSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
    setIsEditing(false)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Reset any unsaved changes here
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert("File size must be less than 2MB")
        return
      }
      // Check file type
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        alert("Only JPG, PNG, and WEBP files are allowed")
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemovePhoto = () => {
    setProfileImage("https://api.dicebear.com/7.x/avataaars/svg?seed=Alex")
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-right">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Profile updated successfully
        </div>
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
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={handleCancel}
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button 
                className="gap-2"
                onClick={handleSave}
                disabled={isSaving}
              >
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
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Avatar Section */}
        <Card className="lg:col-span-1 border-border bg-card">
          <CardContent className="p-6 flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-32 w-32">
                <AvatarImage src={profileImage} alt="Profile" />
                <AvatarFallback className="text-3xl bg-primary text-primary-foreground">AM</AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button 
                  size="icon" 
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>
            {isEditing && (
              <div className="flex flex-col gap-2 w-full">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4" />
                  Change Photo
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full gap-2 text-muted-foreground hover:text-destructive"
                  onClick={handleRemovePhoto}
                >
                  <Trash2 className="h-4 w-4" />
                  Remove Photo
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-1">
                  JPG, PNG, WEBP. Max 2MB.
                </p>
              </div>
            )}
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground">Alex Morgan</h2>
              <p className="text-sm text-muted-foreground">Pro Member</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Trophy className="h-3 w-3" />
                23 Achievements
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" />
                127h Studied
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 pt-2 border-t border-border w-full justify-center">
              <CalendarDays className="h-3 w-3" />
              Member since Jan 2024
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="lg:col-span-2 border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>First Name <span className="text-destructive">*</span></Label>
                <Input 
                  defaultValue="Alex" 
                  disabled={!isEditing}
                  className="bg-secondary border-border disabled:opacity-100"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name <span className="text-destructive">*</span></Label>
                <Input 
                  defaultValue="Morgan" 
                  disabled={!isEditing}
                  className="bg-secondary border-border disabled:opacity-100"
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  Email
                </Label>
                <Input 
                  type="email" 
                  defaultValue="alex@example.com" 
                  disabled
                  className="bg-secondary/50 border-border opacity-60"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  Contact Number
                </Label>
                <Input 
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  disabled={!isEditing}
                  className="bg-secondary border-border disabled:opacity-100"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Learning Goal</Label>
              <Input 
                placeholder="e.g., Master machine learning fundamentals"
                defaultValue="Pass graduate school entrance exams"
                disabled={!isEditing}
                className="bg-secondary border-border disabled:opacity-100"
              />
            </div>
            <div className="space-y-2">
              <Label>Daily Study Target (hours)</Label>
              <Select defaultValue="4" disabled={!isEditing}>
                <SelectTrigger className="bg-secondary border-border disabled:opacity-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 8].map((hours) => (
                    <SelectItem key={hours} value={hours.toString()}>
                      {hours} {hours === 1 ? "hour" : "hours"} per day
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Learning Goals */}
        <Card className="lg:col-span-2 border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Learning Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {learningGoals.map((goal, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
                    {index + 1}
                  </div>
                  <Input 
                    defaultValue={goal}
                    disabled={!isEditing}
                    className="bg-transparent border-0 disabled:opacity-100 p-0 h-auto"
                  />
                </div>
              ))}
            </div>
            {isEditing && (
              <Button variant="outline" className="w-full border-dashed">
                + Add Goal
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Study Preferences */}
        <Card className="lg:col-span-1 border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Study Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Preferred Study Time</Label>
              <Select defaultValue="evening" disabled={!isEditing}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {studyPreferences.map((pref) => (
                    <SelectItem key={pref} value={pref.toLowerCase()}>
                      {pref}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Daily Goal (hours)</Label>
              <Select defaultValue="4" disabled={!isEditing}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6, 8].map((hours) => (
                    <SelectItem key={hours} value={hours.toString()}>
                      {hours} hours
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Focus Session Length</Label>
              <Select defaultValue="45" disabled={!isEditing}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[25, 30, 45, 60, 90].map((mins) => (
                    <SelectItem key={mins} value={mins.toString()}>
                      {mins} minutes
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
