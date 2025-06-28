"use client"

import { useState, useEffect, useRef } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Send, X, Users } from "lucide-react"
import { useSocket } from "@/hooks/use-socket"
import type { RootState } from "@/store/store"
import { addMessage, toggleChat, clearUnreadCount } from "@/store/slices/chatSlice"

interface Student {
  id: string
  name: string
  hasAnswered: boolean
  isOnline: boolean
  joinedAt: string
}

interface ChatPopupProps {
  isTeacher: boolean
  students?: Student[]
  onKickStudent?: (studentId: string) => void
}

export function ChatPopup({ isTeacher, students = [], onKickStudent }: ChatPopupProps) {
  const dispatch = useDispatch()
  const { messages, isOpen, unreadCount } = useSelector((state: RootState) => state.chat)
  const { currentStudent } = useSelector((state: RootState) => state.student)

  const [message, setMessage] = useState("")
  const [activeTab, setActiveTab] = useState<"chat" | "participants">("chat")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const socket = useSocket()

  const senderName = isTeacher ? "Teacher" : currentStudent?.name || "Student"

  useEffect(() => {
    if (!socket) return

    socket.on("chat-message", (chatMessage) => {
      dispatch(addMessage(chatMessage))
    })

    return () => {
      socket.off("chat-message")
    }
  }, [socket, dispatch])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = () => {
    if (!message.trim() || !socket) return

    const chatMessage = {
      id: Date.now().toString(),
      sender: senderName,
      message: message.trim(),
      timestamp: new Date().toISOString(),
      isTeacher,
    }

    socket.emit("send-chat-message", chatMessage)
    setMessage("")
  }

  const handleToggleChat = () => {
    dispatch(toggleChat())
    if (!isOpen) {
      dispatch(clearUnreadCount())
    }
  }

  return (
    <>
      {/* Chat Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleToggleChat}
          className="relative w-14 h-14 rounded-full shadow-lg bg-primary hover:bg-primary-medium text-white"
        >
          <MessageCircle className="w-6 h-6" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 flex items-center justify-center bg-red-500 text-white">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Chat Popup */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 h-96">
          <Card className="h-full shadow-xl border-0">
            <div className="bg-primary text-white p-4 rounded-t-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActiveTab("chat")}
                    className={`font-medium ${activeTab === "chat" ? "text-white" : "text-white/70"}`}
                  >
                    Chat
                  </button>
                  {isTeacher && (
                    <button
                      onClick={() => setActiveTab("participants")}
                      className={`font-medium flex items-center gap-1 ${
                        activeTab === "participants" ? "text-white" : "text-white/70"
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      Participants
                    </button>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleChat}
                  className="text-white hover:bg-white/20 p-1 h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <CardContent className="p-0 flex flex-col h-full">
              {activeTab === "chat" ? (
                <>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No messages yet</p>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div key={msg.id} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-600">{msg.sender}</span>
                            <span className="text-xs text-gray-400">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <div
                            className={`p-3 rounded-lg max-w-[80%] ${
                              msg.sender === senderName
                                ? "bg-primary text-white ml-auto"
                                : msg.isTeacher
                                  ? "bg-primary/10 text-primary"
                                  : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            <p className="text-sm">{msg.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t bg-gray-50">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                        className="flex-1 border-gray-300 focus:border-primary focus:ring-primary"
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!message.trim()}
                        size="sm"
                        className="bg-primary hover:bg-primary-medium text-white"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                /* Participants Tab */
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-700 mb-4">Participants ({students.length})</div>
                    {students.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${student.isOnline ? "bg-green-500" : "bg-gray-400"}`}
                          />
                          <span className="text-sm font-medium">{student.name}</span>
                          {student.hasAnswered && (
                            <Badge variant="secondary" className="text-xs">
                              Answered
                            </Badge>
                          )}
                        </div>
                        {isTeacher && onKickStudent && (
                          <Button
                            onClick={() => onKickStudent(student.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs px-2 py-1"
                          >
                            Kick out
                          </Button>
                        )}
                      </div>
                    ))}

                    {students.length === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No participants yet</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
