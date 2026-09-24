import { apiFetch } from "./client"

export interface AppNotification {
  _id: string
  userId: string
  userType: "customer" | "vendor"
  type: "order_update" | "new_message" | "flash_sale" | "payment" | "order_status_changed" | "flash_sale_alert" | "flash_sale_won"
  title: string
  message: string
  data?: Record<string, unknown>
  isRead: boolean
  readAt?: string
  createdAt: string
}

export async function fetchNotifications(): Promise<AppNotification[]> {
  const json = await apiFetch<{ data: AppNotification[] }>("/notifications")
  return json.data
}

export async function markNotificationAsRead(id: string): Promise<AppNotification> {
  const json = await apiFetch<{ data: AppNotification }>(`/notifications/${id}/read`, { method: "PATCH" })
  return json.data
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await apiFetch(`/notifications/read-all`, { method: "PATCH" })
}

export async function deleteNotification(id: string): Promise<void> {
  await apiFetch(`/notifications/${id}`, { method: "DELETE" })
}
