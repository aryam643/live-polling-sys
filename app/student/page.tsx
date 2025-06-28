"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { RefreshCw, Clock } from "lucide-react"
import { useSocket } from "@/hooks/use-socket"
import { PollResults } from "@/components/poll-results"
import { ChatPopup } from "@/components/chat-popup"
import type { RootState } from "@/store/store"
import { setCurrentPoll, updateTimeRemaining, clearCurrentPoll } from "@/store/slices/pollSlice"
import { setCurrentStudent, setSelectedAnswer } from "@/store/slices/studentSlice"

export default function StudentPage() {
  const dispatch = useDispatch()
  const { currentPoll, timeRemaining } = useSelector((state: RootState) => state.poll)
  const { currentStudent, selectedAnswer } = useSelector((state: RootState) => state.student)

  const [studentName, setStudentName] = useState("")
  const [isJoined, setIsJoined] = useState(false)
  const [isKicked, setIsKicked] = useState(false)

  const socket = useSocket()

  useEffect(() => {
    const storedName = sessionStorage.getItem("studentName")
    if (storedName) {
      setStudentName(storedName)
      setIsJoined(true)
      dispatch(setCurrentStudent({ name: storedName, hasAnswered: false }))
      if (socket) {
        socket.emit("join-as-student", { name: storedName })
      }
    }
  }, [socket, dispatch])

  useEffect(() => {
    if (!socket) return

    socket.on("poll-created", (poll) => {
      dispatch(setCurrentPoll(poll))
      if (currentStudent) {
        dispatch(setCurrentStudent({ ...currentStudent, hasAnswered: false }))
      }
      dispatch(setSelectedAnswer(""))
    })

    socket.on("poll-ended", () => {
      if (currentPoll) {
        dispatch(setCurrentPoll({ ...currentPoll, isActive: false }))
      }
    })

    socket.on("poll-time-update", (time) => {
      console.log("⏰ Timer update received:", time)
      dispatch(updateTimeRemaining(time))
    })

    socket.on("poll-results-updated", (results: Record<string, number>) => {
      if (currentPoll) {
        const totalVotes = Object.values(results).reduce((sum: number, count: number) => sum + count, 0)
        dispatch(
          setCurrentPoll({
            ...currentPoll,
            results,
            totalVotes,
          }),
        )
      }
    })

    socket.on("kicked", () => {
      sessionStorage.removeItem("studentName")
      setIsJoined(false)
      setIsKicked(true)
      setStudentName("")
      dispatch(clearCurrentPoll())
      dispatch(setCurrentStudent(null))
    })

    socket.on("clear-poll", () => {
      dispatch(clearCurrentPoll())
    })

    return () => {
      socket.off("poll-created")
      socket.off("poll-ended")
      socket.off("poll-time-update")
      socket.off("poll-results-updated")
      socket.off("kicked")
      socket.off("clear-poll")
    }
  }, [socket, dispatch, currentPoll, currentStudent])

  const joinAsStudent = () => {
    if (!studentName.trim()) return

    sessionStorage.setItem("studentName", studentName.trim())
    setIsJoined(true)
    setIsKicked(false)
    dispatch(setCurrentStudent({ name: studentName.trim(), hasAnswered: false }))

    if (socket) {
      socket.emit("join-as-student", { name: studentName.trim() })
      socket.emit("get-current-poll")
    }
  }

  const submitAnswer = () => {
    if (!selectedAnswer || !currentPoll || !currentStudent) return

    console.log("Submitting answer:", selectedAnswer)
    dispatch(setCurrentStudent({ ...currentStudent, hasAnswered: true }))

    if (socket) {
      socket.emit("submit-answer", {
        pollId: currentPoll.id,
        answer: selectedAnswer,
      })
    }
    // Don't modify timer here - let server handle it
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Kicked out screen
  if (isKicked) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-primary text-white px-4 py-2 rounded-full mb-6 inline-block">🎯 Intervue Poll</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">You've been Kicked out !</h1>
          <p className="text-gray-600 mb-8">
            Looks like the teacher had removed you from the poll system. Please Try again sometime.
          </p>
          <button
            onClick={() => {
              setIsKicked(false)
              setIsJoined(false)
              setStudentName("")
            }}
            className="bg-primary hover:bg-primary-medium text-white px-6 py-3 rounded-full transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Student Name Entry Screen
  if (!isJoined) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="bg-primary text-white px-4 py-2 rounded-full mb-6 inline-block">🎯 Intervue Poll</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Let's Get Started</h1>
            <p className="text-gray-600">
              If you're a student, you'll be able to <span className="font-semibold">submit your answers</span>,
              participate in live polls, and see how your responses compare with your classmates
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Enter your Name</label>
              <input
                type="text"
                placeholder="Rahul Bajaj"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && joinAsStudent()}
                className="w-full h-12 px-4 text-lg border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 outline-none transition-colors"
              />
            </div>

            <button
              onClick={joinAsStudent}
              disabled={!studentName.trim()}
              className={`w-full h-12 text-lg font-medium rounded-full transition-colors ${
                studentName.trim()
                  ? "bg-primary hover:bg-primary-medium text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Waiting Screen
  if (!currentPoll) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="bg-primary text-white px-4 py-2 rounded-full mb-6 inline-block">🎯 Intervue Poll</div>
          <div className="mb-8">
            <RefreshCw className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Wait for the teacher to ask questions..</h2>
            <p className="text-sm text-gray-500 mt-4">Connected as: {currentStudent?.name || studentName}</p>
          </div>
        </div>
        <ChatPopup isTeacher={false} />
      </div>
    )
  }

  // Active Poll Screen - Student can answer
  if (currentPoll?.isActive && currentStudent && !currentStudent.hasAnswered && timeRemaining > 0) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header with Timer - Matching the design */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Question 1</h1>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-500" />
              <span className="text-red-500 font-mono text-xl font-bold">{formatTime(timeRemaining)}</span>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-xl border-2 border-gray-200 max-w-3xl mx-auto mb-8 overflow-hidden">
            <div className="bg-gray-dark text-white p-6">
              <h2 className="text-xl font-medium">{currentPoll.question}</h2>
            </div>

            <div className="p-6 space-y-3">
              {currentPoll.options.map((option, index) => (
                <div
                  key={index}
                  className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    selectedAnswer === option
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    dispatch(setSelectedAnswer(option))
                  }}
                >
                  <div
                    className={`w-8 h-8 rounded-full border-2 mr-4 flex items-center justify-center font-bold ${
                      selectedAnswer === option
                        ? "border-primary bg-primary text-white"
                        : "border-gray-400 bg-white text-gray-600"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="text-lg flex-1 text-gray-900">{option}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              onClick={submitAnswer}
              disabled={!selectedAnswer}
              className={`px-12 py-4 rounded-full text-lg font-medium transition-all ${
                selectedAnswer
                  ? "bg-primary hover:bg-primary-medium text-white shadow-lg hover:shadow-xl"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Submit
            </button>
          </div>
        </div>
        <ChatPopup isTeacher={false} />
      </div>
    )
  }

  // Results Screen
  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-4 mb-12">
          <h1 className="text-2xl font-bold text-gray-900">Question 1</h1>
          {currentPoll.isActive && (
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-500" />
              <span className="text-red-500 font-mono text-xl font-bold">{formatTime(timeRemaining)}</span>
            </div>
          )}
        </div>

        <div className="text-center">
          <div className="bg-white rounded-lg border shadow-sm max-w-2xl mx-auto mb-8">
            <div className="bg-gray-dark text-white p-4 rounded-t-lg">
              <h2 className="text-lg font-medium">{currentPoll.question}</h2>
            </div>

            <div className="p-6">
              <PollResults poll={currentPoll} />
            </div>
          </div>

          <p className="text-gray-900 text-lg font-medium">Wait for the teacher to ask a new question..</p>
        </div>
      </div>
      <ChatPopup isTeacher={false} />
    </div>
  )
}
