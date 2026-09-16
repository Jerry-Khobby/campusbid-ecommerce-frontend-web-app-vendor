import { apiFetch } from "./client"
import type { Order, OrderStatus } from "./types"

export async function fetchVendorOrders(status?: OrderStatus): Promise<Order[]> {
  const json = await apiFetch<{ data: Order[] }>("/vendors/orders", { query: { status } })
  return json.data
}

export async function acceptOrder(id: string, estimatedPreparationTime: number): Promise<Order> {
  const json = await apiFetch<{ data: Order }>(`/orders/${id}/accept`, {
    method: "PATCH",
    body: { estimatedPreparationTime },
  })
  return json.data
}

export async function rejectOrder(id: string, reason: string): Promise<Order> {
  const json = await apiFetch<{ data: Order }>(`/orders/${id}/reject`, {
    method: "PATCH",
    body: { reason },
  })
  return json.data
}

export async function markOrderDelivered(id: string): Promise<Order> {
  const json = await apiFetch<{ data: Order }>(`/orders/${id}/mark-delivered`, { method: "PATCH" })
  return json.data
}

/** Ownership-checked as of today's backend fix — safe to use for the
 * transitions the purpose-built routes don't cover (preparing/ready/out_for_delivery). */
export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const json = await apiFetch<{ data: Order }>(`/orders/${id}/status`, {
    method: "PATCH",
    body: { status },
  })
  return json.data
}
