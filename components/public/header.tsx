"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Logo size="md" />

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
          
          <div className="hidden items-center gap-2 sm:flex">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground">
              <Link href="/register">Get Started</Link>
            </Button>
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
              <Button variant="outline" asChild className="w-full">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild className="w-full bg-gradient-to-r from-primary to-accent">
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
