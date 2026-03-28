"use client"

import { useEffect, useMemo, useState } from "react"
import { UserCircle2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

type UserAvatarProps = {
  src?: string | null
  alt?: string
  className?: string
  iconClassName?: string
}

export function UserAvatar({ src, alt = "User avatar", className, iconClassName }: UserAvatarProps) {
  const normalizedSrc = useMemo(() => {
    if (!src) return null
    const value = String(src).trim()
    if (!value || value === "null" || value === "undefined") return null
    return value
  }, [src])

  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    setImageError(false)
  }, [normalizedSrc])

  const showImage = Boolean(normalizedSrc) && !imageError

  return (
    <Avatar className={className}>
      {showImage ? (
        <AvatarImage
          key={normalizedSrc}
          src={normalizedSrc}
          alt={alt}
          onError={() => setImageError(true)}
        />
      ) : null}

      <AvatarFallback className="bg-secondary text-muted-foreground">
        <UserCircle2 className={cn("h-[70%] w-[70%]", iconClassName)} />
      </AvatarFallback>
    </Avatar>
  )
}