"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { OptimizedImage } from "@/components/optimized-image"
import { useNotification } from "@/lib/notification-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Order {
  id: string
  customer: string
  customerEmail: string
  product: string
  productImage: string
  quantity: number
  amount: number
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled"
  orderDate: string
  deliveryTime?: string
}

const mockOrders: Order[] = [
  {
    id: "ORD-001",
    customer: "John Doe",
    customerEmail: "john@university.edu",
    product: "Coffee & Pastry Bundle",
    productImage: "/coffee-and-pastry.jpg",
    quantity: 2,
    amount: 17.98,
    status: "pending",
    orderDate: "2024-01-15 10:30 AM",
  },
  {
    id: "ORD-002",
    customer: "Jane Smith",
    customerEmail: "jane@university.edu",
    product: "Sandwich & Drink Combo",
    productImage: "/sandwich-combo.jpg",
    quantity: 1,
    amount: 14.99,
    status: "preparing",
    orderDate: "2024-01-15 10:15 AM",
  },
  {
    id: "ORD-003",
    customer: "Mike Johnson",
    customerEmail: "mike@university.edu",
    product: "Protein Shake",
    productImage: "/protein-shake.jpg",
    quantity: 3,
    amount: 20.97,
    status: "ready",
    orderDate: "2024-01-15 09:45 AM",
    deliveryTime: "11:00 AM",
  },
  {
    id: "ORD-004",
    customer: "Sarah Williams",
    customerEmail: "sarah@university.edu",
    product: "Fresh Sushi Platter",
    productImage: "/sushi-platter.png",
    quantity: 1,
    amount: 24.99,
    status: "completed",
    orderDate: "2024-01-14 02:30 PM",
  },
]

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState<Order[]>(mockOrders)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const { addNotification } = useNotification()

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.product.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const updateOrderStatus = (orderId: string, newStatus: Order["status"]) => {
    setOrders(orders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)))
    addNotification(`Order ${orderId} updated to ${newStatus}`, "success")
  }

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700"
      case "preparing":
        return "bg-blue-100 text-blue-700"
      case "ready":
        return "bg-purple-100 text-purple-700"
      case "completed":
        return "bg-green-100 text-green-700"
      case "cancelled":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return <span>⏰</span>
      case "preparing":
        return <span>📦</span>
      case "ready":
        return <span>✅</span>
      case "completed":
        return <span>✅</span>
      case "cancelled":
        return <span>❌</span>
      default:
        return null
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground mt-1">Manage and track customer orders</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Pending</p>
          <p className="text-2xl font-bold">{orders.filter((o) => o.status === "pending").length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Preparing</p>
          <p className="text-2xl font-bold">{orders.filter((o) => o.status === "preparing").length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Ready</p>
          <p className="text-2xl font-bold">{orders.filter((o) => o.status === "ready").length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Completed</p>
          <p className="text-2xl font-bold">{orders.filter((o) => o.status === "completed").length}</p>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Card className="flex-1 p-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-xl">🔍</span>
            <Input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>
        <Card className="p-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </Card>
      </div>

      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                <OptimizedImage src={order.productImage} alt={order.product} className="w-full h-full" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{order.id}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(order.status)}`}
                      >
                        {getStatusIcon(order.status)}
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{order.orderDate}</p>
                  </div>
                  <p className="text-xl font-bold text-primary">${order.amount.toFixed(2)}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p className="font-medium">{order.customer}</p>
                    <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Product</p>
                    <p className="font-medium">{order.product}</p>
                    <p className="text-sm text-muted-foreground">Quantity: {order.quantity}</p>
                  </div>
                </div>
                {order.deliveryTime && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm">
                      <span className="font-medium">Delivery Time:</span> {order.deliveryTime}
                    </p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  {order.status === "pending" && (
                    <>
                      <Button size="sm" onClick={() => updateOrderStatus(order.id, "preparing")}>
                        Start Preparing
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateOrderStatus(order.id, "cancelled")}
                        className="text-red-600 hover:text-red-700"
                      >
                        Cancel Order
                      </Button>
                    </>
                  )}
                  {order.status === "preparing" && (
                    <Button size="sm" onClick={() => updateOrderStatus(order.id, "ready")}>
                      Mark as Ready
                    </Button>
                  )}
                  {order.status === "ready" && (
                    <Button size="sm" onClick={() => updateOrderStatus(order.id, "completed")}>
                      Mark as Completed
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No orders found</p>
        </Card>
      )}
    </div>
  )
}
