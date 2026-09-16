"use client"

import { useNotification, type Notification } from "@/lib/notification-context"

export default function NotificationToast() {
  const { notifications, removeNotification } = useNotification()

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <span className="text-xl">✅</span>
      case "error":
        return <span className="text-xl">❌</span>
      case "warning":
        return <span className="text-xl">⚠️</span>
      default:
        return <span className="text-xl">ℹ️</span>
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-card border border-border rounded-lg shadow-lg p-4 flex items-center gap-3 pointer-events-auto max-w-sm"
        >
          {getIcon(notification.type)}
          <p className="text-sm font-medium text-foreground flex-1">{notification.message}</p>
          <button
            onClick={() => removeNotification(notification.id)}
            className="text-muted-foreground hover:text-foreground transition-colors text-lg"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
