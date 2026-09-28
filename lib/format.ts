/** Auto-compact number formatting for stat-tile values: 1,284 / 12.9K / ₵4.2M. */
export function formatCompactNumber(value: number, options?: { currency?: boolean }): string {
  const prefix = options?.currency ? "₵" : ""
  const abs = Math.abs(value)

  if (abs >= 1_000_000) return `${prefix}${(value / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${prefix}${(value / 1_000).toFixed(1)}K`
  return `${prefix}${value.toLocaleString()}`
}

/** Ghana Cedis formatting — the only currency this app deals in. */
export function formatCurrency(value: number): string {
  return `₵${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
