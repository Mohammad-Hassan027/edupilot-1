import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"

const PROTECTED_ROUTES = [
  "/notes",
  "/flashcards",
  "/ai-voice",
  "/quiz",
  "/planner",
  "/concept-map",
  "/profile",
  "/settings",
  "/billing",
  "/analytics",
  "/time-tracking",
  "/marketplace",
  "/topic-analyzer",
  "/goals",
  "/document-chat",
  "/essay-grader",
]

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip API routes, static files, Next.js internals
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  const res = NextResponse.next()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  let supabase: ReturnType<typeof createServerClient>

  // Defensive guardrail against unconfigured environments or broken strings
  if (!url || !anonKey || url.includes("obesllmvoplvkzjltuns")) {
    console.error(
      "❌ [Proxy Server]: Supabase initialization blocked. Server environment variables are missing or point to a broken instance."
    )
    
    // Fall back to a placeholder client structure so Next.js server runtime doesn't crash
    supabase = createServerClient(
      "https://placeholder-invalid-domain.supabase.co",
      "placeholder-anon-key",
      {
        cookies: {
          get(name) { return req.cookies.get(name)?.value },
          set(name, value, options) { res.cookies.set(name, value, options) },
          remove(name, options) { res.cookies.set(name, "", { ...options, maxAge: 0 }) },
        },
      }
    )
  } else {
    // Original initialization block running safely when credentials are valid
    supabase = createServerClient(
      url,
      anonKey,
      {
        cookies: {
          get(name) { return req.cookies.get(name)?.value },
          set(name, value, options) { res.cookies.set(name, value, options) },
          remove(name, options) { res.cookies.set(name, "", { ...options, maxAge: 0 }) },
        },
      }
    )
  }

  // Wrapped in a try/catch block to prevent broken placeholder operations from throwing unhandled execution exceptions
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (err) {
    console.warn("⚠️ [Proxy Server]: Could not fetch user profile from Supabase instance.")
  }

  // Protected routes → redirect to login if not authenticated
  const isProtected = PROTECTED_ROUTES.some(
    route => pathname === route || pathname.startsWith(route + "/")
  )
  if (isProtected && !user) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("redirected", "1")
    return NextResponse.redirect(loginUrl)
  }

  // Already logged in → don't show login/register pages
  if (user && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return res
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
