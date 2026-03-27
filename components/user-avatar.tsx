"use client"

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
  const hasImage = Boolean(src)

  return (
    <Avatar className={className}>
      {hasImage ? <AvatarImage src={src ?? undefined} alt={alt} /> : null}
      <AvatarFallback className="bg-secondary text-muted-foreground">
        <UserCircle2 className={cn("h-[70%] w-[70%]", iconClassName)} />
      </AvatarFallback>
    </Avatar>
  )
}
