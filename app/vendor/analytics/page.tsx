"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useNotification } from "@/lib/notification-context"
import { ApiError } from "@/lib/api/client"
import { fetchProductAnalytics, fetchSalesAnalytics } from "@/lib/api/dashboard"
import type { ProductAnalyticsItem, SalesAnalytics } from "@/lib/api/types"
import { LineAreaTooltip } from "@/components/dashboard/chart-tooltip"
import { formatCompactNumber, formatCurrency } from "@/lib/format"
import { CATEGORICAL, CHART_INK } from "@/lib/chart-palette"

function getErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Please try again."
}

function formatChartDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

type Period = "today" | "week" | "month" | "year"

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "Last 7 Days" },
  { value: "month", label: "Last 30 Days" },
  { value: "year", label: "Last Year" },
]

export default function VendorAnalyticsPage() {
  const { addNotification } = useNotification()
  const [period, setPeriod] = useState<Period>("month")
  const [sales, setSales] = useState<SalesAnalytics | null>(null)
  const [products, setProducts] = useState<ProductAnalyticsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isCancelled = false
    setIsLoading(true)

    Promise.all([fetchSalesAnalytics(period), fetchProductAnalytics()])
      .then(([salesData, productsData]) => {
        if (isCancelled) return
        setSales(salesData)
        setProducts(productsData)
      })
      .catch((error) => {
        if (!isCancelled) addNotification(getErrorMessage(error), "error")
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [period, addNotification])

  const dailyChartData = (sales?.dailyBreakdown ?? []).map((point) => ({
    date: formatChartDate(point._id),
    revenue: point.revenue,
    orders: point.orders,
  }))

  const statCards = sales
    ? [
        { name: "Total Orders", value: sales.totalOrders.toLocaleString(), icon: "🛒" },
        { name: "Completed", value: sales.completedOrders.toLocaleString(), icon: "✅" },
        { name: "Cancelled", value: sales.cancelledOrders.toLocaleString(), icon: "❌" },
        { name: "Total Revenue", value: `$${sales.totalRevenue.toLocaleString()}`, icon: "💰" },
        { name: "Avg. Order Value", value: `$${sales.averageOrderValue.toFixed(2)}`, icon: "📊" },
      ]
    : []

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">Sales and product performance</p>
        </div>
        <Select value={period} onValueChange={(value) => setPeriod(value as Period)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading analytics...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {statCards.map((stat) => (
              <Card key={stat.name} className="p-6">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-xl mb-3">
                  {stat.icon}
                </div>
                <h3 className="text-xl font-bold mb-1">{stat.value}</h3>
                <p className="text-sm text-muted-foreground">{stat.name}</p>
              </Card>
            ))}
          </div>

          {sales && sales.dailyBreakdown.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Revenue & Orders Over Time</h2>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_INK.gridline} vertical={false} />
                  <XAxis dataKey="date" stroke={CHART_INK.muted} tickLine={false} axisLine={{ stroke: CHART_INK.baseline }} />
                  <YAxis
                    yAxisId="revenue"
                    stroke={CHART_INK.muted}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatCompactNumber(v, { currency: true })}
                  />
                  <YAxis yAxisId="orders" orientation="right" hide />
                  <Tooltip
                    cursor={{ stroke: CHART_INK.baseline, strokeDasharray: "3 3" }}
                    content={
                      <LineAreaTooltip
                        formatValue={(v, dataKey) => (dataKey === "revenue" ? formatCurrency(v) : v.toLocaleString())}
                      />
                    }
                  />
                  <Bar yAxisId="orders" dataKey="orders" name="Orders" fill={CATEGORICAL.orange} radius={[4, 4, 0, 0]} maxBarSize={24} />
                  <Line
                    yAxisId="revenue"
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke={CATEGORICAL.blue}
                    strokeWidth={2}
                    dot={{ r: 3, fill: CATEGORICAL.blue, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Top Products (by revenue)</h2>
              {!sales || sales.topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sales in this period yet.</p>
              ) : (
                <div className="space-y-3">
                  {sales.topProducts.map((product) => (
                    <div
                      key={product.productId}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.unitsSold} sold</p>
                      </div>
                      <p className="font-semibold">${product.revenue.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Product Performance</h2>
              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground">No products yet.</p>
              ) : (
                <div className="space-y-3">
                  {products.map((product) => (
                    <div key={product._id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.views} views · {product.soldCount} sold
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {product.rating.count > 0 ? `⭐ ${product.rating.average.toFixed(1)}` : "No ratings"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
