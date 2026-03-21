import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"

// Routes that require authentication
const PROTECTED_ROUTES = [
  "/notes",
  "/flashcards",
  "/ai-voice",
  "/quiz",
  "/planner",
  "/profile",
  "/settings",
  "/billing",
  "/analytics",
  "/ai-tutor",
  "/time-tracking",
  "/marketplace",
]

// Routes that guests CAN view (dashboard is viewable but features gated)
const GUEST_ALLOWED = [
  "/dashboard",
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/blogs",
  "/pricing",
  "/features",
  "/help-center",
  "/contact",
  "/privacy-policy",
  "/terms-of-service",
  "/cookie-policy",
  "/auth/callback",
]

export async function middleware(req: NextRequest) {
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

  // Create Supabase client at edge
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

  // If trying to access a protected route without auth → redirect to login
  const isProtected = PROTECTED_ROUTES.some(route => pathname === route || pathname.startsWith(route + "/"))
  if (isProtected && !user) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("redirected", "1")
    return NextResponse.redirect(loginUrl)
  }

  // If already logged in and trying to access auth pages → redirect to dashboard
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
