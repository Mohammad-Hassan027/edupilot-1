"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X, User, LogOut, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { getSupabaseBrowserClient } from "@/lib/supabase-client"

const navItems = [
  { label: "Home",        href: "/" },
  { label: "Dashboard",   href: "/dashboard" },
  { label: "Pricing",     href: "/pricing" },
  { label: "Blogs",       href: "/blogs" },
  { label: "Help Center", href: "/help-center" },
  { label: "Contact",     href: "/contact" },
]

interface AuthUser {
  email: string | null
  fullName: string | null
  avatarUrl: string | null
}

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [authUser, setAuthUser]             = useState<AuthUser | null>(null)
  const [authReady, setAuthReady]           = useState(false)
  const pathname = usePathname()
  const router   = useRouter()

  useEffect(() => {
    // Get initial session instantly from local storage (no network call)
    getSupabaseBrowserClient().auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = session.user
        const name =
          u.user_metadata?.full_name ||
          u.user_metadata?.name ||
          u.email?.split("@")[0] ||
          "User"
        setAuthUser({ email: u.email ?? null, fullName: name, avatarUrl: u.user_metadata?.avatar_url ?? null })
      }
      setAuthReady(true)
    })

    // Listen to auth state changes (login/logout)
    const { data: { subscription } } = getSupabaseBrowserClient().auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = session.user
        const name =
          u.user_metadata?.full_name ||
          u.user_metadata?.name ||
          u.email?.split("@")[0] ||
          "User"
        setAuthUser({ email: u.email ?? null, fullName: name, avatarUrl: u.user_metadata?.avatar_url ?? null })
      } else {
        setAuthUser(null)
      }
      setAuthReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setAuthUser(null)
    router.push("/")
    router.refresh()
  }

  const initials = authUser?.fullName
    ?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U"

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Logo size="md" href={authUser ? "/dashboard" : "/"} />

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}
              className={cn("px-3 py-2 text-sm font-medium transition-colors rounded-lg",
                pathname === item.href ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden items-center gap-2 sm:flex">
            {!authReady ? (
                <div className="h-8 w-20 rounded-lg bg-secondary animate-pulse" />
              ) : authUser ? (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/profile">Profile</Link>
                  </Button>

                  <Button asChild className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground">
                    <Link href="/dashboard">Get Started</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/login">Sign In</Link>
                  </Button>

                  <Button asChild className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground">
                    <Link href="/register">Get Started</Link>
                  </Button>
                </>
              )}
          </div>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="container mx-auto flex flex-col gap-1 p-4">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}
                className={cn("px-3 py-2.5 text-sm font-medium transition-colors rounded-lg",
                  pathname === item.href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}>
                {item.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
              {authUser ? (
                <>
                  <div className="rounded-xl border border-border bg-secondary/60 px-3 py-2 text-sm">
                    Signed in as <span className="font-semibold text-foreground">{authUser.fullName}</span>
                  </div>
                  <Button asChild variant="outline" className="w-full"><Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link></Button>
                  <Button asChild className="w-full bg-gradient-to-r from-primary to-accent"><Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>Get Started</Link></Button>
                  <Button variant="ghost" className="w-full text-destructive" onClick={handleLogout}>Logout</Button>
                </>
              ) : (
                <>
                  <Button variant="outline" asChild className="w-full"><Link href="/login">Sign In</Link></Button>
                  <Button asChild className="w-full bg-gradient-to-r from-primary to-accent"><Link href="/register">Get Started</Link></Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
