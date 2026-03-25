import Link from "next/link"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  showText?: boolean
  size?: "sm" | "md" | "lg"
  href?: string   // caller passes the destination - no async needed
}

export function Logo({ className, showText = true, size = "md", href = "/" }: LogoProps) {
  const sizeClasses     = { sm: "h-8 w-8",  md: "h-10 w-10", lg: "h-12 w-12" }
  const textSizeClasses = { sm: "text-lg",   md: "text-xl",   lg: "text-2xl"  }

  return (
    <Link href={href} className={cn("flex items-center gap-2.5 group min-w-0 shrink-0", className)}>  
      <div
        className={cn(
          "relative shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary to-accent shadow-lg transition-all duration-300 group-hover:shadow-primary/25 group-hover:scale-105",
          sizeClasses[size]
        )}
      >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary to-accent opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-50" />
        <svg viewBox="0 0 24 24" fill="none" className="relative z-10 h-1/2 w-1/2"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L12 6"              className="text-primary-foreground" />
          <path d="M12 18L12 22"            className="text-primary-foreground" />
          <path d="M4.93 4.93L7.76 7.76"   className="text-primary-foreground" />
          <path d="M16.24 16.24L19.07 19.07" className="text-primary-foreground" />
          <path d="M2 12L6 12"              className="text-primary-foreground" />
          <path d="M18 12L22 12"            className="text-primary-foreground" />
          <circle cx="12" cy="12" r="4"    className="text-primary-foreground fill-primary-foreground/20" />
          <circle cx="12" cy="12" r="1.5"  className="text-primary-foreground fill-primary-foreground" />
        </svg>
      </div>
      {showText && (
        <div className={cn("min-w-0 flex items-center gap-0.5 font-bold", textSizeClasses[size])}>
          <span className="text-foreground">Edu</span>
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Pilot</span>
        </div>
      )}
    </Link>
  )
}
