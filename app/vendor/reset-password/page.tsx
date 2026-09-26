"use client"

import type React from "react"
import { Suspense, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNotification } from "@/lib/notification-context"
import { useRouter, useSearchParams } from "next/navigation"
import { resetPassword } from "@/lib/api/auth"
import { ApiError } from "@/lib/api/client"

export default function VendorResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <VendorResetPasswordPageInner />
    </Suspense>
  )
}

function VendorResetPasswordPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { addNotification } = useNotification()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || !confirmPassword) return
    if (password !== confirmPassword) {
      addNotification("Passwords do not match", "error")
      return
    }
    if (!token) {
      addNotification("This reset link is invalid or has expired", "error")
      return
    }

    setIsSubmitting(true)
    try {
      await resetPassword(token, password)
      addNotification("Password reset successfully!", "success")
      router.push("/vendor/login")
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Something went wrong, please try again"
      addNotification(message, "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-xl">🏪</div>
            <div>
              <h1 className="text-2xl font-bold">CampusBid</h1>
              <p className="text-sm text-muted-foreground">Vendor Portal</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Reset Password</h2>
          <p className="text-sm text-muted-foreground">Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Password must be at least 8 characters long and include uppercase, lowercase, and numbers
          </p>
        </div>
      </Card>
    </div>
  )
}
