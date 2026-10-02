"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNotification } from "@/lib/notification-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ApiError } from "@/lib/api/client"
import { acceptOrder, fetchVendorOrders, markOrderDelivered, rejectOrder, updateOrderStatus } from "@/lib/api/orders"
import { formatCurrency } from "@/lib/format"
import type { Order, OrderStatus } from "@/lib/api/types"

const STATUS_OPTIONS: OrderStatus[] = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "disputed",
  "completed",
  "cancelled",
  "refunded",
]

// New orders get 6-digit codes; orders created before codes were lengthened
// still carry 4-digit ones, which the backend keeps accepting.
const DELIVERY_CODE_LENGTH = 6
const LEGACY_DELIVERY_CODE_LENGTH = 4

function isDeliveryCodeComplete(code: string): boolean {
  return code.length === DELIVERY_CODE_LENGTH || code.length === LEGACY_DELIVERY_CODE_LENGTH
}

// One line per status telling the vendor what to do next, shown on every
// order so it is always clear which button to press, or that none is needed.
const VENDOR_NEXT_STEPS: Record<OrderStatus, string> = {
  pending: "New order: accept it to start, or reject it if you can't fulfil it.",
  accepted: "Accepted. Press Start Preparing when you begin working on it.",
  preparing: "Press Mark as Ready once the order is packed.",
  ready: "Press Out for Delivery when you set off to deliver it.",
  out_for_delivery: "When you hand it over, ask the customer for their 6-digit delivery code and press Mark Delivered.",
  delivered: "Delivered. You'll be paid once the customer confirms delivery or it completes automatically.",
  disputed: "The customer reported a problem. Payment is on hold while our team reviews it - no action needed.",
  completed: "Completed. The payment is in your balance - request a payout from the Payouts page.",
  cancelled: "This order was cancelled.",
  refunded: "The customer was refunded for this order.",
}

function getErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Please try again."
}

function formatStatus(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case "completed":
    case "delivered":
      return "bg-green-100 text-green-700"
    case "preparing":
    case "out_for_delivery":
      return "bg-blue-100 text-blue-700"
    case "ready":
    case "accepted":
      return "bg-purple-100 text-purple-700"
    case "pending":
      return "bg-yellow-100 text-yellow-700"
    case "disputed":
      return "bg-amber-100 text-amber-800"
    case "cancelled":
    case "refunded":
      return "bg-red-100 text-red-700"
  }
}

function getCustomerName(order: Order): string {
  const name = [order.customerId?.profile?.firstName, order.customerId?.profile?.lastName]
    .filter(Boolean)
    .join(" ")
  return name || order.customerId?.email || "Unknown"
}

export default function VendorOrdersPage() {
  const { addNotification } = useNotification()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [pendingActionId, setPendingActionId] = useState<string | null>(null)
  const [acceptingOrder, setAcceptingOrder] = useState<Order | null>(null)
  const [prepMinutes, setPrepMinutes] = useState("15")
  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [deliveringOrder, setDeliveringOrder] = useState<Order | null>(null)
  const [deliveryCodeInput, setDeliveryCodeInput] = useState("")

  useEffect(() => {
    let isCancelled = false

    fetchVendorOrders()
      .then((data) => {
        if (!isCancelled) setOrders(data)
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

  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(query) || getCustomerName(order).toLowerCase().includes(query)
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const applyUpdatedOrder = (updated: Order) => {
    setOrders((current) =>
      current.map((o) => (o._id === updated._id ? { ...updated, customerId: o.customerId, items: o.items } : o)),
    )
  }

  const handleAccept = async () => {
    if (!acceptingOrder) return
    const minutes = Number.parseInt(prepMinutes, 10)
    if (!minutes || minutes < 1) {
      addNotification("Enter a valid preparation time in minutes", "error")
      return
    }

    setPendingActionId(acceptingOrder._id)
    try {
      const updated = await acceptOrder(acceptingOrder._id, minutes)
      applyUpdatedOrder(updated)
      addNotification("Order accepted", "success")
      setAcceptingOrder(null)
      setPrepMinutes("15")
    } catch (error) {
      addNotification(getErrorMessage(error), "error")
    } finally {
      setPendingActionId(null)
    }
  }

  const handleReject = async () => {
    if (!rejectingOrder) return
    if (!rejectReason.trim()) {
      addNotification("Enter a reason for rejecting this order", "error")
      return
    }

    setPendingActionId(rejectingOrder._id)
    try {
      const updated = await rejectOrder(rejectingOrder._id, rejectReason)
      applyUpdatedOrder(updated)
      addNotification("Order rejected", "success")
      setRejectingOrder(null)
      setRejectReason("")
    } catch (error) {
      addNotification(getErrorMessage(error), "error")
    } finally {
      setPendingActionId(null)
    }
  }

  const handleAdvanceStatus = async (order: Order, status: OrderStatus) => {
    setPendingActionId(order._id)
    try {
      const updated = await updateOrderStatus(order._id, status)
      applyUpdatedOrder(updated)
      addNotification(`Order updated to ${formatStatus(status)}`, "success")
    } catch (error) {
      addNotification(getErrorMessage(error), "error")
    } finally {
      setPendingActionId(null)
    }
  }

  const handleMarkDelivered = async () => {
    if (!deliveringOrder) return
    if (!isDeliveryCodeComplete(deliveryCodeInput.trim())) {
      addNotification("Ask the customer for their delivery code (6 digits)", "error")
      return
    }

    setPendingActionId(deliveringOrder._id)
    try {
      const updated = await markOrderDelivered(deliveringOrder._id, deliveryCodeInput.trim())
      applyUpdatedOrder(updated)
      addNotification("Order marked as delivered", "success")
      setDeliveringOrder(null)
      setDeliveryCodeInput("")
    } catch (error) {
      addNotification(getErrorMessage(error), "error")
    } finally {
      setPendingActionId(null)
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
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {formatStatus(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>
      </div>

      {isLoading && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Loading orders...</p>
        </Card>
      )}

      {!isLoading && (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order._id} className="p-6">
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                      >
                        {formatStatus(order.status)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="text-xl font-bold text-primary">{formatCurrency(order.pricing.total)}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p className="font-medium">{getCustomerName(order)}</p>
                    <p className="text-sm text-muted-foreground">{order.customerId?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Items</p>
                    {order.items.map((item, index) => (
                      <p key={index} className="font-medium">
                        {item.productName} × {item.quantity}
                      </p>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{VENDOR_NEXT_STEPS[order.status]}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {order.status === "pending" && (
                    <>
                      <Button size="sm" disabled={pendingActionId === order._id} onClick={() => setAcceptingOrder(order)}>
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pendingActionId === order._id}
                        onClick={() => setRejectingOrder(order)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {order.status === "accepted" && (
                    <Button size="sm" disabled={pendingActionId === order._id} onClick={() => handleAdvanceStatus(order, "preparing")}>
                      Start Preparing
                    </Button>
                  )}
                  {order.status === "preparing" && (
                    <Button size="sm" disabled={pendingActionId === order._id} onClick={() => handleAdvanceStatus(order, "ready")}>
                      Mark as Ready
                    </Button>
                  )}
                  {order.status === "ready" && (
                    <Button
                      size="sm"
                      disabled={pendingActionId === order._id}
                      onClick={() => handleAdvanceStatus(order, "out_for_delivery")}
                    >
                      Out for Delivery
                    </Button>
                  )}
                  {order.status === "out_for_delivery" && (
                    <Button size="sm" disabled={pendingActionId === order._id} onClick={() => setDeliveringOrder(order)}>
                      Mark Delivered
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredOrders.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No orders found</p>
        </Card>
      )}

      <Dialog open={!!acceptingOrder} onOpenChange={(open) => !open && setAcceptingOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Order {acceptingOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prep-minutes">Estimated preparation time (minutes)</Label>
              <Input
                id="prep-minutes"
                type="number"
                min={1}
                value={prepMinutes}
                onChange={(e) => setPrepMinutes(e.target.value)}
              />
            </div>
            <Button onClick={handleAccept} className="w-full" disabled={pendingActionId === acceptingOrder?._id}>
              Confirm Accept
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectingOrder} onOpenChange={(open) => !open && setRejectingOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Order {rejectingOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Reason</Label>
              <Input
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Out of stock"
              />
            </div>
            <Button
              onClick={handleReject}
              variant="destructive"
              className="w-full"
              disabled={pendingActionId === rejectingOrder?._id}
            >
              Confirm Reject
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deliveringOrder}
        onOpenChange={(open) => {
          if (!open) {
            setDeliveringOrder(null)
            setDeliveryCodeInput("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Order {deliveringOrder?.orderNumber} Delivered</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delivery-code">Delivery code</Label>
              <Input
                id="delivery-code"
                inputMode="numeric"
                maxLength={DELIVERY_CODE_LENGTH}
                value={deliveryCodeInput}
                onChange={(e) => setDeliveryCodeInput(e.target.value.replace(/\D/g, ""))}
                placeholder="Ask the customer for their 6-digit code"
              />
            </div>
            <Button
              onClick={handleMarkDelivered}
              className="w-full"
              disabled={pendingActionId === deliveringOrder?._id}
            >
              Confirm Delivered
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
