"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ConceptMapCanvas, type ConceptMapNode, type ConceptMapEdge } from "@/components/concept-map-canvas"
import { Network, History, Eye, Trash2, FileText, MessageSquare, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"
import { LoginGateModal } from "@/components/login-gate-modal"

interface SavedConceptMap {
  id: string
  title: string
  source_type: "note" | "chat"
  source_id: string
  nodes: ConceptMapNode[]
  edges: ConceptMapEdge[]
  created_at: string
}

export default function ConceptMapPage() {
  const [history, setHistory] = useState<SavedConceptMap[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [activeMap, setActiveMap] = useState<SavedConceptMap | null>(null)
  const [selectedNode, setSelectedNode] = useState<ConceptMapNode | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [pageError, setPageError] = useState("")

  useEffect(() => {
    void loadHistory()
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const mapId = new URLSearchParams(window.location.search).get("map")
    if (!mapId) return

    const existing = history.find((item) => item.id === mapId)
    if (existing) {
      openMap(existing)
      return
    }

    if (!historyLoading) {
      void loadMap(mapId)
    }
  }, [history, historyLoading])

  async function loadHistory() {
    try {
      setHistoryLoading(true)
      const response = await fetch("/api/ai/concept-map", { cache: "no-store" })
      const data = await response.json().catch(() => ({ maps: [] }))

      if (response.ok) {
        setHistory(data.maps || [])
      } else if (data.code === "UNAUTHORIZED") {
        setShowLoginModal(true)
      }
    } catch {
      //
    } finally {
      setHistoryLoading(false)
    }
  }

  async function loadMap(mapId: string) {
    try {
      const response = await fetch(`/api/ai/concept-map/${mapId}`, { cache: "no-store" })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.map) return

      const map = data.map as SavedConceptMap
      setHistory((prev) => (prev.some((item) => item.id === map.id) ? prev : [map, ...prev]))
      openMap(map)
    } catch {
      //
    }
  }

  function openMap(map: SavedConceptMap) {
    setActiveMap(map)
    setSelectedNode(null)
    setPageError("")

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      url.searchParams.set("map", map.id)
      window.history.replaceState({}, "", url.toString())
    }
  }

  async function handleDelete(mapId: string) {
    try {
      const response = await fetch(`/api/ai/concept-map/${mapId}`, { method: "DELETE" })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete concept map")
      }

      setHistory((prev) => prev.filter((item) => item.id !== mapId))

      if (activeMap?.id === mapId) {
        setActiveMap(null)
        setSelectedNode(null)
      }
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Failed to delete concept map")
    }
  }

  return (
    <>
      <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Concept Map</h1>
          <p className="text-muted-foreground">
            Visualize how the ideas in a note or chat session connect to each other
          </p>
        </div>

        <Card className="border-border bg-card">
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium text-foreground">Generate a concept map from your content.</p>
              <p className="mt-1 text-muted-foreground">
                Open a saved note or an AI Tutor chat session and use the{" "}
                <span className="font-medium text-foreground">Concept Map</span> action there. Generated maps
                appear here and stay linked to their source.
              </p>
            </div>
          </CardContent>
        </Card>

        {pageError ? <p className="text-sm text-destructive">{pageError}</p> : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            {activeMap ? (
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5 text-primary" />
                    {activeMap.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ConceptMapCanvas
                    nodes={activeMap.nodes}
                    edges={activeMap.edges}
                    selectedNodeId={selectedNode?.id || null}
                    onSelectNode={setSelectedNode}
                  />
                  <p className="text-center text-xs text-muted-foreground">
                    Scroll to zoom · Drag to pan · Click a node for details
                  </p>

                  <div className="rounded-xl border border-border bg-secondary/30 p-4">
                    {selectedNode ? (
                      <>
                        <p className="font-medium text-foreground">{selectedNode.label}</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {selectedNode.excerpt || "No additional explanation was generated for this concept."}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Click any node to see its explanation here.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="min-h-[320px] border-border bg-card">
                <CardContent className="flex h-full min-h-[320px] items-center justify-center p-6">
                  <div className="max-w-sm text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                      <Network className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">No concept map open</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Generate one from a saved note or chat session, or open one from your history.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Card className="border-border bg-card h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="h-5 w-5 text-primary" />
                Concept Map History
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {historyLoading ? (
                <div className="text-sm text-muted-foreground">Loading concept maps...</div>
              ) : history.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
                  <Network className="h-8 w-8 text-primary mx-auto mb-3" />
                  <p className="font-medium text-foreground">No concept maps yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Generate one from a note or chat session and it will appear here.
                  </p>
                </div>
              ) : (
                history.map((item) => {
                  const isActive = activeMap?.id === item.id

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "rounded-xl border transition-all p-3",
                        isActive
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background/40 hover:border-primary/40 hover:bg-primary/5"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => openMap(item)}
                          className="flex flex-1 min-w-0 items-start gap-3 text-left"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card">
                            <Network className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground truncate">{item.title}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge variant="secondary" className="text-[11px]">
                                {item.nodes.length} concepts
                              </Badge>
                              <Badge variant="outline" className="gap-1 text-[11px]">
                                {item.source_type === "note" ? (
                                  <FileText className="h-3 w-3" />
                                ) : (
                                  <MessageSquare className="h-3 w-3" />
                                )}
                                {item.source_type === "note" ? "From Note" : "From Chat"}
                              </Badge>
                            </div>
                          </div>
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openMap(item)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <LoginGateModal open={showLoginModal} onOpenChange={setShowLoginModal} featureName="Concept Map" />
    </>
  )
}
