"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { NotificationsPanel } from "@/components/notifications-panel"
import { fetchNotifications } from "@/lib/api/notifications"

const MAX_BADGE_COUNT = 9

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const refreshUnreadCount = () => {
    fetchNotifications()
      .then((notifications) => setUnreadCount(notifications.filter((n) => !n.isRead).length))
      .catch(() => {})
  }

  useEffect(() => {
    refreshUnreadCount()
  }, [])

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (next) refreshUnreadCount() }}>
      <button
        onClick={() => setOpen(true)}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
            {unreadCount > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : unreadCount}
          </span>
        )}
      </button>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Notifications</DialogTitle>
        </DialogHeader>
        <NotificationsPanel onChanged={refreshUnreadCount} />
      </DialogContent>
    </Dialog>
  )
}
