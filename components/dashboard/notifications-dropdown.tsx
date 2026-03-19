"use client"

import { useState } from "react"
import { Bell, X, CheckCircle, AlertCircle, Info, Zap, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: "success" | "warning" | "info" | "achievement"
  title: string
  message: string
  timestamp: string
  read: boolean
  icon?: React.ReactNode
}

const defaultNotifications: Notification[] = [
  {
    id: "1",
    type: "achievement",
    title: "Streak Milestone!",
    message: "You've reached a 12-day learning streak! Keep it up!",
    timestamp: "2 hours ago",
    read: false,
    icon: <Zap className="h-4 w-4 text-amber-500" />,
  },
  {
    id: "2",
    type: "success",
    title: "Study Goal Completed",
    message: "You've completed today's 4-hour study target. Great job!",
    timestamp: "4 hours ago",
    read: false,
    icon: <CheckCircle className="h-4 w-4 text-emerald-500" />,
  },
  {
    id: "3",
    type: "info",
    title: "AI Study Plan Ready",
    message: "Your personalized study plan has been generated based on your learning patterns.",
    timestamp: "1 day ago",
    read: true,
    icon: <Info className="h-4 w-4 text-blue-500" />,
  },
]

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>(defaultNotifications)
  const [isOpen, setIsOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const handleDismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const getIconByType = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-amber-500" />
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />
      case "achievement":
        return <Zap className="h-4 w-4 text-amber-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 p-0 bg-card border-border">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary hover:text-primary"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        {notifications.length > 0 ? (
          <ScrollArea className="h-[400px]">
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex gap-3 px-4 py-3 transition-colors hover:bg-secondary/50",
                    !notification.read && "bg-secondary/30"
                  )}
                >
                  {/* Icon */}
                  <div className="mt-1 flex-shrink-0">
                    {notification.icon || getIconByType(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 gap-1">
                    <div className="flex items-start justify-between">
                      <h4 className={cn(
                        "text-sm",
                        !notification.read ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
                      )}>
                        {notification.title}
                      </h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 -mr-2"
                        onClick={() => handleDismiss(notification.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground/70">
                        {notification.timestamp}
                      </span>
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 text-xs text-primary hover:text-primary"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex h-[300px] items-center justify-center">
            <div className="text-center">
              <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          </div>
        )}

      </DropdownMenuContent>
    </DropdownMenu>
  )
}
