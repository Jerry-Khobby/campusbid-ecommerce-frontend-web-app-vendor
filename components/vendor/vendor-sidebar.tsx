"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser } from "@/lib/user-context"
import { useRouter } from "next/navigation"
import { useNotification } from "@/lib/notification-context"
import { NotificationBell } from "@/components/notification-bell"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/vendor/dashboard", icon: "📊" },
  { name: "Products", href: "/vendor/products", icon: "📦" },
  { name: "Orders", href: "/vendor/orders", icon: "🛒" },
  { name: "Bids", href: "/vendor/bids", icon: "⚡" },
  { name: "Messages", href: "/vendor/messages", icon: "💬" },
  { name: "Analytics", href: "/vendor/analytics", icon: "📈" },
  { name: "Payouts", href: "/vendor/payouts", icon: "💵" },
  { name: "Settings", href: "/vendor/settings", icon: "⚙️" },
]

export function VendorSidebar() {
  const pathname = usePathname()
  const { user, logout } = useUser()
  const router = useRouter()
  const { addNotification } = useNotification()

  const handleLogout = async () => {
    await logout()
    addNotification("Logged out successfully", "success")
    router.push("/vendor/login")
  }

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      <div className="p-6 border-b border-border flex items-center justify-between gap-2">
        <Link href="/vendor/dashboard" className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-lg shrink-0">🏪</div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold truncate">CampusBid</h1>
            <p className="text-xs text-muted-foreground truncate">Vendor Portal</p>
          </div>
        </Link>
        <NotificationBell />
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <span className="text-lg">{item.icon}</span>
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="bg-accent/50 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-base font-semibold text-primary-foreground">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-background hover:bg-accent border border-border w-full transition-colors"
          >
            <span className="text-base">🚪</span>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
