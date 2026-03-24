type ResourceLink = {
  title: string
  url: string
  source: string
}

function normalizeQuery(query: string) {
  return query.trim().replace(/\s+/g, " ")
}

function isProgrammingTopic(query: string) {
  const q = query.toLowerCase()
  const keywords = [
    "api", "rest", "javascript", "typescript", "react", "next.js", "nextjs",
    "node", "express", "html", "css", "sql", "python", "java", "c++",
    "http", "json", "backend", "frontend", "database", "supabase", "mongodb",
    "auth", "oauth", "token", "jwt", "programming", "coding", "web development"
  ]

  return keywords.some((k) => q.includes(k))
}

export function buildResourceLinks(question: string): ResourceLink[] {
  const query = normalizeQuery(question)
  const encoded = encodeURIComponent(query)

  const common: ResourceLink[] = [
    {
      title: `Wikipedia: ${query}`,
      url: `https://en.wikipedia.org/w/index.php?search=${encoded}`,
      source: "Wikipedia",
    },
    {
      title: `YouTube learning videos: ${query}`,
      url: `https://www.youtube.com/results?search_query=${encoded}`,
      source: "YouTube",
    },
    {
      title: `Google Scholar: ${query}`,
      url: `https://scholar.google.com/scholar?q=${encoded}`,
      source: "Google Scholar",
    },
  ]

  if (isProgrammingTopic(query)) {
    return [
      {
        title: `MDN Web Docs: ${query}`,
        url: `https://developer.mozilla.org/en-US/search?q=${encoded}`,
        source: "MDN",
      },
      {
        title: `freeCodeCamp: ${query}`,
        url: `https://www.google.com/search?q=site%3Afreecodecamp.org+${encoded}`,
        source: "freeCodeCamp",
      },
      {
        title: `Stack Overflow: ${query}`,
        url: `https://stackoverflow.com/search?q=${encoded}`,
        source: "Stack Overflow",
      },
      ...common,
    ].slice(0, 5)
  }

  return [
    {
      title: `Khan Academy: ${query}`,
      url: `https://www.google.com/search?q=site%3Akhanacademy.org+${encoded}`,
      source: "Khan Academy",
    },
    {
      title: `Coursera: ${query}`,
      url: `https://www.google.com/search?q=site%3Acoursera.org+${encoded}`,
      source: "Coursera",
    },
    ...common,
  ].slice(0, 5)
}