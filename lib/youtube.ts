import { YoutubeTranscript } from "youtube-transcript"

export function extractYouTubeId(url: string) {
  try {
    const parsed = new URL(url)

    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace(/^\/+/, "")
    }

    if (parsed.hostname.includes("youtube.com")) {
      return parsed.searchParams.get("v") || ""
    }

    return ""
  } catch {
    return ""
  }
}

export async function getYouTubeTranscriptText(videoUrl: string) {
  const videoId = extractYouTubeId(videoUrl)

  if (!videoId) {
    throw new Error("Invalid YouTube URL.")
  }

  const transcript = await YoutubeTranscript.fetchTranscript(videoId)

  if (!Array.isArray(transcript) || !transcript.length) {
    throw new Error("Transcript not available for this video.")
  }

  return transcript
    .map((item) => item.text?.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
}