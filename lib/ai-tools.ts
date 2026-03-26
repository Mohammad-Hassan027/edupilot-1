import JSZip from "jszip"

export type UploadedAttachment = {
  name: string
  url: string
  type: string
  size?: number
}

export interface TavilySearchResult {
  title: string
  url: string
  content: string
  source: string
}

interface GeminiInlinePart {
  inlineData: {
    mimeType: string
    data: string
  }
}

const MAX_ATTACHMENT_BYTES = 18 * 1024 * 1024
const OFFICE_TEXT_MIME = "text/plain"

function getGeminiKey() {
  const key = process.env.GEMINI_API_KEY?.trim()
  if (!key) {
    throw new Error("GEMINI_API_KEY is not set")
  }
  return key
}

function normalizeMimeType(fileName: string, mimeType?: string) {
  const normalized = (mimeType || "").trim().toLowerCase()
  const extension = fileName.split(".").pop()?.toLowerCase() || ""

  const byExtension: Record<string, string> = {
    txt: "text/plain",
    md: "text/markdown",
    csv: "text/csv",
    json: "application/json",
    pdf: "application/pdf",

    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",

    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

    zip: "application/zip",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
    svg: "image/svg+xml",
    ts: "text/plain",
    tsx: "text/plain",
    js: "text/plain",
    jsx: "text/plain",
    py: "text/plain",
    java: "text/plain",
    c: "text/plain",
    cpp: "text/plain",
    cs: "text/plain",
    html: "text/html",
    css: "text/css",
    xml: "application/xml",
    yml: "text/plain",
    yaml: "text/plain",
    sql: "text/plain",
  }

  const correctedMimeAliases: Record<string, string> = {
    "application/vnd.openxmlformats-officedocument.wordprocessingml.documents":
      byExtension.docx,
    "application/vnd.openxmlformats-officedocument.presentationml.presentations":
      byExtension.pptx,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheets":
      byExtension.xlsx,
  }

  if (normalized && normalized !== "application/octet-stream") {
    return correctedMimeAliases[normalized] || normalized
  }

  return byExtension[extension] || "application/octet-stream"
}

function isGeminiFriendlyMimeType(mimeType: string) {
  return (
    mimeType.startsWith("text/") ||
    mimeType.startsWith("image/") ||
    mimeType === "application/pdf" ||
    mimeType === "application/json" ||
    mimeType === "application/xml" ||
    mimeType === "application/zip" ||
    mimeType === "application/x-zip-compressed" ||
    mimeType === "application/msword" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/vnd.ms-powerpoint" ||
    mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    mimeType === "application/vnd.ms-excel" ||
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/octet-stream"
  )
}

function decodeXmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function cleanExtractedText(value: string) {
  return value
    .replace(/\r/g, "")
    .replace(/\u0000/g, " ")
    .replace(/[\t\f\v]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ ]{2,}/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
    .trim()
}

function extractReadableStrings(raw: string) {
  const normalized = raw
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, " ")
    .replace(/[ ]{2,}/g, " ")

  const matches = normalized.match(/[\p{L}\p{N}][\p{L}\p{N}\p{P}\p{Zs}]{3,}/gu) || []
  const unique: string[] = []
  const seen = new Set<string>()

  for (const item of matches) {
    const cleaned = item.trim()
    if (!cleaned) continue
    const key = cleaned.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(cleaned)
    if (unique.length >= 400) break
  }

  return cleanExtractedText(unique.join("\n"))
}

async function extractDocxText(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer)
  const candidateFiles = [
    "word/document.xml",
    "word/header1.xml",
    "word/header2.xml",
    "word/header3.xml",
    "word/footer1.xml",
    "word/footer2.xml",
    "word/footer3.xml",
    "word/footnotes.xml",
    "word/endnotes.xml",
  ]

  const parts: string[] = []

  for (const fileName of candidateFiles) {
    const file = zip.file(fileName)
    if (!file) continue

    const xml = await file.async("string")
    const withBreaks = xml
      .replace(/<w:tab\/?\s*>/g, "\t")
      .replace(/<w:br\/?\s*>/g, "\n")
      .replace(/<w:cr\/?\s*>/g, "\n")
      .replace(/<\/w:p>/g, "\n")

    const text = Array.from(withBreaks.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g))
      .map((match) => decodeXmlEntities(match[1]))
      .join("")

    if (text.trim()) {
      parts.push(text)
    }
  }

  return cleanExtractedText(parts.join("\n\n"))
}

async function extractPptxText(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer)
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/(slides|notesSlides)\/.+\.xml$/i.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

  const slides: string[] = []

  for (const fileName of slideFiles) {
    const xml = await zip.file(fileName)?.async("string")
    if (!xml) continue

    const text = Array.from(xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g))
      .map((match) => decodeXmlEntities(match[1]))
      .join("\n")

    if (text.trim()) {
      slides.push(text)
    }
  }

  return cleanExtractedText(slides.join("\n\n---\n\n"))
}

function extractLegacyOfficeText(buffer: Buffer) {
  const utf16 = extractReadableStrings(buffer.toString("utf16le"))
  if (utf16) return utf16

  const latin1 = extractReadableStrings(buffer.toString("latin1"))
  if (latin1) return latin1

  return ""
}

async function convertOfficeFileToText(buffer: Buffer, attachment: UploadedAttachment, mimeType: string) {
  const extension = attachment.name.split(".").pop()?.toLowerCase() || ""
  let text = ""

  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || extension === "docx") {
    text = await extractDocxText(buffer)
  } else if (
    mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    extension === "pptx"
  ) {
    text = await extractPptxText(buffer)
  } else if (mimeType === "application/msword" || extension === "doc") {
    text = extractLegacyOfficeText(buffer)
  } else if (mimeType === "application/vnd.ms-powerpoint" || extension === "ppt") {
    text = extractLegacyOfficeText(buffer)
  }

  const cleaned = cleanExtractedText(text)
  if (!cleaned) {
    throw new Error(`${attachment.name} could not be read. Please re-save it as DOCX, PPTX, or PDF and try again.`)
  }

  return {
    inlineData: {
      mimeType: OFFICE_TEXT_MIME,
      data: Buffer.from(`File: ${attachment.name}\n\n${cleaned}`, "utf8").toString("base64"),
    },
  }
}

async function fetchAttachmentPart(attachment: UploadedAttachment): Promise<GeminiInlinePart | null> {
  if (!attachment.url) return null

  const response = await fetch(attachment.url)
  if (!response.ok) {
    throw new Error(`Failed to fetch uploaded file: ${attachment.name}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  if (!arrayBuffer.byteLength) {
    return null
  }

  if (arrayBuffer.byteLength > MAX_ATTACHMENT_BYTES) {
    throw new Error(`${attachment.name} is too large to analyze right now. Please keep files under 18 MB each.`)
  }

  const mimeType = normalizeMimeType(
    attachment.name,
    attachment.type || response.headers.get("content-type") || undefined
  )

  const buffer = Buffer.from(arrayBuffer)

  if (
    mimeType === "application/msword" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/vnd.ms-powerpoint" ||
    mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    return convertOfficeFileToText(buffer, attachment, mimeType)
  }

  if (!isGeminiFriendlyMimeType(mimeType)) {
    throw new Error(`${attachment.name} has an unsupported file type for AI analysis.`)
  }

  return {
    inlineData: {
      mimeType,
      data: buffer.toString("base64"),
    },
  }
}

function extractTextFromGeminiResponse(payload: unknown) {
  const data = payload as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string
          inlineData?: { mimeType?: string; data?: string }
        }>
      }
    }>
  }

  const texts: string[] = []

  for (const candidate of data.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      if (typeof part.text === "string" && part.text.trim()) {
        texts.push(part.text.trim())
      }
    }
  }

  return texts.join("\n\n").trim()
}

export async function generateImageWithGemini(prompt: string) {
  const key = getGeminiKey()
  const models = ["gemini-2.5-flash-image", "gemini-3.1-flash-image-preview"]

  let lastError = "Failed to generate image"

  for (const model of models) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": key,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig:
            model === "gemini-2.5-flash-image"
              ? {
                  imageConfig: {
                    aspectRatio: "1:1",
                  },
                }
              : {
                  responseModalities: ["IMAGE"],
                },
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      lastError = data?.error?.message || lastError
      continue
    }

    const candidates = Array.isArray(data?.candidates) ? data.candidates : []
    for (const candidate of candidates) {
      const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : []
      for (const part of parts) {
        const inlineData = part?.inlineData
        if (inlineData?.data && inlineData?.mimeType) {
          return `data:${inlineData.mimeType};base64,${inlineData.data}`
        }
      }
    }

    lastError = "Gemini did not return an image for this prompt."
  }

  throw new Error(lastError)
}

export async function analyzeAttachmentsWithGemini(params: {
  message: string
  attachments: UploadedAttachment[]
  webContext?: string
}) {
  const key = getGeminiKey()
  const message = params.message.trim() || "Please review the uploaded files and answer clearly."
  const inlineParts = (await Promise.all(params.attachments.map(fetchAttachmentPart))).filter(
    (part): part is GeminiInlinePart => Boolean(part)
  )

  if (!inlineParts.length) {
    throw new Error("No readable uploaded files were found.")
  }

  const prompt = [
    "You are EduPilot, an AI tutor helping a student understand uploaded study material.",
    "Read the uploaded files carefully and answer the user in a clear, structured way.",
    "If the upload is a ZIP, inspect whatever content is available inside it and explain the important files first.",
    "For DOC, DOCX, PPT, and PPTX uploads, the file may be pre-converted into plain text before reaching you, so preserve the original meaning even if formatting is simplified.",
    "If the user asked a question, answer it directly. If not, summarize the uploaded material and suggest next study steps.",
    params.webContext ? `Web search notes for extra context:\n${params.webContext}` : "",
    `User request: ${message}`,
  ]
    .filter(Boolean)
    .join("\n\n")

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }, ...inlineParts],
          },
        ],
      }),
    }
  )

  const payload = await response.json()

  if (!response.ok) {
    const message = payload?.error?.message || "Failed to analyze uploaded files with Gemini."
    throw new Error(message)
  }

  const text = extractTextFromGeminiResponse(payload)
  if (!text) {
    throw new Error("Gemini returned an empty analysis for the uploaded files.")
  }

  return text
}

export async function searchWithTavily(query: string): Promise<TavilySearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY?.trim()
  if (!apiKey || !query.trim()) return []

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "advanced",
        max_results: 5,
        include_answer: false,
        include_raw_content: false,
      }),
    })

    if (!response.ok) {
      return []
    }

    const data = (await response.json()) as {
      results?: Array<{
        title?: string
        url?: string
        content?: string
        score?: number
      }>
    }

    return (data.results || []).map((item) => ({
      title: item.title || "Untitled result",
      url: item.url || "",
      content: item.content || "",
      source: item.url || "Web",
    }))
  } catch {
    return []
  }
}

export function summarizeAttachments(attachments: UploadedAttachment[]) {
  if (!attachments.length) return "No files uploaded."

  return attachments
    .map((attachment, index) => {
      const sizeLabel = attachment.size ? ` (${(attachment.size / 1024 / 1024).toFixed(2)} MB)` : ""
      return `${index + 1}. ${attachment.name}${sizeLabel}`
    })
    .join("\n")
}
