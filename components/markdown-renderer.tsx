"use client"

import React from "react"
import { cn } from "@/lib/utils"

type Props = {
  content: string
  className?: string
}

type InlineToken =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "code"; value: string }
  | { type: "link"; label: string; url: string }

function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = []
  let remaining = text

  while (remaining.length > 0) {
    const linkMatch = remaining.match(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/)
    const boldMatch = remaining.match(/\*\*(.*?)\*\*/)
    const codeMatch = remaining.match(/`([^`]+)`/)

    const matches = [
      linkMatch ? { type: "link" as const, index: linkMatch.index ?? -1, match: linkMatch } : null,
      boldMatch ? { type: "bold" as const, index: boldMatch.index ?? -1, match: boldMatch } : null,
      codeMatch ? { type: "code" as const, index: codeMatch.index ?? -1, match: codeMatch } : null,
    ].filter(Boolean) as Array<{ type: "link" | "bold" | "code"; index: number; match: RegExpMatchArray }>

    if (!matches.length) {
      tokens.push({ type: "text", value: remaining })
      break
    }

    matches.sort((a, b) => a.index - b.index)
    const first = matches[0]

    if (first.index > 0) {
      tokens.push({ type: "text", value: remaining.slice(0, first.index) })
    }

    if (first.type === "link") {
      const [, label, url] = first.match
      tokens.push({ type: "link", label, url })
    } else if (first.type === "bold") {
      const [, value] = first.match
      tokens.push({ type: "bold", value })
    } else {
      const [, value] = first.match
      tokens.push({ type: "code", value })
    }

    remaining = remaining.slice(first.index + first.match[0].length)
  }

  return tokens
}

function renderInline(text: string) {
  return parseInline(text).map((token, index) => {
    if (token.type === "text") {
      return <React.Fragment key={index}>{token.value}</React.Fragment>
    }

    if (token.type === "bold") {
      return (
        <strong key={index} className="font-semibold text-foreground">
          {token.value}
        </strong>
      )
    }

    if (token.type === "code") {
      return (
        <code
          key={index}
          className="rounded-md border border-primary/20 bg-primary/10 px-1.5 py-0.5 font-mono text-[0.92em] text-primary"
        >
          {token.value}
        </code>
      )
    }

    return (
      <a
        key={index}
        href={token.url}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all font-medium text-primary underline decoration-primary/40 underline-offset-4 hover:opacity-80"
      >
        {token.label}
      </a>
    )
  })
}

function normalizeContent(content: string) {
  return content
    .replace(/\r\n/g, "\n")
    .replace(/^\s*#+\s*(summary|concept breakdown|bullet points|revision notes)\s*$/gim, "")
    .replace(/^\s*\*\*(.*?)\*\*\s*$/gm, "## $1")
    .replace(/^\s*([A-Z][A-Za-z0-9()\-/& ,]{3,60}):\s*$/gm, "## $1")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export function MarkdownRenderer({ content, className }: Props) {
  const lines = normalizeContent(content).split("\n")
  const elements: React.ReactNode[] = []

  let i = 0
  while (i < lines.length) {
    const rawLine = lines[i]
    const line = rawLine.trim()

    if (!line) {
      i++
      continue
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      elements.push(<hr key={`hr-${i}`} className="my-6 border-white/10" />)
      i++
      continue
    }

    if (rawLine.trimStart().startsWith("```")) {
      const language = rawLine.trim().replace(/^```/, "").trim()
      const block: string[] = []
      i++

      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        block.push(lines[i])
        i++
      }

      if (i < lines.length) i++

      elements.push(
        <div key={`code-${i}`} className="my-5 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
          {language ? (
            <div className="border-b border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground">
              {language}
            </div>
          ) : null}
          <pre className="overflow-x-auto p-4 text-sm leading-6 text-slate-100">
            <code>{block.join("\n")}</code>
          </pre>
        </div>
      )
      continue
    }

    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={`h3-${i}`} className="mb-2 mt-6 text-base font-semibold tracking-wide text-primary md:text-lg">
          {renderInline(line.replace(/^###\s+/, ""))}
        </h3>
      )
      i++
      continue
    }

    if (line.startsWith("## ")) {
      elements.push(
        <div key={`h2-wrap-${i}`} className="pt-2">
          <hr className="mb-4 border-white/10" />
          <h2 className="text-lg font-semibold text-foreground md:text-xl">
            {renderInline(line.replace(/^##\s+/, ""))}
          </h2>
        </div>
      )
      i++
      continue
    }

    if (line.startsWith("# ")) {
      elements.push(
        <div key={`h1-wrap-${i}`} className="pt-2">
          <h1 className="mb-3 text-xl font-bold text-foreground md:text-2xl">
            {renderInline(line.replace(/^#\s+/, ""))}
          </h1>
          <hr className="border-primary/20" />
        </div>
      )
      i++
      continue
    }

    if (line.startsWith("> ")) {
      const quoteLines: string[] = []

      while (i < lines.length && lines[i].trim().startsWith("> ")) {
        quoteLines.push(lines[i].trim().replace(/^>\s+/, ""))
        i++
      }

      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="my-5 rounded-r-2xl border-l-4 border-primary/60 bg-primary/5 px-4 py-3 text-sm leading-7 text-muted-foreground"
        >
          {quoteLines.map((quote, index) => (
            <p key={index} className={index ? "mt-2" : ""}>
              {renderInline(quote)}
            </p>
          ))}
        </blockquote>
      )
      continue
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = []

      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""))
        i++
      }

      elements.push(
        <ul key={`ul-${i}`} className="my-4 space-y-2.5">
          {items.map((item, index) => (
            <li key={index} className="flex gap-3 text-sm leading-7 text-foreground md:text-[15px]">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      )
      continue
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = []

      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""))
        i++
      }

      elements.push(
        <ol key={`ol-${i}`} className="my-4 space-y-2.5">
          {items.map((item, index) => (
            <li key={index} className="flex gap-3 text-sm leading-7 text-foreground md:text-[15px]">
              <span className="min-w-5 shrink-0 font-semibold text-primary">{index + 1}.</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      )
      continue
    }

    const paragraphLines = [line]
    let j = i + 1

    while (
      j < lines.length &&
      lines[j].trim() &&
      !/^#{1,3}\s/.test(lines[j].trim()) &&
      !/^[-*]\s+/.test(lines[j].trim()) &&
      !/^\d+\.\s+/.test(lines[j].trim()) &&
      !/^>\s+/.test(lines[j].trim()) &&
      !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[j].trim()) &&
      !lines[j].trimStart().startsWith("```")
    ) {
      paragraphLines.push(lines[j].trim())
      j++
    }

    const paragraph = paragraphLines.join(" ")
    const looksLikeSectionLead = paragraph.endsWith(":") && paragraph.length < 110

    elements.push(
      <p
        key={`p-${i}`}
        className={cn(
          "text-[15px] leading-8 text-foreground/95",
          looksLikeSectionLead && "mt-5 text-base font-semibold text-foreground"
        )}
      >
        {renderInline(paragraph)}
      </p>
    )

    i = j
  }

  return (
    <div
      className={cn(
        "space-y-2 text-sm text-foreground [&_p+ol]:mt-2 [&_p+ul]:mt-2",
        className
      )}
    >
      {elements}
    </div>
  )
}