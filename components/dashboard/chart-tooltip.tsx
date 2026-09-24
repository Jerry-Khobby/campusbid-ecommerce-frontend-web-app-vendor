"use client"

import type React from "react"

// Custom Recharts tooltips per the dataviz skill's interaction spec: the value is the
// bold, high-contrast element and the series name is secondary (inverted from the
// legend, since here the reader has the series and wants the number); series are keyed
// with a short stroke of their color, not a filled box; every series at that X shows in
// one tooltip.

const SURFACE = "#ffffff"
const BORDER = "rgba(11,11,11,0.10)"
const TEXT_PRIMARY = "#0b0b0b"
const TEXT_SECONDARY = "#52514e"

interface SeriesEntry {
  name?: string
  value?: number | string
  color?: string
  unit?: string
}

function TooltipShell({ heading, children }: { heading?: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-lg px-3 py-2 shadow-lg"
      style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, minWidth: 140 }}
    >
      {heading && <p className="mb-1.5 text-xs font-medium" style={{ color: TEXT_SECONDARY }}>{heading}</p>}
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function SeriesRow({ name, value, color, unit, formatValue }: SeriesEntry & { formatValue?: (v: number) => string }) {
  const numericValue = typeof value === "number" ? value : Number(value)
  const displayValue =
    typeof value === "number" && formatValue ? formatValue(value) : `${value ?? ""}${unit ?? ""}`

  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="flex items-center gap-1.5" style={{ color: TEXT_SECONDARY }}>
        {color && <span className="inline-block h-0.5 w-3 rounded-full" style={{ backgroundColor: color }} />}
        {name}
      </span>
      <span className="font-semibold tabular-nums" style={{ color: TEXT_PRIMARY }}>
        {Number.isFinite(numericValue) ? displayValue : "—"}
      </span>
    </div>
  )
}

interface LineAreaTooltipProps {
  active?: boolean
  label?: string
  payload?: Array<{ name?: string; value?: number; color?: string; stroke?: string; dataKey?: string }>
  formatValue?: (value: number, dataKey?: string) => string
}

/** For line/area charts: one tooltip listing every series at the hovered X. */
export function LineAreaTooltip({ active, label, payload, formatValue }: LineAreaTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <TooltipShell heading={label}>
      {payload.map((entry) => (
        <SeriesRow
          key={entry.dataKey ?? entry.name}
          name={entry.name}
          value={entry.value}
          color={entry.color ?? entry.stroke}
          formatValue={formatValue ? (v) => formatValue(v, entry.dataKey) : undefined}
        />
      ))}
    </TooltipShell>
  )
}

interface BarTooltipProps {
  active?: boolean
  label?: string
  payload?: Array<{ name?: string; value?: number; color?: string; fill?: string; payload?: { fill?: string } }>
  formatValue?: (value: number) => string
}

/** For bar charts: per-bar hover, category name as heading, value bold below. */
export function BarTooltip({ active, label, payload, formatValue }: BarTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const entry = payload[0]
  const color = entry.color ?? entry.fill ?? entry.payload?.fill

  return (
    <TooltipShell heading={label}>
      <SeriesRow name={entry.name ?? "Value"} value={entry.value} color={color} formatValue={formatValue} />
    </TooltipShell>
  )
}
