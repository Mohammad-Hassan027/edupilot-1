"use client"

import React from "react"
import { cn } from "@/lib/utils"

type Props = {
  content: string
  className?: string
}

function cleanInline(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
}

export function MarkdownRenderer({ content, className }: Props) {
  const lines = content.replace(/\r\n/g, "\n").split("\n")
  const elements: React.ReactNode[] = []

  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()

    if (!line) {
      i++
      continue
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      elements.push(<hr key={`hr-${i}`} className="my-6 border-white/10" />)
      i++
      continue
    }

    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={`h3-${i}`} className="mt-6 text-lg font-semibold text-primary">
          {cleanInline(line.replace(/^###\s+/, ""))}
        </h3>
      )
      i++
      continue
    }

    if (line.startsWith("## ")) {
      elements.push(
        <div key={`h2-${i}`} className="pt-2">
          <hr className="mb-4 border-white/10" />
          <h2 className="text-xl font-semibold text-foreground">
            {cleanInline(line.replace(/^##\s+/, ""))}
          </h2>
        </div>
      )
      i++
      continue
    }

    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={`h1-${i}`} className="text-2xl font-bold text-foreground">
          {cleanInline(line.replace(/^#\s+/, ""))}
        </h1>
      )
      i++
      continue
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(cleanInline(lines[i].trim().replace(/^[-*]\s+/, "")))
        i++
      }

      elements.push(
        <ul key={`ul-${i}`} className="my-4 space-y-3">
          {items.map((item, index) => (
            <li key={index} className="flex gap-3 text-[15px] leading-8 text-foreground/95">
              <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )
      continue
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(cleanInline(lines[i].trim().replace(/^\d+\.\s+/, "")))
        i++
      }

      elements.push(
        <ol key={`ol-${i}`} className="my-4 space-y-3">
          {items.map((item, index) => (
            <li key={index} className="flex gap-3 text-[15px] leading-8 text-foreground/95">
              <span className="min-w-5 font-semibold text-primary">{index + 1}.</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      )
      continue
    }

    const paragraphLines = [cleanInline(line)]
    let j = i + 1

    while (
      j < lines.length &&
      lines[j].trim() &&
      !/^#{1,3}\s/.test(lines[j].trim()) &&
      !/^[-*]\s+/.test(lines[j].trim()) &&
      !/^\d+\.\s+/.test(lines[j].trim()) &&
      !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[j].trim())
    ) {
      paragraphLines.push(cleanInline(lines[j].trim()))
      j++
    }

    elements.push(
      <p key={`p-${i}`} className="text-[15px] leading-8 text-foreground/95">
        {paragraphLines.join(" ")}
      </p>
    )

    i = j
  }

  return <div className={cn("space-y-3", className)}>{elements}</div>
}