"use client"

import { Card } from "@/components/ui/card"

const stats = [
  {
    name: "Total Revenue",
    value: "$12,450",
    change: "+12.5%",
    icon: "💰",
    trend: "up",
  },
  {
    name: "Total Orders",
    value: "156",
    change: "+8.2%",
    icon: "🛒",
    trend: "up",
  },
  {
    name: "Active Products",
    value: "24",
    change: "+2",
    icon: "📦",
    trend: "up",
  },
  {
    name: "Pending Bids",
    value: "18",
    change: "+5",
    icon: "⚡",
    trend: "up",
  },
]

const recentOrders = [
  {
    id: "ORD-001",
    customer: "John Doe",
    product: "Coffee & Pastry",
    amount: "$12.99",
    status: "Preparing",
  },
  {
    id: "ORD-002",
    customer: "Jane Smith",
    product: "Sandwich Combo",
    amount: "$15.50",
    status: "Ready",
  },
  {
    id: "ORD-003",
    customer: "Mike Johnson",
    product: "Protein Shake",
    amount: "$8.99",
    status: "Delivered",
  },
]

export default function VendorDashboardPage() {
  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening with your store today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">
                {stat.icon}
              </div>
              <span className={`text-sm font-medium ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
            <p className="text-sm text-muted-foreground">{stat.name}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">{order.customer}</p>
                  <p className="text-sm text-muted-foreground">{order.product}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{order.amount}</p>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      order.status === "Delivered"
                        ? "bg-green-100 text-green-700"
                        : order.status === "Ready"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              <div className="text-2xl mb-2">📦</div>
              <p className="text-sm font-medium">Add Product</p>
            </button>
            <button className="p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors">
              <div className="text-2xl mb-2">🛒</div>
              <p className="text-sm font-medium">View Orders</p>
            </button>
            <button className="p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors">
              <div className="text-2xl mb-2">⚡</div>
              <p className="text-sm font-medium">Review Bids</p>
            </button>
            <button className="p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors">
              <div className="text-2xl mb-2">📊</div>
              <p className="text-sm font-medium">Analytics</p>
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}
