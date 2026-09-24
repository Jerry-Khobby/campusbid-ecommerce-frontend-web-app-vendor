"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import {
  BarChart2,
  Clock,
  DollarSign,
  MessageCircle,
  Package,
  ShoppingCart,
  Wallet,
  Zap,
} from "lucide-react"
import {
  Area,
  ComposedChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useNotification } from "@/lib/notification-context"
import { ApiError } from "@/lib/api/client"
import { fetchDashboard, fetchSalesAnalytics } from "@/lib/api/dashboard"
import type { VendorDashboard, SalesAnalytics } from "@/lib/api/types"
import { KpiTile } from "@/components/dashboard/kpi-tile"
import { LineAreaTooltip } from "@/components/dashboard/chart-tooltip"
import { formatCompactNumber, formatCurrency } from "@/lib/format"
import { CATEGORICAL, CHART_INK, ORDER_STATUS_COLORS } from "@/lib/chart-palette"

function getErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Please try again."
}

function formatStatus(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function formatShortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, { weekday: "short" })
}

function getCustomerName(customer: { email: string; profile?: { firstName?: string; lastName?: string } }): string {
  const name = [customer.profile?.firstName, customer.profile?.lastName].filter(Boolean).join(" ")
  return name || customer.email
}

export default function VendorDashboardPage() {
  const { addNotification } = useNotification()
  const [dashboard, setDashboard] = useState<VendorDashboard | null>(null)
  const [weekAnalytics, setWeekAnalytics] = useState<SalesAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isCancelled = false

    Promise.all([fetchDashboard(), fetchSalesAnalytics("week")])
      .then(([dashboardData, salesData]) => {
        if (isCancelled) return
        setDashboard(dashboardData)
        setWeekAnalytics(salesData)
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
  }, [addNotification])

  if (isLoading) {
    return (
      <div className="p-6 md:p-8">
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="p-6 md:p-8">
        <p className="text-sm text-red-600">Couldn&apos;t load the dashboard. Try refreshing the page.</p>
      </div>
    )
  }

  const revenueTrend = (weekAnalytics?.dailyBreakdown ?? []).map((point) => ({
    date: formatShortDate(point._id),
    revenue: point.revenue,
    orders: point.orders,
  }))
  const revenueSparkline = (weekAnalytics?.dailyBreakdown ?? []).map((p) => p.revenue)
  const ordersSparkline = (weekAnalytics?.dailyBreakdown ?? []).map((p) => p.orders)

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here&apos;s what&apos;s happening with your store today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiTile
          label="Total Revenue"
          value={formatCompactNumber(dashboard.stats.allTime.revenue, { currency: true })}
          icon={DollarSign}
          accentColor={CATEGORICAL.blue}
          caption={`${formatCurrency(dashboard.stats.thisWeek.revenue)} this week`}
          sparkline={revenueSparkline}
        />
        <KpiTile
          label="Total Orders"
          value={formatCompactNumber(dashboard.stats.allTime.orders)}
          icon={ShoppingCart}
          accentColor={CATEGORICAL.orange}
          caption={`${dashboard.stats.thisWeek.orders} this week`}
          sparkline={ordersSparkline}
        />
        <KpiTile
          label="Active Products"
          value={formatCompactNumber(dashboard.activeListings)}
          icon={Package}
          accentColor={CATEGORICAL.aqua}
          link={{ href: "/vendor/products", label: "Manage products →" }}
        />
        <KpiTile
          label="Active Flash Sales"
          value={formatCompactNumber(dashboard.activeFlashSales)}
          icon={Zap}
          accentColor={CATEGORICAL.yellow}
          link={{ href: "/vendor/bids", label: "Review bids →" }}
        />
        <KpiTile
          label="Pending Orders"
          value={formatCompactNumber(dashboard.pendingOrders)}
          icon={Clock}
          accentColor={CATEGORICAL.magenta}
          link={{ href: "/vendor/orders", label: "View orders →" }}
        />
        <KpiTile
          label="Available Balance"
          value={formatCompactNumber(dashboard.availableBalance, { currency: true })}
          icon={Wallet}
          accentColor={CATEGORICAL.violet}
          caption={`${formatCurrency(dashboard.pendingBalance)} pending hold`}
          link={{ href: "/vendor/payouts", label: "Request a payout →" }}
        />
      </div>

      {revenueTrend.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 size={18} className="text-muted-foreground" />
            <h2 className="text-lg font-semibold">Revenue - Last 7 Days</h2>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={revenueTrend}>
              <defs>
                <linearGradient id="colorVendorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CATEGORICAL.blue} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={CATEGORICAL.blue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_INK.gridline} vertical={false} />
              <XAxis dataKey="date" stroke={CHART_INK.muted} tickLine={false} axisLine={{ stroke: CHART_INK.baseline }} />
              <YAxis stroke={CHART_INK.muted} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompactNumber(v, { currency: true })} />
              <Tooltip
                cursor={{ stroke: CHART_INK.baseline, strokeDasharray: "3 3" }}
                content={<LineAreaTooltip formatValue={(v, dataKey) => (dataKey === "revenue" ? formatCurrency(v) : v.toLocaleString())} />}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke={CATEGORICAL.blue}
                strokeWidth={2}
                fill="url(#colorVendorRevenue)"
                dot={{ r: 3, fill: CATEGORICAL.blue, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
          {dashboard.recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="space-y-4">
              {dashboard.recentOrders.map((order) => {
                const statusColor = ORDER_STATUS_COLORS[order.status] ?? CHART_INK.muted
                return (
                  <div key={order.orderNumber} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{getCustomerName(order.customer)}</p>
                      <p className="text-sm text-muted-foreground">{order.orderNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${order.total.toFixed(2)}</p>
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
                      >
                        {formatStatus(order.status)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/vendor/products"
              className="block p-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Package size={22} className="mb-2" />
              <p className="text-sm font-medium">Add Product</p>
            </Link>
            <Link
              href="/vendor/orders"
              className="block p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
            >
              <ShoppingCart size={22} className="mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">View Orders</p>
            </Link>
            <Link
              href="/vendor/bids"
              className="block p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
            >
              <Zap size={22} className="mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Review Bids</p>
            </Link>
            <Link
              href="/vendor/messages"
              className="block p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
            >
              <MessageCircle size={22} className="mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Messages</p>
            </Link>
            <Link
              href="/vendor/payouts"
              className="block p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
            >
              <Wallet size={22} className="mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Payouts</p>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
