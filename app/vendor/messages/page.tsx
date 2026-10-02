"use client"

import { useEffect, useRef, useState } from "react"
import type { Socket } from "socket.io-client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useNotification } from "@/lib/notification-context"
import { useUser } from "@/lib/user-context"
import { ApiError } from "@/lib/api/client"
import { fetchConversations, fetchMessages, fetchPredefinedMessages } from "@/lib/api/chat"
import {
  CHAT_EVENTS,
  createChatSocket,
  joinConversation,
  markConversationRead,
  sendChatMessage,
} from "@/lib/socket/chat-socket"
import type { Conversation, Message, PredefinedMessage } from "@/lib/api/types"

const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

function getErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Please try again."
}

function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function formatRelativeTime(iso: string): string {
  const elapsedMs = Date.now() - new Date(iso).getTime()
  if (elapsedMs < MINUTE_MS) return "just now"
  if (elapsedMs < HOUR_MS) return `${Math.floor(elapsedMs / MINUTE_MS)}m ago`
  if (elapsedMs < DAY_MS) return `${Math.floor(elapsedMs / HOUR_MS)}h ago`
  return new Date(iso).toLocaleDateString()
}

/** The backend never populates participants.customerId, so there's no name to show —
 * a short, stable label derived from the id at least lets conversations be told apart. */
function getCustomerLabel(conversation: Conversation): string {
  return `Customer #${conversation.participants.customerId.slice(-6)}`
}

function getCustomerInitials(conversation: Conversation): string {
  return conversation.participants.customerId.slice(-2).toUpperCase()
}

export default function VendorMessagesPage() {
  const { user } = useUser()
  const { addNotification } = useNotification()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [predefinedMessages, setPredefinedMessages] = useState<PredefinedMessage[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isOptionsOpen, setIsOptionsOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)

  const socketRef = useRef<Socket | null>(null)
  const selectedConversationIdRef = useRef<string | null>(null)

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId
  }, [selectedConversationId])

  useEffect(() => {
    let isCancelled = false

    Promise.all([fetchConversations(), fetchPredefinedMessages()])
      .then(([conversationData, predefinedData]) => {
        if (!isCancelled) {
          setConversations(conversationData)
          setPredefinedMessages(predefinedData)
        }
      })
      .catch((error) => {
        if (!isCancelled) addNotification(getErrorMessage(error), "error")
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingConversations(false)
      })

    return () => {
      isCancelled = true
    }
  }, [addNotification])

  // Connect once on mount; the same socket is reused across conversation switches and re-renders.
  useEffect(() => {
    const socket = createChatSocket()
    socketRef.current = socket

    const handleMessageReceived = (message: Message) => {
      if (message.conversationId !== selectedConversationIdRef.current) return
      setMessages((previous) => [...previous, message])
    }

    socket.on(CHAT_EVENTS.messageReceived, handleMessageReceived)
    socket.connect()

    return () => {
      socket.off(CHAT_EVENTS.messageReceived, handleMessageReceived)
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  // Join the selected conversation's room and mark it read whenever the selection changes.
  useEffect(() => {
    const socket = socketRef.current
    if (!socket || !selectedConversationId) return

    const joinAndMarkRead = () => {
      joinConversation(socket, selectedConversationId)
      markConversationRead(socket, selectedConversationId)
    }

    if (socket.connected) joinAndMarkRead()
    else socket.once("connect", joinAndMarkRead)

    return () => {
      socket.off("connect", joinAndMarkRead)
    }
  }, [selectedConversationId])

  useEffect(() => {
    if (!selectedConversationId) return
    let isCancelled = false

    fetchMessages(selectedConversationId)
      .then((data) => {
        if (!isCancelled) setMessages([...data].reverse())
      })
      .catch((error) => {
        if (!isCancelled) addNotification(getErrorMessage(error), "error")
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingMessages(false)
      })

    return () => {
      isCancelled = true
    }
  }, [selectedConversationId, addNotification])

  const selectedConversation = conversations.find((c) => c._id === selectedConversationId) ?? null

  const filteredConversations = conversations.filter((conv) =>
    getCustomerLabel(conv).toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSelectConversation = (conversation: Conversation) => {
    // Re-selecting the open conversation doesn't refetch, so only reset then.
    if (conversation._id !== selectedConversationId) {
      setMessages([])
      setIsLoadingMessages(true)
    }
    setSelectedConversationId(conversation._id)
    setIsChatOpen(true)
    setConversations((current) =>
      current.map((c) => (c._id === conversation._id ? { ...c, unreadCount: { ...c.unreadCount, vendor: 0 } } : c)),
    )
  }

  const handleSendPredefined = (predefined: PredefinedMessage) => {
    const socket = socketRef.current
    if (!socket || !selectedConversationId || !user) return

    sendChatMessage(socket, {
      conversationId: selectedConversationId,
      messageType: "predefined",
      content: predefined.text,
      predefinedMessageId: predefined._id,
    })
    addNotification("Message sent", "success")
  }

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount.vendor, 0)

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground mt-1">Chat with your customers</p>
        </div>
        {totalUnread > 0 && (
          <div className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm font-medium">
            {totalUnread} unread
          </div>
        )}
      </div>

      <Card className="h-[calc(100vh-240px)] flex-row gap-0 py-0 overflow-hidden">
        {/* Conversations List */}
        <div
          className={`${isChatOpen ? "hidden md:flex" : "flex"} w-full md:w-80 border-r border-border flex-col`}
        >
          <div className="p-4 border-b border-border">
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-xl">
                🔍
              </span>
              <Input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoadingConversations && (
              <p className="text-sm text-muted-foreground text-center py-6">Loading conversations…</p>
            )}
            {!isLoadingConversations && filteredConversations.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No conversations yet</p>
            )}
            {filteredConversations.map((conv) => (
              <button
                key={conv._id}
                onClick={() => handleSelectConversation(conv)}
                className={`w-full p-4 border-b border-border hover:bg-muted/50 transition-colors text-left ${
                  selectedConversationId === conv._id ? "bg-muted" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-primary">{getCustomerInitials(conv)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold truncate">{getCustomerLabel(conv)}</p>
                      <span className="text-xs text-muted-foreground">
                        {conv.lastMessage ? formatRelativeTime(conv.lastMessage.timestamp) : ""}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.lastMessage?.text ?? "Start a conversation"}
                    </p>
                  </div>
                  {conv.unreadCount.vendor > 0 && (
                    <div className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                      {conv.unreadCount.vendor}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        {selectedConversation ? (
          <div className={`${isChatOpen ? "flex" : "hidden md:flex"} flex-1 flex-col`}>
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="md:hidden p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <span className="text-xl">←</span>
                </button>
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">{getCustomerInitials(selectedConversation)}</span>
                </div>
                <p className="font-semibold">{getCustomerLabel(selectedConversation)}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsOptionsOpen(true)}>
                <span className="text-xl">⋮</span>
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingMessages && <p className="text-center text-muted-foreground text-sm">Loading messages…</p>}
              {!isLoadingMessages && messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground text-sm">No messages yet. Send a quick reply to start.</p>
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message._id}
                  className={`flex ${message.senderType === "vendor" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.senderType === "vendor"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.senderType === "vendor" ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      {formatMessageTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-border bg-background">
              <p className="text-xs text-muted-foreground mb-3 text-center font-medium">
                💬 Select a message to send:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {predefinedMessages.map((message) => (
                  <Button
                    key={message._id}
                    onClick={() => handleSendPredefined(message)}
                    variant="outline"
                    className="text-sm h-auto py-3 px-3 whitespace-normal text-left justify-start hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all active:scale-95 font-medium shadow-sm"
                  >
                    {message.text}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-muted-foreground">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </Card>

      <Dialog open={isOptionsOpen} onOpenChange={setIsOptionsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conversation options</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                setIsOptionsOpen(false)
                addNotification("Customer profiles coming soon!", "info")
              }}
            >
              View customer profile
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
