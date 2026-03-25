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

function getPollinationsToken() {
  return process.env.POLLINATIONS_API_KEY?.trim() || ""
}

export function buildPollinationsImageUrl(prompt: string) {
  const encodedPrompt = encodeURIComponent(prompt.trim())
  const token = getPollinationsToken()
  const params = new URLSearchParams({ width: "1024", height: "1024", model: "flux" })
  if (token) params.set("token", token)
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?${params.toString()}`
}

export function buildPollinationsVideoUrl(prompt: string) {
  const encodedPrompt = encodeURIComponent(prompt.trim())
  const token = getPollinationsToken()
  const params = new URLSearchParams({ model: "video", width: "1024", height: "576" })
  if (token) params.set("token", token)
  return `https://pollinations.ai/p/${encodedPrompt}?${params.toString()}`
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
