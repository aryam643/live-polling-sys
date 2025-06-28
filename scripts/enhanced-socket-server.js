const express = require("express")
const { createServer } = require("http")
const { Server } = require("socket.io")
const cors = require("cors")

const app = express()
app.use(
  cors({
    origin: "*", // Allow all origins for flexibility
    methods: ["GET", "POST"],
    credentials: true,
  }),
)
app.use(express.json())

const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
})

// In-memory storage
let currentPoll = null
const students = new Map()
const pollHistory = []
const chatMessages = []
let pollTimer = null

io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  // Student joins - IMMEDIATE broadcast
  socket.on("join-as-student", ({ name }) => {
    console.log("👤 Student joining:", name)
    const student = {
      id: socket.id,
      name,
      hasAnswered: false,
      isOnline: true,
      joinedAt: new Date().toISOString(),
    }

    students.set(socket.id, student)

    // IMMEDIATE broadcast to all clients
    io.emit("student-joined", student)
    io.emit("students-list", Array.from(students.values()))

    console.log("📢 Student joined - immediate broadcast sent")

    // Send current poll if active
    if (currentPoll && currentPoll.isActive) {
      socket.emit("poll-created", currentPoll)
    }

    // Send chat history
    socket.emit("chat-history", chatMessages)
  })

  socket.on("get-current-poll", () => {
    if (currentPoll && currentPoll.isActive) {
      socket.emit("poll-created", currentPoll)
    }
  })

  // Teacher creates poll
  socket.on("create-poll", (poll) => {
    console.log("🎯 Creating new poll:", poll.question)

    // Clear any existing timer
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }

    currentPoll = {
      ...poll,
      results: {},
      totalVotes: 0,
    }

    // Reset all students' answer status
    students.forEach((student) => {
      student.hasAnswered = false
    })

    // Broadcast poll to all clients
    io.emit("poll-created", currentPoll)
    io.emit("students-list", Array.from(students.values()))

    // Start timer
    let timeLeft = poll.timeLimit
    io.emit("poll-time-update", timeLeft)

    pollTimer = setInterval(() => {
      timeLeft--
      io.emit("poll-time-update", timeLeft)

      if (timeLeft <= 0) {
        clearInterval(pollTimer)
        pollTimer = null
        currentPoll.isActive = false
        pollHistory.unshift({ ...currentPoll })
        io.emit("poll-ended")
        io.emit("poll-history", pollHistory)
      }
    }, 1000)
  })

  // Student submits answer - STOP TIMER when all answered
  socket.on("submit-answer", ({ pollId, answer }) => {
    if (!currentPoll || currentPoll.id !== pollId || !currentPoll.isActive) {
      return
    }

    const student = students.get(socket.id)
    if (!student || student.hasAnswered) {
      return
    }

    // Mark student as answered
    student.hasAnswered = true
    students.set(socket.id, student)

    // Update poll results
    currentPoll.results[answer] = (currentPoll.results[answer] || 0) + 1
    currentPoll.totalVotes++

    // Broadcast updated results
    io.emit("poll-answer", { studentId: socket.id, answer })
    io.emit("poll-results-updated", currentPoll.results)
    io.emit("students-list", Array.from(students.values()))

    // Check if all students have answered - STOP TIMER IMMEDIATELY
    const allAnswered = Array.from(students.values()).every((s) => s.hasAnswered)
    if (allAnswered && students.size > 0) {
      console.log("🏁 All students answered - stopping timer")
      if (pollTimer) {
        clearInterval(pollTimer)
        pollTimer = null
      }
      currentPoll.isActive = false
      pollHistory.unshift({ ...currentPoll })
      io.emit("poll-ended")
      io.emit("poll-history", pollHistory)
    }
  })

  // Clear poll
  socket.on("clear-poll", () => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
    currentPoll = null
    io.emit("clear-poll")
  })

  // Teacher kicks student
  socket.on("kick-student", (studentId) => {
    if (students.has(studentId)) {
      io.to(studentId).emit("kicked")
      students.delete(studentId)
      io.emit("student-left", studentId)
      io.emit("students-list", Array.from(students.values()))

      const studentSocket = io.sockets.sockets.get(studentId)
      if (studentSocket) {
        studentSocket.disconnect()
      }
    }
  })

  // Chat functionality
  socket.on("send-chat-message", (message) => {
    chatMessages.push(message)
    if (chatMessages.length > 100) {
      chatMessages.shift()
    }
    io.emit("chat-message", message)
  })

  socket.on("get-poll-history", () => {
    socket.emit("poll-history", pollHistory)
  })

  // Handle disconnect - IMMEDIATE update
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id)
    if (students.has(socket.id)) {
      students.delete(socket.id)
      io.emit("student-left", socket.id)
      io.emit("students-list", Array.from(students.values()))
    }
  })
})

// API routes
app.get("/", (req, res) => {
  res.json({
    message: "Live Polling System Socket Server",
    status: "running",
    timestamp: new Date().toISOString(),
  })
})

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    connectedStudents: students.size,
  })
})

const PORT = process.env.PORT || 3001
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Socket.io server running on port ${PORT}`)
})
