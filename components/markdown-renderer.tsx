// "use client"

// import { cn } from "@/lib/utils"

// // Renders AI markdown responses beautifully without any external dependencies.
// // Handles: ## headings, **bold**, `code`, ```code blocks```, - bullet lists,
// // numbered lists, > blockquotes, --- horizontal rules, and plain paragraphs.

// interface Props {
//   content: string
//   className?: string
// }

// export function MarkdownRenderer({ content, className }: Props) {
//   const lines = content.split("\n")
//   const elements: React.ReactNode[] = []
//   let i = 0
//   let key = 0

//   while (i < lines.length) {
//     const line = lines[i]

//     // ── Fenced code block ───────────────────────────────────────────────────
//     if (line.trimStart().startsWith("```")) {
//       const lang = line.replace(/^`+/, "").trim()
//       const codeLines: string[] = []
//       i++
//       while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
//         codeLines.push(lines[i])
//         i++
//       }
//       elements.push(
//         <div key={key++} className="my-3 rounded-lg overflow-hidden border border-border">
//           {lang && (
//             <div className="bg-muted px-3 py-1.5 text-xs font-mono text-muted-foreground border-b border-border">
//               {lang}
//             </div>
//           )}
//           <pre className="bg-[#1a1d2e] p-4 overflow-x-auto">
//             <code className="text-sm font-mono text-emerald-300 leading-relaxed">
//               {codeLines.join("\n")}
//             </code>
//           </pre>
//         </div>
//       )
//       i++
//       continue
//     }

//     // ── H1: # ───────────────────────────────────────────────────────────────
//     if (/^#\s/.test(line)) {
//       elements.push(
//         <h1 key={key++} className="text-xl font-bold text-foreground mt-5 mb-2 pb-1 border-b border-border">
//           {inlineFormat(line.replace(/^#\s+/, ""))}
//         </h1>
//       )
//       i++; continue
//     }

//     // ── H2: ## ──────────────────────────────────────────────────────────────
//     if (/^##\s/.test(line)) {
//       elements.push(
//         <h2 key={key++} className="text-lg font-bold text-primary mt-5 mb-2">
//           {inlineFormat(line.replace(/^##\s+/, ""))}
//         </h2>
//       )
//       i++; continue
//     }

//     // ── H3: ### ─────────────────────────────────────────────────────────────
//     if (/^###\s/.test(line)) {
//       elements.push(
//         <h3 key={key++} className="text-base font-semibold text-foreground mt-4 mb-1.5">
//           {inlineFormat(line.replace(/^###\s+/, ""))}
//         </h3>
//       )
//       i++; continue
//     }

//     // ── H4/H5: #### / ##### ─────────────────────────────────────────────────
//     if (/^#{4,}\s/.test(line)) {
//       elements.push(
//         <h4 key={key++} className="text-sm font-semibold text-foreground mt-3 mb-1">
//           {inlineFormat(line.replace(/^#{4,}\s+/, ""))}
//         </h4>
//       )
//       i++; continue
//     }

//     // ── Horizontal rule: --- / *** / ___ ────────────────────────────────────
//     if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim())) {
//       elements.push(<hr key={key++} className="my-4 border-border" />)
//       i++; continue
//     }

//     // ── Blockquote: > ───────────────────────────────────────────────────────
//     if (/^>\s/.test(line)) {
//       const bqLines: string[] = []
//       while (i < lines.length && /^>\s/.test(lines[i])) {
//         bqLines.push(lines[i].replace(/^>\s+/, ""))
//         i++
//       }
//       elements.push(
//         <blockquote key={key++} className="my-3 border-l-4 border-primary/50 pl-4 py-1 bg-primary/5 rounded-r-lg">
//           {bqLines.map((bl, bi) => (
//             <p key={bi} className="text-sm text-foreground/90 leading-relaxed">
//               {inlineFormat(bl)}
//             </p>
//           ))}
//         </blockquote>
//       )
//       continue
//     }

//     // ── Unordered list: - / * / + ────────────────────────────────────────────
//     if (/^[\s]*[-*+]\s/.test(line)) {
//       const items: { text: string; indent: number }[] = []
//       while (i < lines.length && /^[\s]*[-*+]\s/.test(lines[i])) {
//         const indent = lines[i].match(/^(\s*)/)?.[1]?.length ?? 0
//         items.push({ text: lines[i].replace(/^[\s]*[-*+]\s+/, ""), indent })
//         i++
//       }
//       elements.push(
//         <ul key={key++} className="my-2 space-y-1.5">
//           {items.map((item, ii) => (
//             <li key={ii} className="flex gap-2 text-sm leading-relaxed"
//               style={{ paddingLeft: `${item.indent * 12}px` }}>
//               <span className="text-primary mt-1.5 shrink-0 text-xs">●</span>
//               <span className="text-foreground">{inlineFormat(item.text)}</span>
//             </li>
//           ))}
//         </ul>
//       )
//       continue
//     }

//     // ── Ordered list: 1. 2. ─────────────────────────────────────────────────
//     if (/^\d+\.\s/.test(line)) {
//       const items: string[] = []
//       let startNum = 1
//       const match = line.match(/^(\d+)\./)
//       if (match) startNum = parseInt(match[1])
//       while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
//         items.push(lines[i].replace(/^\d+\.\s+/, ""))
//         i++
//       }
//       elements.push(
//         <ol key={key++} className="my-2 space-y-1.5 list-none">
//           {items.map((item, ii) => (
//             <li key={ii} className="flex gap-3 text-sm leading-relaxed">
//               <span className="text-primary font-bold shrink-0 min-w-[20px]">
//                 {startNum + ii}.
//               </span>
//               <span className="text-foreground">{inlineFormat(item)}</span>
//             </li>
//           ))}
//         </ol>
//       )
//       continue
//     }

//     // ── Empty line ───────────────────────────────────────────────────────────
//     if (line.trim() === "") {
//       elements.push(<div key={key++} className="h-2" />)
//       i++; continue
//     }

//     // ── Regular paragraph ────────────────────────────────────────────────────
//     elements.push(
//       <p key={key++} className="text-sm md:text-base leading-relaxed text-foreground">
//         {inlineFormat(line)}
//       </p>
//     )
//     i++
//   }

//   return (
//     <div className={cn("space-y-0.5", className)}>
//       {elements}
//     </div>
//   )
// }

// // ── Inline formatting: bold, italic, inline code, strikethrough ───────────────
// function inlineFormat(text: string): React.ReactNode {
//   if (!text) return null

//   // Split by inline patterns
//   const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_|~~[^~]+~~)/)

//   return parts.map((part, i) => {
//     if (!part) return null

//     // Inline code: `code`
//     if (/^`[^`]+`$/.test(part)) {
//       return (
//         <code key={i} className="px-1.5 py-0.5 rounded text-xs font-mono bg-primary/10 text-primary border border-primary/20">
//           {part.slice(1, -1)}
//         </code>
//       )
//     }
//     // Bold: **text** or __text__
//     if (/^\*\*[^*]+\*\*$/.test(part) || /^__[^_]+__$/.test(part)) {
//       return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
//     }
//     // Italic: *text* or _text_
//     if (/^\*[^*]+\*$/.test(part) || /^_[^_]+_$/.test(part)) {
//       return <em key={i} className="italic text-foreground/90">{part.slice(1, -1)}</em>
//     }
//     // Strikethrough: ~~text~~
//     if (/^~~[^~]+~~$/.test(part)) {
//       return <s key={i} className="text-muted-foreground">{part.slice(2, -2)}</s>
//     }
//     return <span key={i}>{part}</span>
//   })
// }

"use client"

import React from "react"
import { cn } from "@/lib/utils"

type Props = {
  content: string
  className?: string
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    // markdown links [text](url)
    const linkMatch = remaining.match(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/)
    const boldMatch = remaining.match(/\*\*(.*?)\*\*/)
    const codeMatch = remaining.match(/`([^`]+)`/)

    const matches = [
      linkMatch ? { type: "link", index: linkMatch.index ?? -1, match: linkMatch } : null,
      boldMatch ? { type: "bold", index: boldMatch.index ?? -1, match: boldMatch } : null,
      codeMatch ? { type: "code", index: codeMatch.index ?? -1, match: codeMatch } : null,
    ].filter(Boolean) as { type: string; index: number; match: RegExpMatchArray }[]

    if (matches.length === 0) {
      parts.push(<React.Fragment key={key++}>{remaining}</React.Fragment>)
      break
    }

    matches.sort((a, b) => a.index - b.index)
    const first = matches[0]

    if (first.index > 0) {
      parts.push(
        <React.Fragment key={key++}>
          {remaining.slice(0, first.index)}
        </React.Fragment>
      )
    }

    if (first.type === "link") {
      const [, label, url] = first.match
      parts.push(
        <a
          key={key++}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-4 break-all hover:opacity-80"
        >
          {label}
        </a>
      )
    } else if (first.type === "bold") {
      const [, value] = first.match
      parts.push(
        <strong key={key++} className="font-semibold">
          {value}
        </strong>
      )
    } else if (first.type === "code") {
      const [, value] = first.match
      parts.push(
        <code
          key={key++}
          className="rounded bg-black/20 px-1.5 py-0.5 text-[0.95em]"
        >
          {value}
        </code>
      )
    }

    remaining = remaining.slice(first.index + first.match[0].length)
  }

  return parts
}

export function MarkdownRenderer({ content, className }: Props) {
  const lines = content.split("\n")
  const elements: React.ReactNode[] = []

  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()

    if (!line) {
      i++
      continue
    }

    // horizontal rule
    if (line === "---") {
      elements.push(<hr key={`hr-${i}`} className="my-4 border-white/10" />)
      i++
      continue
    }

    // headings
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={`h3-${i}`} className="mt-4 mb-2 text-base font-semibold">
          {renderInline(line.replace(/^### /, ""))}
        </h3>
      )
      i++
      continue
    }

    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={`h2-${i}`} className="mt-4 mb-2 text-lg font-semibold">
          {renderInline(line.replace(/^## /, ""))}
        </h2>
      )
      i++
      continue
    }

    // unordered list
    if (line.startsWith("- ")) {
      const items: React.ReactNode[] = []
      let j = i

      while (j < lines.length && lines[j].trim().startsWith("- ")) {
        items.push(
          <li key={`ul-${j}`} className="ml-5 list-disc">
            {renderInline(lines[j].trim().replace(/^- /, ""))}
          </li>
        )
        j++
      }

      elements.push(
        <ul key={`ul-wrap-${i}`} className="my-2 space-y-1">
          {items}
        </ul>
      )

      i = j
      continue
    }

    // ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: React.ReactNode[] = []
      let j = i

      while (j < lines.length && /^\d+\.\s/.test(lines[j].trim())) {
        items.push(
          <li key={`ol-${j}`} className="ml-5 list-decimal">
            {renderInline(lines[j].trim().replace(/^\d+\.\s/, ""))}
          </li>
        )
        j++
      }

      elements.push(
        <ol key={`ol-wrap-${i}`} className="my-2 space-y-1">
          {items}
        </ol>
      )

      i = j
      continue
    }

    // blockquote
    if (line.startsWith("> ")) {
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="my-3 border-l-2 border-primary/50 pl-4 text-muted-foreground"
        >
          {renderInline(line.replace(/^> /, ""))}
        </blockquote>
      )
      i++
      continue
    }

    // paragraph
    elements.push(
      <p key={`p-${i}`} className="my-2 leading-7">
        {renderInline(line)}
      </p>
    )
    i++
  }

  return <div className={cn("text-sm md:text-base", className)}>{elements}</div>
}