import { apiFetch } from "./client"
import type { HeldPaymentsResponse, Payout } from "./types"

export async function fetchPayouts(): Promise<Payout[]> {
  const json = await apiFetch<{ data: Payout[] }>("/vendors/payouts")
  return json.data
}

export async function fetchHeldPayments(): Promise<HeldPaymentsResponse> {
  const json = await apiFetch<{ data: HeldPaymentsResponse }>("/vendors/payouts/held-payments")
  return json.data
}

export async function requestPayout(): Promise<Payout> {
  const json = await apiFetch<{ data: Payout }>("/vendors/payouts/request", { method: "POST" })
  return json.data
}
