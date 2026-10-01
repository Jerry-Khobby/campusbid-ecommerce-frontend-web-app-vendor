"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useNotification } from "@/lib/notification-context"
import { ApiError } from "@/lib/api/client"
import { fetchDashboard } from "@/lib/api/dashboard"
import { fetchHeldPayments, fetchPayouts, requestPayout } from "@/lib/api/payouts"
import type { HeldPayment, Payout, VendorDashboard } from "@/lib/api/types"
import { formatCurrency } from "@/lib/format"

function getErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Please try again."
}

function getStatusColor(status: Payout["status"]): string {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-700"
    case "processing":
      return "bg-blue-100 text-blue-700"
    case "failed":
      return "bg-red-100 text-red-700"
    default:
      return "bg-yellow-100 text-yellow-700"
  }
}

function getOrderNumber(payment: HeldPayment): string {
  return typeof payment.orderId === "string" ? `#${payment.orderId.slice(-6)}` : payment.orderId.orderNumber
}

export default function VendorPayoutsPage() {
  const { addNotification } = useNotification()
  const [dashboard, setDashboard] = useState<VendorDashboard | null>(null)
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [heldPayments, setHeldPayments] = useState<HeldPayment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)

  const loadData = () => {
    return Promise.all([fetchDashboard(), fetchPayouts(), fetchHeldPayments()]).then(
      ([dashboardData, payoutsData, heldData]) => {
        setDashboard(dashboardData)
        setPayouts(payoutsData)
        setHeldPayments(heldData.payments)
      },
    )
  }

  useEffect(() => {
    let isCancelled = false

    loadData()
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

  const handleRequestPayout = async () => {
    setIsRequesting(true)
    try {
      await requestPayout()
      addNotification("Payout requested", "success")
      setIsConfirmOpen(false)
      await loadData()
    } catch (error) {
      addNotification(getErrorMessage(error), "error")
    } finally {
      setIsRequesting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 md:p-8">
        <p className="text-sm text-muted-foreground">Loading payouts...</p>
      </div>
    )
  }

  const availableBalance = dashboard?.availableBalance ?? 0

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payouts</h1>
        <p className="text-muted-foreground mt-1">Request a payout and track past requests</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
          <p className="text-3xl font-bold mb-4">{formatCurrency(availableBalance)}</p>
          <Button onClick={() => setIsConfirmOpen(true)} disabled={availableBalance <= 0} className="w-full">
            Request Payout
          </Button>
          {availableBalance <= 0 && (
            <p className="text-xs text-muted-foreground mt-2">No available balance to pay out yet.</p>
          )}
        </Card>

        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Pending Balance</p>
          <p className="text-3xl font-bold mb-4">{formatCurrency(dashboard?.pendingBalance ?? 0)}</p>
          <p className="text-xs text-muted-foreground">
            Held from orders not yet confirmed delivered — becomes available once released.
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Held Payments</h2>
        {heldPayments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payments currently on hold.</p>
        ) : (
          <div className="space-y-3">
            {heldPayments.map((payment) => (
              <div key={payment._id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Order {getOrderNumber(payment)}</p>
                  <p className="text-xs text-muted-foreground">
                    {payment.holdStartTime ? new Date(payment.holdStartTime).toLocaleDateString() : ""}
                  </p>
                </div>
                <p className="font-semibold">{formatCurrency(payment.vendorPayout)}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Payout History</h2>
        {payouts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payouts requested yet.</p>
        ) : (
          <div className="space-y-3">
            {payouts.map((payout) => (
              <div key={payout._id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">{formatCurrency(payout.amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(payout.requestedAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(payout.status)}`}>
                  {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Payout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This requests a payout of your full available balance, {formatCurrency(availableBalance)}, to your
              bank details on file.
            </p>
            <Button onClick={handleRequestPayout} disabled={isRequesting} className="w-full">
              {isRequesting ? "Requesting..." : "Confirm Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
