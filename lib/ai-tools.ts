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

function getPollinationsKey() {
  return process.env.POLLINATIONS_API_KEY?.trim() || ""
}

function buildPollinationsMediaUrl(prompt: string, params: Record<string, string>) {
  const encodedPrompt = encodeURIComponent(prompt.trim())
  const searchParams = new URLSearchParams(params)
  const key = getPollinationsKey()

  if (key) {
    searchParams.set("key", key)
  }

  return `https://gen.pollinations.ai/image/${encodedPrompt}?${searchParams.toString()}`
}

export function buildPollinationsImageUrl(prompt: string) {
  return buildPollinationsMediaUrl(prompt, {
    model: "flux",
    width: "1024",
    height: "1024",
    enhance: "true",
    safe: "false",
    nologo: "true",
    seed: "-1",
  })
}

export function buildPollinationsVideoUrl(prompt: string) {
  return buildPollinationsMediaUrl(prompt, {
    model: "wan-fast",
    width: "832",
    height: "480",
    duration: "5",
    aspectRatio: "16:9",
    enhance: "true",
    safe: "false",
    nologo: "true",
    seed: "-1",
  })
}

export function summarizeAttachments(attachments: UploadedAttachment[]) {
  if (!attachments.length) return ""

  return attachments
    .map((file, index) => {
      const sizeInKb = Math.max(1, Math.round(file.size / 1024))
      const urlText = file.url ? ` | URL: ${file.url}` : ""
      return `${index + 1}. ${file.name} (${file.type}, ${sizeInKb} KB)${urlText}`
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
