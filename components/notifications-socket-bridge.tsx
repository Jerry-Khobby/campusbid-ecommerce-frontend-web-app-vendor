"use client"

import { useEffect } from "react"
import { useUser } from "@/lib/user-context"
import { useNotification } from "@/lib/notification-context"
import { createSocket } from "@/lib/socket/client"
import type { AppNotification } from "@/lib/api/notifications"

/** Mounted once near the app root. Toasts new notifications pushed over the
 * backend's authenticated /notifications socket while the vendor is logged in. */
export function NotificationsSocketBridge() {
  const { user } = useUser()
  const { addNotification } = useNotification()

  useEffect(() => {
    if (!user) return

    const socket = createSocket("/notifications", { withAuth: true })

    socket.on("new_notification", (notification: AppNotification) => {
      addNotification(`${notification.title}: ${notification.message}`, "info")
    })

    socket.connect()
    return () => {
      socket.disconnect()
    }
  }, [user, addNotification])

  return null
}
