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
  "/revision",
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

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return req.cookies.get(name)?.value },
        set(name, value, options) { res.cookies.set(name, value, options) },
        remove(name, options) { res.cookies.set(name, "", { ...options, maxAge: 0 }) },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

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
