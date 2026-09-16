const ACCESS_TOKEN_KEY = "campusbid.accessToken"
const REFRESH_TOKEN_KEY = "campusbid.refreshToken"

// The only module allowed to touch localStorage for auth tokens — everything
// else goes through these functions so the storage mechanism can change
// (e.g. to a cookie-based approach) without touching call sites.

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function clearTokens(): void {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(REFRESH_TOKEN_KEY)
}
