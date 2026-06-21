"use client"

import { useMemo, useRef, useState, type WheelEvent, type MouseEvent as ReactMouseEvent } from "react"
import { cn } from "@/lib/utils"

export interface ConceptMapNode {
  id: string
  label: string
  excerpt: string
}

export interface ConceptMapEdge {
  id: string
  source: string
  target: string
  label?: string
}

type Props = {
  nodes: ConceptMapNode[]
  edges: ConceptMapEdge[]
  selectedNodeId: string | null
  onSelectNode: (node: ConceptMapNode) => void
  className?: string
}

const NODE_RADIUS = 30
const MIN_ZOOM = 0.5
const MAX_ZOOM = 2.5

function layoutNodes(nodes: ConceptMapNode[]) {
  const count = nodes.length
  const radius = Math.min(320, Math.max(140, 70 + count * 16))

  return nodes.map((node, index) => {
    const angle = (2 * Math.PI * index) / Math.max(count, 1) - Math.PI / 2
    return {
      ...node,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    }
  })
}

export function ConceptMapCanvas({ nodes, edges, selectedNodeId, onSelectNode, className }: Props) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const isPanningRef = useRef(false)
  const lastPointRef = useRef({ x: 0, y: 0 })

  const positionedNodes = useMemo(() => layoutNodes(nodes), [nodes])
  const positionById = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>()
    positionedNodes.forEach((node) => map.set(node.id, { x: node.x, y: node.y }))
    return map
  }, [positionedNodes])

  function handleWheel(e: WheelEvent<HTMLDivElement>) {
    e.preventDefault()
    setZoom((prev) => {
      const next = prev - e.deltaY * 0.001
      return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next))
    })
  }

  function handleMouseDown(e: ReactMouseEvent<HTMLDivElement>) {
    isPanningRef.current = true
    lastPointRef.current = { x: e.clientX, y: e.clientY }
  }

  function handleMouseMove(e: ReactMouseEvent<HTMLDivElement>) {
    if (!isPanningRef.current) return
    const dx = e.clientX - lastPointRef.current.x
    const dy = e.clientY - lastPointRef.current.y
    lastPointRef.current = { x: e.clientX, y: e.clientY }
    setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }))
  }

  function stopPanning() {
    isPanningRef.current = false
  }

  function resetView() {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  if (!positionedNodes.length) {
    return null
  }

  return (
    <div
      className={cn(
        "relative h-[460px] w-full cursor-grab overflow-hidden rounded-xl border border-border bg-secondary/20 active:cursor-grabbing",
        className
      )}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={stopPanning}
      onMouseLeave={stopPanning}
    >
      <button
        type="button"
        onClick={resetView}
        className="absolute right-3 top-3 z-10 rounded-md border border-border bg-card px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
      >
        Reset view
      </button>

      <svg className="h-full w-full select-none" viewBox="-400 -400 800 800">
        <g
          transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}
          style={{ transition: isPanningRef.current ? "none" : "transform 80ms ease-out" }}
        >
          {edges.map((edge) => {
            const from = positionById.get(edge.source)
            const to = positionById.get(edge.target)
            if (!from || !to) return null

            const midX = (from.x + to.x) / 2
            const midY = (from.y + to.y) / 2

            return (
              <g key={edge.id}>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="currentColor"
                  className="text-border"
                  strokeWidth={1.5}
                />
                {edge.label ? (
                  <text
                    x={midX}
                    y={midY}
                    textAnchor="middle"
                    className="fill-muted-foreground"
                    style={{ fontSize: 10 }}
                  >
                    {edge.label}
                  </text>
                ) : null}
              </g>
            )
          })}

          {positionedNodes.map((node) => {
            const isSelected = node.id === selectedNodeId

            return (
              <g
                key={node.id}
                transform={`translate(${node.x} ${node.y})`}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectNode(node)
                }}
              >
                <circle
                  r={NODE_RADIUS}
                  className={cn(
                    "transition-colors",
                    isSelected ? "fill-primary stroke-primary" : "fill-card stroke-border hover:stroke-primary/60"
                  )}
                  strokeWidth={2}
                />
                <text
                  textAnchor="middle"
                  dy={NODE_RADIUS + 16}
                  className={cn("font-medium", isSelected ? "fill-primary" : "fill-foreground")}
                  style={{ fontSize: 11 }}
                >
                  {node.label.length > 18 ? `${node.label.slice(0, 18)}…` : node.label}
                </text>
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}
