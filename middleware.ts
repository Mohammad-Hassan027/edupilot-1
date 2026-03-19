import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"

const PROTECTED_ROUTES = [
  "/dashboard",
  "/ai-tutor",
  "/flashcards",
  "/notes",
  "/quiz",
  "/planner",
  "/profile",
  "/settings",
  "/billing",
  "/analytics",
  "/ai-voice",
  "/marketplace",
  "/time-tracking",
]

const AUTH_ROUTES = ["/login", "/register", "/forgot-password"]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Build a response we can mutate for cookie handling
  let response = NextResponse.next({
    request: { headers: req.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value
        },
        set(name, value, options) {
          req.cookies.set(name, value)
          response.cookies.set(name, value, options)
        },
        remove(name, options) {
          req.cookies.set(name, "")
          response.cookies.set(name, "", options)
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route))

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !session) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, public assets
     * - api routes (handled individually)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
