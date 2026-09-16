import { apiFetch } from "./client"
import type { ProductAnalyticsItem, SalesAnalytics, VendorDashboard } from "./types"

export async function fetchDashboard(): Promise<VendorDashboard> {
  const json = await apiFetch<{ data: VendorDashboard }>("/vendors/dashboard")
  return json.data
}

export async function fetchSalesAnalytics(period?: "today" | "week" | "month" | "year"): Promise<SalesAnalytics> {
  const json = await apiFetch<{ data: SalesAnalytics }>("/vendors/analytics/sales", { query: { period } })
  return json.data
}

export async function fetchProductAnalytics(): Promise<ProductAnalyticsItem[]> {
  const json = await apiFetch<{ data: { items: ProductAnalyticsItem[] } }>("/vendors/analytics/products", {
    query: { limit: 100 },
  })
  return json.data.items
}
