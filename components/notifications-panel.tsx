"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, Check, CheckCheck, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api/client"
import { useNotification } from "@/lib/notification-context"
import { getNotificationLink } from "@/lib/notification-links"
import {
  clearAllNotifications,
  deleteNotification,
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type AppNotification,
} from "@/lib/api/notifications"

const SECONDS_PER_MINUTE = 60
const SECONDS_PER_HOUR = 3600
const SECONDS_PER_DAY = 86400

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

function formatRelativeTime(isoDate: string): string {
  const elapsedSeconds = Math.max(0, (Date.now() - new Date(isoDate).getTime()) / 1000)

  if (elapsedSeconds < SECONDS_PER_MINUTE) return "just now"
  if (elapsedSeconds < SECONDS_PER_HOUR) return `${Math.floor(elapsedSeconds / SECONDS_PER_MINUTE)}m ago`
  if (elapsedSeconds < SECONDS_PER_DAY) return `${Math.floor(elapsedSeconds / SECONDS_PER_HOUR)}h ago`
  return `${Math.floor(elapsedSeconds / SECONDS_PER_DAY)}d ago`
}

interface NotificationsPanelProps {
  /** Called after anything that changes the unread count, so the bell badge can refresh. */
  onChanged?: () => void
  /** Called when opening a notification navigates away, so the bell can close. */
  onNavigate?: () => void
}

/** Notification list + its actions. Self-fetching so it can be dropped into
 * the bell dialog without the caller managing any state. */
export function NotificationsPanel({ onChanged, onNavigate }: NotificationsPanelProps) {
  const router = useRouter()
  const { addNotification } = useNotification()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConfirmingClear, setIsConfirmingClear] = useState(false)

  const refetch = () =>
    fetchNotifications()
      .then(setNotifications)
      .catch((error) => addNotification(getErrorMessage(error, "Failed to load notifications"), "error"))

  useEffect(() => {
    refetch().finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const runAction = async (action: () => Promise<void>, failureMessage: string, successMessage?: string) => {
    try {
      await action()
      await refetch()
      onChanged?.()
      if (successMessage) addNotification(successMessage, "success")
    } catch (error) {
      addNotification(getErrorMessage(error, failureMessage), "error")
    }
  }

  const markRead = (id: string) => runAction(() => markNotificationAsRead(id).then(() => undefined), "Failed to mark notification as read")
  const markAllRead = () => runAction(markAllNotificationsAsRead, "Failed to mark all as read", "All notifications marked as read")
  const remove = (id: string) => runAction(() => deleteNotification(id), "Failed to delete notification")
  const clearAll = () => {
    setIsConfirmingClear(false)
    return runAction(clearAllNotifications, "Failed to clear notifications", "Notifications cleared")
  }

  const openNotification = (notification: AppNotification) => {
    if (!notification.isRead) markRead(notification._id)
    const link = getNotificationLink(notification)
    if (!link) return
    onNavigate?.()
    router.push(link)
  }

  if (isLoading) return <p className="text-sm text-muted-foreground p-4">Loading notifications...</p>

  const unreadCount = notifications.filter((notification) => !notification.isRead).length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}</p>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={markAllRead} disabled={unreadCount === 0}>
            <CheckCheck size={14} />
            Mark all read
          </Button>
          {isConfirmingClear ? (
            <>
              <Button variant="destructive" size="sm" onClick={clearAll}>
                Clear all?
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsConfirmingClear(false)}>
                Keep
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setIsConfirmingClear(true)} disabled={notifications.length === 0}>
              <Trash2 size={14} />
              Clear all
            </Button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="p-8 text-center border border-border rounded-lg">
          <Bell size={32} className="mx-auto text-muted-foreground opacity-50 mb-2" />
          <p className="text-muted-foreground">No notifications yet</p>
          <p className="text-xs text-muted-foreground mt-1">New orders, delivery updates, disputes and flash sale results will show up here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Click a notification to open it. Opening one marks it as read.</p>
          {notifications.map((notification) => (
            <div
              key={notification._id}
              role="button"
              tabIndex={0}
              onClick={() => openNotification(notification)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") openNotification(notification)
              }}
              className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${notification.isRead ? "border-border" : "border-primary bg-primary/5"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {!notification.isRead && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" aria-label="Unread" />}
                    <p className="font-semibold text-sm text-foreground truncate">{notification.title}</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(notification.createdAt)}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!notification.isRead && (
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        markRead(notification._id)
                      }}
                      aria-label="Mark as read"
                      title="Mark as read"
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      <Check size={16} className="text-muted-foreground" />
                    </button>
                  )}
                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      remove(notification._id)
                    }}
                    aria-label="Delete notification"
                    title="Delete notification"
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <X size={18} className="text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
