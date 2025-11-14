"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OptimizedImage } from "@/components/optimized-image";
import { useNotification } from "@/lib/notification-context";

interface Bid {
  id: string;
  product: string;
  productImage: string;
  originalPrice: number;
  currentBid: number;
  highestBidder: string;
  bidderEmail: string;
  totalBids: number;
  timeRemaining: string;
  status: "active" | "accepted" | "rejected" | "expired";
}

const mockBids: Bid[] = [
  {
    id: "BID-001",
    product: "Fresh Sushi Platter",
    productImage: "/sushi-platter.png",
    originalPrice: 24.99,
    currentBid: 18.5,
    highestBidder: "Alice Chen",
    bidderEmail: "alice@university.edu",
    totalBids: 8,
    timeRemaining: "2h 15m",
    status: "active",
  },
  {
    id: "BID-002",
    product: "Coffee & Pastry Bundle",
    productImage: "/coffee-and-pastry.jpg",
    originalPrice: 8.99,
    currentBid: 6.5,
    highestBidder: "Bob Wilson",
    bidderEmail: "bob@university.edu",
    totalBids: 5,
    timeRemaining: "45m",
    status: "active",
  },
  {
    id: "BID-003",
    product: "Sandwich & Drink Combo",
    productImage: "/sandwich-combo.jpg",
    originalPrice: 14.99,
    currentBid: 11.0,
    highestBidder: "Carol Davis",
    bidderEmail: "carol@university.edu",
    totalBids: 12,
    timeRemaining: "Ended",
    status: "accepted",
  },
  {
    id: "BID-004",
    product: "Protein Shake",
    productImage: "/protein-shake.jpg",
    originalPrice: 6.99,
    currentBid: 4.5,
    highestBidder: "David Lee",
    bidderEmail: "david@university.edu",
    totalBids: 3,
    timeRemaining: "Ended",
    status: "rejected",
  },
];

export default function VendorBidsPage() {
  const [bids, setBids] = useState<Bid[]>(mockBids);
  const [searchQuery, setSearchQuery] = useState("");
  const { addNotification } = useNotification();

  const filteredBids = bids.filter(
    (bid) =>
      bid.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bid.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bid.highestBidder.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const acceptBid = (bidId: string) => {
    setBids(
      bids.map((bid) =>
        bid.id === bidId ? { ...bid, status: "accepted" } : bid
      )
    );
    addNotification(`Bid ${bidId} accepted`, "success");
  };

  const rejectBid = (bidId: string) => {
    setBids(
      bids.map((bid) =>
        bid.id === bidId ? { ...bid, status: "rejected" } : bid
      )
    );
    addNotification(`Bid ${bidId} rejected`, "info");
  };

  const getStatusColor = (status: Bid["status"]) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-700";
      case "accepted":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      case "expired":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: Bid["status"]) => {
    switch (status) {
      case "active":
        return <span>⏰</span>;
      case "accepted":
        return <span>✅</span>;
      case "rejected":
        return <span>❌</span>;
      case "expired":
        return <span>⏰</span>;
      default:
        return null;
    }
  };

  const activeBids = bids.filter((b) => b.status === "active");
  const totalBidValue = activeBids.reduce(
    (sum, bid) => sum + bid.currentBid,
    0
  );

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bids</h1>
        <p className="text-muted-foreground mt-1">
          Review and manage flash sale bids
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">
              ⏰
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Bids</p>
              <p className="text-2xl font-bold">{activeBids.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl">
              📈
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Bid Value</p>
              <p className="text-2xl font-bold">${totalBidValue.toFixed(2)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-xl">
              ✅
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Accepted Today</p>
              <p className="text-2xl font-bold">
                {bids.filter((b) => b.status === "accepted").length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-xl">
            🔍
          </span>
          <Input
            type="text"
            placeholder="Search bids..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      <div className="space-y-4">
        {filteredBids.map((bid) => (
          <Card key={bid.id} className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                <OptimizedImage
                  src={bid.productImage}
                  alt={bid.product}
                  className="w-full h-full"
                />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{bid.id}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(
                          bid.status
                        )}`}
                      >
                        {getStatusIcon(bid.status)}
                        {bid.status.charAt(0).toUpperCase() +
                          bid.status.slice(1)}
                      </span>
                    </div>
                    <p className="font-medium text-foreground">{bid.product}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground line-through">
                      ${bid.originalPrice.toFixed(2)}
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      ${bid.currentBid.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Highest Bidder
                    </p>
                    <p className="font-medium">{bid.highestBidder}</p>
                    <p className="text-sm text-muted-foreground">
                      {bid.bidderEmail}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Bids</p>
                    <p className="font-medium">{bid.totalBids} bids</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Time Remaining
                    </p>
                    <p className="font-medium">{bid.timeRemaining}</p>
                  </div>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium">Discount:</span>{" "}
                    {(
                      ((bid.originalPrice - bid.currentBid) /
                        bid.originalPrice) *
                      100
                    ).toFixed(0)}
                    % off original price
                  </p>
                </div>
                {bid.status === "active" && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => acceptBid(bid.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Accept Bid
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => rejectBid(bid.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Reject Bid
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredBids.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No bids found</p>
        </Card>
      )}
    </div>
  );
}
