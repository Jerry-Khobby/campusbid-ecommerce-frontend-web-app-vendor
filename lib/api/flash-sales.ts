import { apiFetch } from "./client"
import type { FlashSale, FlashSaleStatus } from "./types"

interface VendorFlashSalesResponse {
  items: FlashSale[]
  total: number
  page: number
  limit: number
}

export async function fetchVendorFlashSales(status?: FlashSaleStatus): Promise<FlashSale[]> {
  const json = await apiFetch<{ data: VendorFlashSalesResponse }>("/vendors/flash-sales", {
    query: { status, limit: 100 },
  })
  return json.data.items
}

export async function completeFlashSale(flashSaleId: string, winner: string, finalBid: number): Promise<FlashSale> {
  const json = await apiFetch<{ data: FlashSale }>("/flash-sales/complete", {
    method: "POST",
    body: { flashSaleId, winner, finalBid },
  })
  return json.data
}

export async function cancelFlashSale(id: string, reason: string): Promise<FlashSale> {
  const json = await apiFetch<{ data: FlashSale }>(`/flash-sales/${id}/cancel`, {
    method: "PUT",
    body: { reason },
  })
  return json.data
}
