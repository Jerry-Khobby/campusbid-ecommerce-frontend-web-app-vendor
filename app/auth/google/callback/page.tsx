"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { setTokens } from "@/lib/api/token-storage"
import { useUser } from "@/lib/user-context"
import { useNotification } from "@/lib/notification-context"

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={null}>
      <GoogleCallbackHandler />
    </Suspense>
  )
}

function GoogleCallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refetchUser } = useUser()
  const { addNotification } = useNotification()

  useEffect(() => {
    const accessToken = searchParams.get("accessToken")
    const refreshToken = searchParams.get("refreshToken")

    if (!accessToken || !refreshToken) {
      addNotification("Google login failed. Please try again.", "error")
      router.replace("/vendor/login")
      return
    }

    setTokens(accessToken, refreshToken)
    refetchUser().then(() => {
      addNotification("Logged in with Google", "success")
      router.replace("/vendor/dashboard")
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="w-full max-w-md mx-auto px-4 py-16 text-center">
      <p className="text-muted-foreground">Signing you in…</p>
    </main>
  )
}
