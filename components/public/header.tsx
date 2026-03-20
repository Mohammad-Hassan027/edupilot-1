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
  const [authLoading, setAuthLoading]       = useState(true)
  const pathname = usePathname()
  const router   = useRouter()

  // Check auth state on mount
  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => {
        if (!r.ok) { setAuthUser(null); return null }
        return r.json()
      })
      .then((data) => {
        if (!data) return
        const p = data.data.profile
        const e = data.data.email
        const n = p?.full_name || data.data.authName || e?.split("@")[0] || "User"
        setAuthUser({ email: e, fullName: n, avatarUrl: p?.avatar_url || null })
      })
      .catch(() => setAuthUser(null))
      .finally(() => setAuthLoading(false))
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
        {/* Logo — goes to dashboard if logged in, home if not */}
        <Link href={authUser ? "/dashboard" : "/"} className="flex items-center gap-2.5 group">
          <Logo size="md" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-3 py-2 text-sm font-medium transition-colors rounded-lg",
                pathname === item.href
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* Auth buttons — desktop */}
          <div className="hidden items-center gap-2 sm:flex">
            {authLoading ? (
              <div className="h-8 w-20 rounded-lg bg-secondary animate-pulse" />
            ) : authUser ? (
              // ── Logged in: show user dropdown ─────────────────────────
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 hover:border-primary/50 transition-all cursor-pointer">
                    <Avatar className="h-7 w-7">
                      <AvatarImage
                        src={authUser.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser.email}`}
                        alt={authUser.fullName ?? "User"}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground max-w-[120px] truncate">
                      {authUser.fullName}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="h-4 w-4" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive cursor-pointer"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              // ── Not logged in: show Sign In / Get Started ─────────────
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

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="container mx-auto flex flex-col gap-1 p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "px-3 py-2.5 text-sm font-medium transition-colors rounded-lg",
                  pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
              {authUser ? (
                <>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      Dashboard
                    </Link>
                  </Button>
                  <Button variant="ghost" className="w-full text-destructive" onClick={handleLogout}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button asChild className="w-full bg-gradient-to-r from-primary to-accent">
                    <Link href="/register">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
