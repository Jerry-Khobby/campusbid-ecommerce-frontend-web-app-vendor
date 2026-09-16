"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { useNotification } from "@/lib/notification-context"
import { ApiError } from "@/lib/api/client"
import { fetchDashboard } from "@/lib/api/dashboard"
import type { VendorDashboard } from "@/lib/api/types"

function getErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Please try again."
}

function formatStatus(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function getStatusColor(status: string): string {
  switch (status) {
    case "completed":
    case "delivered":
      return "bg-green-100 text-green-700"
    case "ready":
    case "out_for_delivery":
      return "bg-blue-100 text-blue-700"
    case "cancelled":
    case "refunded":
      return "bg-red-100 text-red-700"
    default:
      return "bg-yellow-100 text-yellow-700"
  }
}

function getCustomerName(customer: { email: string; profile?: { firstName?: string; lastName?: string } }): string {
  const name = [customer.profile?.firstName, customer.profile?.lastName].filter(Boolean).join(" ")
  return name || customer.email
}

export default function VendorDashboardPage() {
  const { addNotification } = useNotification()
  const [dashboard, setDashboard] = useState<VendorDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isCancelled = false

    fetchDashboard()
      .then((data) => {
        if (!isCancelled) setDashboard(data)
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

  const statCards = [
    { name: "Total Revenue", value: `$${dashboard.stats.allTime.revenue.toLocaleString()}`, icon: "💰" },
    { name: "Total Orders", value: dashboard.stats.allTime.orders.toLocaleString(), icon: "🛒" },
    { name: "Active Products", value: dashboard.activeListings.toString(), icon: "📦" },
    { name: "Active Flash Sales", value: dashboard.activeFlashSales.toString(), icon: "⚡" },
  ]

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening with your store today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.name} className="p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl mb-4">
              {stat.icon}
            </div>
            <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
            <p className="text-sm text-muted-foreground">{stat.name}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Pending Orders</p>
          <p className="text-2xl font-bold">{dashboard.pendingOrders}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
          <p className="text-2xl font-bold">${dashboard.availableBalance.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">
            ${dashboard.pendingBalance.toLocaleString()} pending payout hold
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
          {dashboard.recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="space-y-4">
              {dashboard.recentOrders.map((order) => (
                <div key={order.orderNumber} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{getCustomerName(order.customer)}</p>
                    <p className="text-sm text-muted-foreground">{order.orderNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${order.total.toFixed(2)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                      {formatStatus(order.status)}
                    </span>
                  </div>
                </div>
              ))}
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
              <div className="text-2xl mb-2">📦</div>
              <p className="text-sm font-medium">Add Product</p>
            </Link>
            <Link
              href="/vendor/orders"
              className="block p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
            >
              <div className="text-2xl mb-2">🛒</div>
              <p className="text-sm font-medium">View Orders</p>
            </Link>
            <Link
              href="/vendor/bids"
              className="block p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
            >
              <div className="text-2xl mb-2">⚡</div>
              <p className="text-sm font-medium">Review Bids</p>
            </Link>
            <Link
              href="/vendor/messages"
              className="block p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
            >
              <div className="text-2xl mb-2">💬</div>
              <p className="text-sm font-medium">Messages</p>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
