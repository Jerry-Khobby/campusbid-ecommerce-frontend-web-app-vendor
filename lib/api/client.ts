import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "./token-storage"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

if (!API_BASE_URL && typeof window !== "undefined") {
  console.error("NEXT_PUBLIC_API_BASE_URL is not set — API calls will fail. See .env.local.example.")
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
  query?: Record<string, string | number | boolean | undefined>
  auth?: boolean // defaults to true — set false for public endpoints called before login
}

// Ensures concurrent 401s trigger only one refresh call, not one per request.
let refreshPromise: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return false

    try {
      const response = await fetch(`${API_BASE_URL}/api/vendors/refresh`, {
        method: "POST",
        headers: { Authorization: `Bearer ${refreshToken}` },
      })
      if (!response.ok) return false

      const json = await response.json()
      setTokens(json.tokens.accessToken, json.tokens.refreshToken)
      return true
    } catch {
      return false
    }
  })()

  const result = await refreshPromise
  refreshPromise = null
  return result
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(`${API_BASE_URL}/api${path}`)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const json = await response.json()
    return json.message ?? response.statusText
  } catch {
    return response.statusText
  }
}

async function performFetch(path: string, options: RequestOptions, retryOn401: boolean): Promise<Response> {
  const { method = "GET", body, query, auth = true } = options

  const headers: Record<string, string> = {}
  if (body !== undefined) headers["Content-Type"] = "application/json"
  if (auth) {
    const token = getAccessToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (response.status === 401 && auth && retryOn401) {
    const refreshed = await refreshAccessToken()
    if (refreshed) return performFetch(path, options, false)
    clearTokens()
  }

  return response
}

/** Calls the backend's JSON REST API. Throws ApiError on any non-2xx response. */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await performFetch(path, options, true)

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorMessage(response))
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

/** Calls a multipart/form-data endpoint (file uploads, registration). Throws ApiError on any non-2xx response. */
export async function apiUpload<T>(path: string, formData: FormData, method: "POST" | "PUT" = "POST"): Promise<T> {
  const token = getAccessToken()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(buildUrl(path), { method, headers, body: formData })

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorMessage(response))
  }

  return response.json() as Promise<T>
}
