"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import { useUser } from "@/hooks/use-user"
import { getSupabaseBrowserClient } from "@/lib/supabase-client"

const navItems = [
  { label: "Home", href: "/" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blogs", href: "/blogs" },
  { label: "Help Center", href: "/help-center" },
  { label: "Contact", href: "/contact" },
]

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { profile, email, fullName, isLoading, error } = useUser()

  const authReady = !isLoading
  const isAuthenticated = !isLoading && error !== "not_authenticated" && Boolean(email)
  const authUser = isAuthenticated
    ? {
        email: email ?? null,
        fullName: fullName || profile?.full_name || email?.split("@")[0] || "User",
        avatarUrl: profile?.avatar_url ?? null,
      }
    : null

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      await getSupabaseBrowserClient().auth.signOut()
    } catch {
      // no-op
    } finally {
      try {
        localStorage.setItem("edupilot-user-refresh", String(Date.now()))
      } catch {}
      router.push("/")
      router.refresh()
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Logo size="md" href={authUser ? "/dashboard" : "/"} />

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
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

                <Button
                  asChild
                  className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90"
                >
                  <Link href="/dashboard">Get Started</Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>

                <Button
                  asChild
                  className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90"
                >
                  <Link href="/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>

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

      {mobileMenuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="container mx-auto flex flex-col gap-1 p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}

            <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
              {!authReady ? (
                <div className="h-10 rounded-lg bg-secondary animate-pulse" />
              ) : authUser ? (
                <>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                      Profile
                    </Link>
                  </Button>

                  <Button asChild className="w-full bg-gradient-to-r from-primary to-accent">
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      Get Started
                    </Link>
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full text-destructive"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      Sign In
                    </Link>
                  </Button>

                  <Button asChild className="w-full bg-gradient-to-r from-primary to-accent">
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                      Get Started
                    </Link>
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