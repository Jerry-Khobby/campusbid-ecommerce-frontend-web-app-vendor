import { apiFetch } from "./client"
import type { Conversation, Message, PredefinedMessage } from "./types"

export const chatConversationsQueryKey = ["chat", "conversations"] as const

export function chatMessagesQueryKey(conversationId: string) {
  return ["chat", "conversations", conversationId, "messages"] as const
}

/** The caller's own conversations (role-derived server-side from the JWT — a vendor
 * automatically gets conversations filtered by participants.vendorId). Note: the
 * backend never populates participants.customerId, so there's no name/avatar to
 * show here — the UI falls back to a generic "Customer" label. */
export async function fetchConversations(): Promise<Conversation[]> {
  const json = await apiFetch<{ data: Conversation[] }>("/chat/conversations")
  return json.data
}

/** A page of a conversation's messages, newest-first as returned by the server. */
export async function fetchMessages(conversationId: string, skip = 0, limit = 30): Promise<Message[]> {
  const json = await apiFetch<{ data: Message[] }>(`/chat/conversations/${conversationId}/messages`, {
    query: { skip, limit },
  })
  return json.data
}

export async function fetchPredefinedMessages(category?: string): Promise<PredefinedMessage[]> {
  const json = await apiFetch<{ data: PredefinedMessage[] }>("/chat/predefined-messages", {
    query: { role: "vendor", category },
  })
  return json.data
}
