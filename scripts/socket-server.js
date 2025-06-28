const express = require("express")
const { createServer } = require("http")
const { Server } = require("socket.io")
const cors = require("cors")

const app = express()
app.use(cors())

const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
})

// Store active polls and students
let currentPoll = null
const students = new Map()
let pollTimer = null

io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  // Student joins
  socket.on("join-as-student", ({ name }) => {
    const student = {
      id: socket.id,
      name,
      hasAnswered: false,
    }

    students.set(socket.id, student)
    socket.emit("student-joined", student)
    socket.broadcast.emit("student-joined", student)

    // Send current poll if active
    if (currentPoll && currentPoll.isActive) {
      socket.emit("poll-created", currentPoll)
    }
  })

  // Teacher creates poll
  socket.on("create-poll", (poll) => {
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

    // Start timer
    let timeLeft = poll.timeLimit
    pollTimer = setInterval(() => {
      timeLeft--
      io.emit("poll-time-update", timeLeft)

      if (timeLeft <= 0) {
        clearInterval(pollTimer)
        currentPoll.isActive = false
        io.emit("poll-ended")
      }
    }, 1000)
  })

  // Student submits answer
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

    // Check if all students have answered
    const allAnswered = Array.from(students.values()).every((s) => s.hasAnswered)
    if (allAnswered && students.size > 0) {
      clearInterval(pollTimer)
      currentPoll.isActive = false
      io.emit("poll-ended")
    }
  })

  // Teacher ends poll
  socket.on("end-poll", (pollId) => {
    if (currentPoll && currentPoll.id === pollId) {
      clearInterval(pollTimer)
      currentPoll.isActive = false
      io.emit("poll-ended")
    }
  })

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id)

    if (students.has(socket.id)) {
      students.delete(socket.id)
      socket.broadcast.emit("student-left", socket.id)
    }
  })
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`)
})
