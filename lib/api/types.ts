// Shapes matching the backend's real responses (see docs/vendors.md, docs/products.md,
// docs/orders.md, docs/flash-sales.md, docs/chat.md in campus-bid-backend-web-app) —
// only the fields this app actually reads.

export interface VendorProfile {
  businessName: string
  ownerName?: string
  phoneNumber: string
  description?: string
  logo?: string
  banner?: string
}

export interface VendorLocation {
  address?: string
  building?: string
  type: "Point"
  coordinates: [number, number]
}

export interface BusinessHour {
  day: string
  openTime?: string
  closeTime?: string
  isClosed?: boolean
}

export interface BankDetails {
  accountName?: string
  accountNumber?: string
  bankName?: string
  isVerified?: boolean
}

export interface SafeVendor {
  _id: string
  email: string
  role: string
  profile: VendorProfile
  location: VendorLocation
  categories: string[]
  businessHours: BusinessHour[]
  rating: { average: number; count: number }
  stats: { totalOrders: number; completedOrders: number; totalRevenue: number }
  bankDetails: BankDetails
  isVerified: boolean
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface ProductSpecifications {
  weight?: string
  dimensions?: string
  other?: Record<string, unknown>
}

export interface Product {
  _id: string
  vendorId: string
  name: string
  description?: string
  category: string
  images?: string[]
  price: number
  discountPrice?: number
  stock: number
  isAvailable: boolean
  preparationTime?: number
  tags?: string[]
  specifications?: ProductSpecifications
  rating?: { average: number; count: number }
  isFlashSale?: boolean
  flashSaleId?: string
  views?: number
  soldCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface CreateProductInput {
  name: string
  description?: string
  category: string
  images?: string[]
  price: number
  discountPrice?: number
  stock?: number
  isAvailable?: boolean
  preparationTime?: number
  tags?: string[]
}

export interface OrderItem {
  productId: { _id: string; name: string; images?: string[] } | string
  productName: string
  productImage?: string
  quantity: number
  price: number
  isFlashSale?: boolean
}

export interface OrderParty {
  _id: string
  email: string
  profile?: { firstName?: string; lastName?: string }
}

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "completed"
  | "cancelled"
  | "refunded"

export interface Order {
  _id: string
  orderNumber: string
  customerId: OrderParty
  vendorId: string | { _id: string }
  items: OrderItem[]
  pricing: { subtotal: number; deliveryFee: number; serviceFee: number; total: number }
  status: OrderStatus
  statusHistory: { status: OrderStatus; timestamp: string; note?: string }[]
  estimatedDeliveryTime?: string
  actualDeliveryTime?: string
  cancellationReason?: string
  createdAt: string
}

export type FlashSaleStatus = "upcoming" | "active" | "completed" | "cancelled"

export interface FlashSaleBid {
  userId: string
  amount: number
  timestamp: string
}

export interface FlashSale {
  _id: string
  vendorId: string
  productId: { _id: string; name: string; images?: string[] } | string
  originalPrice: number
  startingBid: number
  currentBid?: number
  currentBidder?: string
  minimumBidIncrement: number
  quantity: number
  startTime: string
  endTime: string
  status: FlashSaleStatus
  bids: FlashSaleBid[]
  winner?: string
}

export interface DashboardPeriodStats {
  orders: number
  revenue: number
}

export interface VendorDashboard {
  stats: {
    today: DashboardPeriodStats
    thisWeek: DashboardPeriodStats
    thisMonth: DashboardPeriodStats
    allTime: DashboardPeriodStats & { completedOrders: number }
  }
  pendingOrders: number
  pendingBalance: number
  availableBalance: number
  activeListings: number
  activeFlashSales: number
  recentOrders: {
    orderNumber: string
    customer: { email: string; profile?: { firstName?: string; lastName?: string } }
    total: number
    status: OrderStatus
    createdAt: string
  }[]
}

export interface SalesAnalytics {
  totalOrders: number
  completedOrders: number
  cancelledOrders: number
  totalRevenue: number
  averageOrderValue: number
  dailyBreakdown: { _id: string; orders: number; revenue: number }[]
  topProducts: { productId: string; name: string; unitsSold: number; revenue: number }[]
}

export interface ProductAnalyticsItem {
  _id: string
  name: string
  views: number
  soldCount: number
  rating: { average: number; count: number }
}

// -- Chat (identical shapes to the customer app's lib/api/chat.ts — the backend
// is role-agnostic; only senderType/role query params differ) --

export interface Conversation {
  _id: string
  participants: { customerId: string; vendorId: string }
  orderId?: string
  lastMessage?: { text: string; senderId: string; timestamp: string }
  unreadCount: { customer: number; vendor: number }
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Message {
  _id: string
  conversationId: string
  senderId: string
  senderType: "customer" | "vendor"
  messageType: "text" | "predefined" | "image"
  content: string
  predefinedMessageId?: string
  isRead: boolean
  readAt?: string
  createdAt: string
}

export interface PredefinedMessage {
  _id: string
  role: "customer" | "vendor" | "both"
  category: string
  text: string
  isActive: boolean
  sortOrder: number
  createdAt: string
}

export interface CustomerSummary {
  _id: string
  email: string
  profile?: { firstName?: string; lastName?: string; profileImage?: string }
}
