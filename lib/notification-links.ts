import type { AppNotification } from "./api/notifications"

const ORDER_NOTIFICATION_TYPES: AppNotification["type"][] = ["order_update", "order_status_changed", "payment"]

/** Where a notification should take the vendor when they open it, or null when it is informational only. */
export function getNotificationLink(notification: AppNotification): string | null {
  if (notification.type.startsWith("flash_sale")) return "/vendor/bids"
  if (notification.type === "new_message") return "/vendor/messages"
  if (ORDER_NOTIFICATION_TYPES.includes(notification.type) || notification.data?.orderId) return "/vendor/orders"
  return null
}
