/** Validated categorical + status palette (light mode) - see the dataviz skill's
 * palette.md. Categorical hues are assigned in this fixed order, never cycled or
 * re-picked per chart; status colors are reserved and never reused as a series. */
export const CATEGORICAL = {
  blue: "#2a78d6",
  orange: "#eb6834",
  aqua: "#1baf7a",
  yellow: "#eda100",
  magenta: "#e87ba4",
  green: "#008300",
  violet: "#4a3aa7",
  red: "#e34948",
} as const

export const CATEGORICAL_ORDER = [
  CATEGORICAL.blue,
  CATEGORICAL.orange,
  CATEGORICAL.aqua,
  CATEGORICAL.yellow,
  CATEGORICAL.magenta,
  CATEGORICAL.green,
  CATEGORICAL.violet,
  CATEGORICAL.red,
]

export const STATUS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
} as const

export const CHART_INK = {
  primary: "#0b0b0b",
  secondary: "#52514e",
  muted: "#898781",
  gridline: "#e1e0d9",
  baseline: "#c3c2b7",
}

/** Order-status colors, mapped to the closest matching role - good for a finished
 * state, warning for something waiting, serious/critical for money going backwards,
 * and the neutral categorical blues for in-flight workflow stages. */
export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: STATUS.warning,
  accepted: CATEGORICAL.blue,
  preparing: CATEGORICAL.blue,
  ready: CATEGORICAL.violet,
  out_for_delivery: CATEGORICAL.violet,
  delivered: STATUS.good,
  completed: STATUS.good,
  cancelled: STATUS.critical,
  refunded: STATUS.serious,
}

export function categoricalColorAt(index: number): string {
  return CATEGORICAL_ORDER[index % CATEGORICAL_ORDER.length]
}
