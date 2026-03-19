"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Search, 
  Star, 
  Download,
  Upload,
  Filter,
  BookOpen,
  FileText,
  Layers,
  Users
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Material {
  id: string
  title: string
  author: string
  type: "notes" | "flashcards" | "quiz"
  subject: string
  rating: number
  downloads: number
  price: "free" | number
}

const materials: Material[] = [
  { id: "1", title: "Complete Calculus Notes", author: "Sarah Chen", type: "notes", subject: "Mathematics", rating: 4.8, downloads: 1234, price: "free" },
  { id: "2", title: "Physics Formulas Flashcards", author: "Mike Johnson", type: "flashcards", subject: "Physics", rating: 4.6, downloads: 892, price: 2.99 },
  { id: "3", title: "Organic Chemistry Quiz Pack", author: "Dr. Lisa Park", type: "quiz", subject: "Chemistry", rating: 4.9, downloads: 2156, price: 4.99 },
  { id: "4", title: "Biology Cell Structure Notes", author: "Alex Turner", type: "notes", subject: "Biology", rating: 4.5, downloads: 756, price: "free" },
  { id: "5", title: "Linear Algebra Study Guide", author: "Prof. David Kim", type: "notes", subject: "Mathematics", rating: 4.7, downloads: 1089, price: 3.99 },
  { id: "6", title: "Thermodynamics Flashcards", author: "Emily White", type: "flashcards", subject: "Physics", rating: 4.4, downloads: 445, price: "free" },
]

const typeIcons = {
  notes: FileText,
  flashcards: Layers,
  quiz: BookOpen,
}

const typeColors = {
  notes: "bg-primary/10 text-primary",
  flashcards: "bg-violet-500/10 text-violet-500",
  quiz: "bg-emerald-500/10 text-emerald-500",
}

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subject.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = !selectedType || m.type === selectedType
    return matchesSearch && matchesType
  })

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Marketplace</h1>
          <p className="text-muted-foreground">Discover and share study materials</p>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Material
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Upload Study Material</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input placeholder="e.g., Complete Physics Notes" className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="Describe your study material..." className="bg-secondary border-border" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Input placeholder="Notes, Flashcards, Quiz" className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input placeholder="e.g., Physics" className="bg-secondary border-border" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>File</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                </div>
              </div>
              <Button className="w-full" onClick={() => setIsUploadOpen(false)}>
                Upload Material
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>
        <div className="flex gap-2">
          {(["notes", "flashcards", "quiz"] as const).map((type) => {
            const Icon = typeIcons[type]
            return (
              <Button
                key={type}
                variant={selectedType === type ? "default" : "outline"}
                size="sm"
                className="gap-2 capitalize"
                onClick={() => setSelectedType(selectedType === type ? null : type)}
              >
                <Icon className="h-4 w-4" />
                {type}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Materials Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredMaterials.map((material) => {
          const Icon = typeIcons[material.type]
          return (
            <Card key={material.id} className="border-border bg-card hover:border-primary/50 transition-all">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", typeColors[material.type])}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge variant={material.price === "free" ? "secondary" : "default"}>
                    {material.price === "free" ? "Free" : `$${material.price}`}
                  </Badge>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground line-clamp-1">{material.title}</h3>
                  <p className="text-sm text-muted-foreground">by {material.author}</p>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <span>{material.rating}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Download className="h-4 w-4" />
                    <span>{material.downloads.toLocaleString()}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {material.subject}
                  </Badge>
                </div>

                <Button className="w-full gap-2" variant={material.price === "free" ? "default" : "outline"}>
                  <Download className="h-4 w-4" />
                  {material.price === "free" ? "Download" : "Purchase"}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredMaterials.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-foreground">No materials found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}
