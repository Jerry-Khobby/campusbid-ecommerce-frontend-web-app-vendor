"use client"

import { useState } from "react"
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

interface Message {
  id: string
  text: string
  sender: "vendor" | "customer"
  timestamp: string
}

interface Conversation {
  id: string
  customer: string
  customerAvatar: string
  lastMessage: string
  timestamp: string
  unread: number
  online: boolean
  messages: Message[]
}

const mockConversations: Conversation[] = [
  {
    id: "CONV-001",
    customer: "John Doe",
    customerAvatar: "JD",
    lastMessage: "Is the coffee still available?",
    timestamp: "2m ago",
    unread: 2,
    online: true,
    messages: [
      {
        id: "MSG-001",
        text: "Hi! I'm interested in the Coffee & Pastry Bundle",
        sender: "customer",
        timestamp: "10:30 AM",
      },
      {
        id: "MSG-002",
        text: "Hello! Yes, we have it available. Would you like to place an order?",
        sender: "vendor",
        timestamp: "10:31 AM",
      },
      {
        id: "MSG-003",
        text: "Is the coffee still available?",
        sender: "customer",
        timestamp: "10:35 AM",
      },
    ],
  },
  {
    id: "CONV-002",
    customer: "Jane Smith",
    customerAvatar: "JS",
    lastMessage: "Thank you for the quick service!",
    timestamp: "1h ago",
    unread: 0,
    online: false,
    messages: [
      {
        id: "MSG-004",
        text: "When will my order be ready?",
        sender: "customer",
        timestamp: "9:15 AM",
      },
      {
        id: "MSG-005",
        text: "Your order will be ready in about 10 minutes!",
        sender: "vendor",
        timestamp: "9:16 AM",
      },
      {
        id: "MSG-006",
        text: "Thank you for the quick service!",
        sender: "customer",
        timestamp: "9:30 AM",
      },
    ],
  },
  {
    id: "CONV-003",
    customer: "Mike Johnson",
    customerAvatar: "MJ",
    lastMessage: "Can I customize my order?",
    timestamp: "3h ago",
    unread: 1,
    online: true,
    messages: [
      {
        id: "MSG-007",
        text: "Can I customize my order?",
        sender: "customer",
        timestamp: "8:00 AM",
      },
    ],
  },
  {
    id: "CONV-004",
    customer: "Sarah Williams",
    customerAvatar: "SW",
    lastMessage: "Perfect, I'll pick it up soon",
    timestamp: "Yesterday",
    unread: 0,
    online: false,
    messages: [
      {
        id: "MSG-008",
        text: "Is the sushi fresh today?",
        sender: "customer",
        timestamp: "Yesterday 2:30 PM",
      },
      {
        id: "MSG-009",
        text: "Yes! We prepare it fresh every morning.",
        sender: "vendor",
        timestamp: "Yesterday 2:31 PM",
      },
      {
        id: "MSG-010",
        text: "Perfect, I'll pick it up soon",
        sender: "customer",
        timestamp: "Yesterday 2:35 PM",
      },
    ],
  },
]

const PREDEFINED_MESSAGES = [
  "Yes, it's still available!",
  "Sorry, that item is currently out of stock.",
  "Your order will be ready in about 10 minutes.",
  "Thank you for your order!",
  "Yes, we can customize that for you.",
  "Your order is ready for pickup.",
  "Sorry for the delay, we're working on it.",
  "Is there anything else you'd like to add?",
  "Yes",
  "No, sorry.",
]

export default function VendorMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    mockConversations.map((conv, index) => (index === 0 ? { ...conv, unread: 0 } : conv)),
  )
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(conversations[0])
  const [searchQuery, setSearchQuery] = useState("")
  const [isOptionsOpen, setIsOptionsOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const { addNotification } = useNotification()

  const filteredConversations = conversations.filter((conv) =>
    conv.customer.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSendMessage = (messageText: string) => {
    if (!messageText.trim() || !selectedConversation) return

    const newMessage: Message = {
      id: `MSG-${Date.now()}`,
      text: messageText,
      sender: "vendor",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setConversations(
      conversations.map((conv) =>
        conv.id === selectedConversation.id
          ? {
              ...conv,
              messages: [...conv.messages, newMessage],
              lastMessage: messageText,
              timestamp: "Just now",
            }
          : conv,
      ),
    )

    setSelectedConversation({
      ...selectedConversation,
      messages: [...selectedConversation.messages, newMessage],
    })

    addNotification("Message sent", "success")
  }

  const handleSelectConversation = (conversation: Conversation) => {
    const readConversation = { ...conversation, unread: 0 }

    setConversations(conversations.map((conv) => (conv.id === conversation.id ? readConversation : conv)))
    setSelectedConversation(readConversation)
    setIsChatOpen(true)
  }

  const handleClearConversation = () => {
    if (!selectedConversation) return

    setConversations(
      conversations.map((conv) => (conv.id === selectedConversation.id ? { ...conv, messages: [] } : conv)),
    )
    setSelectedConversation({ ...selectedConversation, messages: [] })
    setIsOptionsOpen(false)
    addNotification("Conversation cleared", "success")
  }

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread, 0)

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
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className={`w-full p-4 border-b border-border hover:bg-muted/50 transition-colors text-left ${
                  selectedConversation?.id === conv.id ? "bg-muted" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-primary">{conv.customerAvatar}</span>
                    </div>
                    {conv.online && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold truncate">{conv.customer}</p>
                      <span className="text-xs text-muted-foreground">{conv.timestamp}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 && (
                    <div className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                      {conv.unread}
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
                <div className="relative">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">{selectedConversation.customerAvatar}</span>
                  </div>
                  {selectedConversation.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full" />
                  )}
                </div>
                <div>
                  <p className="font-semibold">{selectedConversation.customer}</p>
                  <p className="text-xs text-muted-foreground">{selectedConversation.online ? "Online" : "Offline"}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsOptionsOpen(true)}>
                <span className="text-xl">⋮</span>
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedConversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "vendor" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender === "vendor" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.sender === "vendor" ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      {message.timestamp}
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
                {PREDEFINED_MESSAGES.map((message, index) => (
                  <Button
                    key={index}
                    onClick={() => handleSendMessage(message)}
                    variant="outline"
                    className="text-sm h-auto py-3 px-3 whitespace-normal text-left justify-start hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all active:scale-95 font-medium shadow-sm"
                  >
                    {message}
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
            <Button variant="outline" className="w-full justify-start" onClick={handleClearConversation}>
              Clear conversation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
