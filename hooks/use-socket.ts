"use client"

import { useEffect, useState } from "react"
import { io, type Socket } from "socket.io-client"

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    // Use environment variable for production, fallback to localhost for development
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001"

    const socketInstance = io(socketUrl, {
      transports: ["websocket", "polling"],
      timeout: 20000,
      forceNew: false,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketInstance.on("connect", () => {
      console.log("✅ Connected to server:", socketInstance.id)
    })

    socketInstance.on("disconnect", (reason) => {
      console.log("❌ Disconnected from server:", reason)
    })

    socketInstance.on("connect_error", (error) => {
      console.error("🔥 Connection error:", error)
    })

    setSocket(socketInstance)

    return () => {
      console.log("🧹 Cleaning up socket connection")
      socketInstance.disconnect()
    }
  }, [])

  return socket
}
