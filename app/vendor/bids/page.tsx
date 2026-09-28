"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OptimizedImage } from "@/components/optimized-image";
import { useNotification } from "@/lib/notification-context";
import { ApiError } from "@/lib/api/client";
import { formatCurrency } from "@/lib/format";
import { cancelFlashSale, completeFlashSale, fetchVendorFlashSales } from "@/lib/api/flash-sales";
import type { FlashSale } from "@/lib/api/types";

function getErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
}

const CANCEL_REASONS = [
  { value: "closing_time", label: "Closing early" },
  { value: "expiring_stock", label: "Stock expiring / no longer available" },
] as const;

function getProductName(sale: FlashSale): string {
  return typeof sale.productId === "string" ? "Product" : sale.productId.name;
}

function getProductImage(sale: FlashSale): string {
  return typeof sale.productId === "string" ? "" : (sale.productId.images?.[0] ?? "");
}

function getStatusColor(status: FlashSale["status"]): string {
  switch (status) {
    case "active":
      return "bg-blue-100 text-blue-700";
    case "completed":
      return "bg-green-100 text-green-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    case "upcoming":
      return "bg-gray-100 text-gray-700";
  }
}

function formatTimeRemaining(endTime: string): string {
  const remainingMs = new Date(endTime).getTime() - Date.now();
  if (remainingMs <= 0) return "Ended";

  const hours = Math.floor(remainingMs / (60 * 60 * 1000));
  const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export default function VendorBidsPage() {
  const { addNotification } = useNotification();
  const [sales, setSales] = useState<FlashSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [completingSale, setCompletingSale] = useState<FlashSale | null>(null);
  const [finalBid, setFinalBid] = useState("");
  const [cancellingSale, setCancellingSale] = useState<FlashSale | null>(null);
  const [cancelReason, setCancelReason] = useState<string>(CANCEL_REASONS[0].value);

  useEffect(() => {
    let isCancelled = false;

    fetchVendorFlashSales()
      .then((data) => {
        if (!isCancelled) setSales(data);
      })
      .catch((error) => {
        if (!isCancelled) addNotification(getErrorMessage(error), "error");
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [addNotification]);

  const filteredSales = sales.filter((sale) => getProductName(sale).toLowerCase().includes(searchQuery.toLowerCase()));

  const applyUpdatedSale = (updated: FlashSale) => {
    setSales((current) =>
      current.map((s) => (s._id === updated._id ? { ...updated, productId: s.productId } : s)),
    );
  };

  const openCompleteDialog = (sale: FlashSale) => {
    setCompletingSale(sale);
    setFinalBid(String(sale.currentBid ?? sale.startingBid));
  };

  const handleComplete = async () => {
    if (!completingSale) return;
    if (!completingSale.currentBidder) {
      addNotification("This sale has no bids yet, so there's no winner to declare.", "error");
      return;
    }
    const amount = Number.parseFloat(finalBid);
    if (!amount || amount <= 0) {
      addNotification("Enter a valid final price", "error");
      return;
    }

    setPendingActionId(completingSale._id);
    try {
      const updated = await completeFlashSale(completingSale._id, completingSale.currentBidder, amount);
      applyUpdatedSale(updated);
      addNotification("Flash sale completed", "success");
      setCompletingSale(null);
    } catch (error) {
      addNotification(getErrorMessage(error), "error");
    } finally {
      setPendingActionId(null);
    }
  };

  const handleCancel = async () => {
    if (!cancellingSale) return;

    setPendingActionId(cancellingSale._id);
    try {
      const updated = await cancelFlashSale(cancellingSale._id, cancelReason);
      applyUpdatedSale(updated);
      addNotification("Flash sale cancelled", "success");
      setCancellingSale(null);
      setCancelReason(CANCEL_REASONS[0].value);
    } catch (error) {
      addNotification(getErrorMessage(error), "error");
    } finally {
      setPendingActionId(null);
    }
  };

  const activeSales = sales.filter((s) => s.status === "active");
  const totalBidValue = activeSales.reduce((sum, sale) => sum + (sale.currentBid ?? 0), 0);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bids</h1>
        <p className="text-muted-foreground mt-1">
          Review live flash sale bidding and close out sales
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">⏰</div>
            <div>
              <p className="text-sm text-muted-foreground">Active Sales</p>
              <p className="text-2xl font-bold">{activeSales.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl">📈</div>
            <div>
              <p className="text-sm text-muted-foreground">Total Current Bid Value</p>
              <p className="text-2xl font-bold">{formatCurrency(totalBidValue)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-xl">✅</div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{sales.filter((s) => s.status === "completed").length}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-xl">🔍</span>
          <Input
            type="text"
            placeholder="Search by product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {isLoading && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Loading flash sales...</p>
        </Card>
      )}

      {!isLoading && (
        <div className="space-y-4">
          {filteredSales.map((sale) => (
            <Card key={sale._id} className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                  <OptimizedImage src={getProductImage(sale)} alt={getProductName(sale)} className="w-full h-full" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(sale.status)}`}>
                          {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                        </span>
                      </div>
                      <p className="font-medium text-foreground">{getProductName(sale)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground line-through">{formatCurrency(sale.originalPrice)}</p>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(sale.currentBid ?? sale.startingBid)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Leader</p>
                      <p className="font-medium">{sale.currentBidder ? "Bidder placed" : "No bids yet"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Bids</p>
                      <p className="font-medium">{sale.bids.length} bids</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Time Remaining</p>
                      <p className="font-medium">{formatTimeRemaining(sale.endTime)}</p>
                    </div>
                  </div>
                  {sale.status === "active" && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => openCompleteDialog(sale)}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={pendingActionId === sale._id}
                      >
                        Complete Sale
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCancellingSale(sale)}
                        className="text-red-600 hover:text-red-700"
                        disabled={pendingActionId === sale._id}
                      >
                        Cancel Sale
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredSales.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No flash sales found</p>
        </Card>
      )}

      <Dialog open={!!completingSale} onOpenChange={(open) => !open && setCompletingSale(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Sale: {completingSale ? getProductName(completingSale) : ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This closes the sale and awards it to the current highest bidder at the price you confirm below.
            </p>
            <div className="space-y-2">
              <Label htmlFor="final-bid">Final price ($)</Label>
              <Input
                id="final-bid"
                type="number"
                step="0.01"
                value={finalBid}
                onChange={(e) => setFinalBid(e.target.value)}
              />
            </div>
            <Button onClick={handleComplete} className="w-full" disabled={pendingActionId === completingSale?._id}>
              Confirm Complete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!cancellingSale} onOpenChange={(open) => !open && setCancellingSale(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Sale: {cancellingSale ? getProductName(cancellingSale) : ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Reason</Label>
              <Select value={cancelReason} onValueChange={setCancelReason}>
                <SelectTrigger id="cancel-reason">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CANCEL_REASONS.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleCancel}
              variant="destructive"
              className="w-full"
              disabled={pendingActionId === cancellingSale?._id}
            >
              Confirm Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
