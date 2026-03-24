"use client"

import { cn } from "@/lib/utils"

// Renders AI markdown responses beautifully without any external dependencies.
// Handles: ## headings, **bold**, `code`, ```code blocks```, - bullet lists,
// numbered lists, > blockquotes, --- horizontal rules, and plain paragraphs.
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface MarkdownRendererProps {
  content: string
}

interface Props {
  content: string
  className?: string
}
export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-invert max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-li:my-1">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4 break-all hover:opacity-80"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export function MarkdownRenderer({ content, className }: Props) {
  const lines = content.split("\n")
  const elements: React.ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    // ── Fenced code block ───────────────────────────────────────────────────
    if (line.trimStart().startsWith("```")) {
      const lang = line.replace(/^`+/, "").trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        codeLines.push(lines[i])
        i++
      }
      elements.push(
        <div key={key++} className="my-3 rounded-lg overflow-hidden border border-border">
          {lang && (
            <div className="bg-muted px-3 py-1.5 text-xs font-mono text-muted-foreground border-b border-border">
              {lang}
            </div>
          )}
          <pre className="bg-[#1a1d2e] p-4 overflow-x-auto">
            <code className="text-sm font-mono text-emerald-300 leading-relaxed">
              {codeLines.join("\n")}
            </code>
          </pre>
        </div>
      )
      i++
      continue
    }

    // ── H1: # ───────────────────────────────────────────────────────────────
    if (/^#\s/.test(line)) {
      elements.push(
        <h1 key={key++} className="text-xl font-bold text-foreground mt-5 mb-2 pb-1 border-b border-border">
          {inlineFormat(line.replace(/^#\s+/, ""))}
        </h1>
      )
      i++; continue
    }

    // ── H2: ## ──────────────────────────────────────────────────────────────
    if (/^##\s/.test(line)) {
      elements.push(
        <h2 key={key++} className="text-lg font-bold text-primary mt-5 mb-2">
          {inlineFormat(line.replace(/^##\s+/, ""))}
        </h2>
      )
      i++; continue
    }

    // ── H3: ### ─────────────────────────────────────────────────────────────
    if (/^###\s/.test(line)) {
      elements.push(
        <h3 key={key++} className="text-base font-semibold text-foreground mt-4 mb-1.5">
          {inlineFormat(line.replace(/^###\s+/, ""))}
        </h3>
      )
      i++; continue
    }

    // ── H4/H5: #### / ##### ─────────────────────────────────────────────────
    if (/^#{4,}\s/.test(line)) {
      elements.push(
        <h4 key={key++} className="text-sm font-semibold text-foreground mt-3 mb-1">
          {inlineFormat(line.replace(/^#{4,}\s+/, ""))}
        </h4>
      )
      i++; continue
    }

    // ── Horizontal rule: --- / *** / ___ ────────────────────────────────────
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim())) {
      elements.push(<hr key={key++} className="my-4 border-border" />)
      i++; continue
    }

    // ── Blockquote: > ───────────────────────────────────────────────────────
    if (/^>\s/.test(line)) {
      const bqLines: string[] = []
      while (i < lines.length && /^>\s/.test(lines[i])) {
        bqLines.push(lines[i].replace(/^>\s+/, ""))
        i++
      }
      elements.push(
        <blockquote key={key++} className="my-3 border-l-4 border-primary/50 pl-4 py-1 bg-primary/5 rounded-r-lg">
          {bqLines.map((bl, bi) => (
            <p key={bi} className="text-sm text-foreground/90 leading-relaxed">
              {inlineFormat(bl)}
            </p>
          ))}
        </blockquote>
      )
      continue
    }

    // ── Unordered list: - / * / + ────────────────────────────────────────────
    if (/^[\s]*[-*+]\s/.test(line)) {
      const items: { text: string; indent: number }[] = []
      while (i < lines.length && /^[\s]*[-*+]\s/.test(lines[i])) {
        const indent = lines[i].match(/^(\s*)/)?.[1]?.length ?? 0
        items.push({ text: lines[i].replace(/^[\s]*[-*+]\s+/, ""), indent })
        i++
      }
      elements.push(
        <ul key={key++} className="my-2 space-y-1.5">
          {items.map((item, ii) => (
            <li key={ii} className="flex gap-2 text-sm leading-relaxed"
              style={{ paddingLeft: `${item.indent * 12}px` }}>
              <span className="text-primary mt-1.5 shrink-0 text-xs">●</span>
              <span className="text-foreground">{inlineFormat(item.text)}</span>
            </li>
          ))}
        </ul>
      )
      continue
    }

    // ── Ordered list: 1. 2. ─────────────────────────────────────────────────
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      let startNum = 1
      const match = line.match(/^(\d+)\./)
      if (match) startNum = parseInt(match[1])
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""))
        i++
      }
      elements.push(
        <ol key={key++} className="my-2 space-y-1.5 list-none">
          {items.map((item, ii) => (
            <li key={ii} className="flex gap-3 text-sm leading-relaxed">
              <span className="text-primary font-bold shrink-0 min-w-[20px]">
                {startNum + ii}.
              </span>
              <span className="text-foreground">{inlineFormat(item)}</span>
            </li>
          ))}
        </ol>
      )
      continue
    }

    // ── Empty line ───────────────────────────────────────────────────────────
    if (line.trim() === "") {
      elements.push(<div key={key++} className="h-2" />)
      i++; continue
    }

    // ── Regular paragraph ────────────────────────────────────────────────────
    elements.push(
      <p key={key++} className="text-sm md:text-base leading-relaxed text-foreground">
        {inlineFormat(line)}
      </p>
    )
    i++
  }

  return (
    <div className={cn("space-y-0.5", className)}>
      {elements}
    </div>
  )
}

// ── Inline formatting: bold, italic, inline code, strikethrough ───────────────
function inlineFormat(text: string): React.ReactNode {
  if (!text) return null

  // Split by inline patterns
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_|~~[^~]+~~)/)

  return parts.map((part, i) => {
    if (!part) return null

    // Inline code: `code`
    if (/^`[^`]+`$/.test(part)) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded text-xs font-mono bg-primary/10 text-primary border border-primary/20">
          {part.slice(1, -1)}
        </code>
      )
    }
    // Bold: **text** or __text__
    if (/^\*\*[^*]+\*\*$/.test(part) || /^__[^_]+__$/.test(part)) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
    }
    // Italic: *text* or _text_
    if (/^\*[^*]+\*$/.test(part) || /^_[^_]+_$/.test(part)) {
      return <em key={i} className="italic text-foreground/90">{part.slice(1, -1)}</em>
    }
    // Strikethrough: ~~text~~
    if (/^~~[^~]+~~$/.test(part)) {
      return <s key={i} className="text-muted-foreground">{part.slice(2, -2)}</s>
    }
    return <span key={i}>{part}</span>
  })
}
