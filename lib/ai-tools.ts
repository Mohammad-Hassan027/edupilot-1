export interface UploadedAttachment {
  name: string
  url?: string
  type: string
  size: number
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

function getGeminiKey() {
  const key = process.env.GEMINI_API_KEY?.trim()
  if (!key) {
    throw new Error("GEMINI_API_KEY is not set")
  }
  return key
}

function normalizeMimeType(fileName: string, mimeType?: string) {
  const normalized = (mimeType || "").trim().toLowerCase()
  if (normalized && normalized !== "application/octet-stream") {
    return normalized
  }

  const extension = fileName.split(".").pop()?.toLowerCase() || ""
  const byExtension: Record<string, string> = {
    txt: "text/plain",
    md: "text/markdown",
    csv: "text/csv",
    json: "application/json",
    pdf: "application/pdf",
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
    mimeType === "application/octet-stream"
  )
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

  if (!isGeminiFriendlyMimeType(mimeType)) {
    throw new Error(`${attachment.name} has an unsupported file type for AI analysis.`)
  }

  return {
    inlineData: {
      mimeType,
      data: Buffer.from(arrayBuffer).toString("base64"),
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
            parts: [...inlineParts, { text: prompt }],
          },
        ],
      }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    const message = data?.error?.message || "Failed to analyze uploaded files with Gemini."
    throw new Error(message)
  }

  const text = extractTextFromGeminiResponse(data)
  if (!text) {
    throw new Error("Gemini could not generate a readable answer for the uploaded files.")
  }

  return text
}

export function summarizeAttachments(attachments: UploadedAttachment[]) {
  if (!attachments.length) return ""

  return attachments
    .map((file, index) => {
      const sizeInKb = Math.max(1, Math.round(file.size / 1024))
      const urlText = file.url ? ` | URL: ${file.url}` : ""
      return `${index + 1}. ${file.name} (${file.type || "unknown"}, ${sizeInKb} KB)${urlText}`
    })
    .join("\n")
}

export async function searchWithTavily(query: string): Promise<TavilySearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY is not set")
  }

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      search_depth: "basic",
      max_results: 5,
      include_answer: false,
      include_raw_content: false,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Tavily search failed (${response.status}): ${errorText}`)
  }

  const data = (await response.json()) as {
    results?: Array<{ title?: string; url?: string; content?: string }>
  }

  return (data.results || [])
    .filter((item) => item.url)
    .map((item) => ({
      title: item.title?.trim() || "Untitled result",
      url: item.url!.trim(),
      content: item.content?.trim() || "",
      source: new URL(item.url!).hostname.replace(/^www\./, ""),
    }))
}
