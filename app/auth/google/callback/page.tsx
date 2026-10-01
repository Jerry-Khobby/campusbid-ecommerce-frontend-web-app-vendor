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
    const error = searchParams.get("error")
    if (error) {
      addNotification(error, "error")
      // The backend only includes the email for an account it doesn't know yet;
      // any other refusal (pending approval, suspended) belongs on sign-in.
      const email = searchParams.get("email")
      const params = email ? `?${new URLSearchParams({ mode: "signup", email }).toString()}` : ""
      router.replace(`/vendor/login${params}`)
      return
    }

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
