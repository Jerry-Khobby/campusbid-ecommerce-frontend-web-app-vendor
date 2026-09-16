import { io, type Socket } from "socket.io-client"
import { getAccessToken } from "@/lib/api/token-storage"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export type SocketNamespace = "/chat" | "/notifications"

/**
 * Connects to a backend Socket.IO namespace. Note the base URL has NO /api
 * suffix here — the backend's global HTTP prefix does not apply to
 * WebSocket namespaces, only to its Express-routed REST controllers.
 */
export function createSocket(namespace: SocketNamespace, options?: { withAuth?: boolean }): Socket {
  const auth = options?.withAuth ? { token: getAccessToken() ?? undefined } : undefined

  return io(`${API_BASE_URL}${namespace}`, {
    autoConnect: false,
    transports: ["websocket", "polling"],
    auth,
  })
}
