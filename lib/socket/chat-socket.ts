import type { Socket } from "socket.io-client"
import { createSocket } from "./client"
import type { Message } from "@/lib/api/types"

/** Event names for the `/chat` namespace (see docs/chat.md) — kept in one place to avoid magic strings. */
export const CHAT_EVENTS = {
  join: "join_conversation",
  markRead: "mark_as_read",
  sendMessage: "send_message",
  typing: "typing",
  messageReceived: "message_received",
  messageRead: "message_read",
  typingIndicator: "typing_indicator",
} as const

export interface SendMessagePayload {
  conversationId: string
  senderId: string
  senderType: "vendor"
  messageType: "text" | "predefined" | "image"
  content: string
  /** Set when messageType is "predefined"; the backend's Message schema stores this but docs/chat.md's
   * documented socket payload only lists the fields above — sent as an extra, backward-compatible field. */
  predefinedMessageId?: string
}

export interface TypingPayload {
  conversationId: string
  userId: string
  isTyping: boolean
}

export interface MessageReadEvent {
  conversationId: string
  readAt: string
}

export type MessageReceivedEvent = Message

/** Connects to the chat gateway. The gateway has no server-side auth (see docs/chat.md), so no token is sent. */
export function createChatSocket(): Socket {
  return createSocket("/chat")
}

export function joinConversation(socket: Socket, conversationId: string): void {
  socket.emit(CHAT_EVENTS.join, { conversationId })
}

export function markConversationRead(socket: Socket, conversationId: string): void {
  socket.emit(CHAT_EVENTS.markRead, { conversationId })
}

export function sendChatMessage(socket: Socket, payload: SendMessagePayload): void {
  socket.emit(CHAT_EVENTS.sendMessage, payload)
}

export function emitTyping(socket: Socket, payload: TypingPayload): void {
  socket.emit(CHAT_EVENTS.typing, payload)
}
