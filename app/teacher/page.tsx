"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useSocket } from "@/hooks/use-socket"
import { PollResults } from "@/components/poll-results"
import { ChatPopup } from "@/components/chat-popup"
import type { RootState } from "@/store/store"
import {
  setCurrentPoll,
  updatePollResults,
  updateTimeRemaining,
  endPoll,
  clearCurrentPoll,
} from "@/store/slices/pollSlice"
import {
  setStudents,
  addStudent,
  removeStudent,
  resetStudentAnswers,
  updateStudentAnswer,
} from "@/store/slices/studentSlice"

interface Poll {
  id: string
  question: string
  options: string[]
  isActive: boolean
  timeLimit: number
  results: Record<string, number>
  totalVotes: number
  createdAt: string
}

interface Student {
  id: string
  name: string
  hasAnswered: boolean
  isOnline: boolean
  joinedAt: string
}

export default function TeacherPage() {
  const dispatch = useDispatch()
  const { currentPoll, timeRemaining } = useSelector((state: RootState) => state.poll)
  const { students } = useSelector((state: RootState) => state.student)

  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState(["", ""])
  const [timeLimit, setTimeLimit] = useState(60)
  const [correctAnswers, setCorrectAnswers] = useState<Record<number, boolean>>({})

  const [showHistory, setShowHistory] = useState(false)
  const [pollHistory, setPollHistory] = useState<Poll[]>([])

  const socket = useSocket()

  useEffect(() => {
    if (!socket) return

    socket.on("student-joined", (student: Student) => {
      dispatch(addStudent(student))
    })

    socket.on("student-left", (studentId: string) => {
      dispatch(removeStudent(studentId))
    })

    socket.on("students-list", (studentsList: Student[]) => {
      dispatch(setStudents(studentsList))
    })

    socket.on("poll-answer", ({ studentId, answer }: { studentId: string; answer: string }) => {
      dispatch(updateStudentAnswer({ studentId, answer }))
      dispatch(updatePollResults({ answer }))
    })

    socket.on("poll-time-update", (time: number) => {
      dispatch(updateTimeRemaining(time))
    })

    socket.on("poll-ended", () => {
      dispatch(endPoll())
      dispatch(resetStudentAnswers())
    })

    socket.on("poll-history", (history: Poll[]) => {
      setPollHistory(history)
    })

    return () => {
      socket.off("student-joined")
      socket.off("student-left")
      socket.off("students-list")
      socket.off("poll-answer")
      socket.off("poll-time-update")
      socket.off("poll-ended")
      socket.off("poll-history")
    }
  }, [socket, dispatch])

  const createPoll = () => {
    if (!question.trim() || options.filter((opt) => opt.trim()).length < 2) {
      alert("Please provide a question and at least 2 options")
      return
    }

    const validOptions = options.filter((opt) => opt.trim())
    const poll: Poll = {
      id: Date.now().toString(),
      question: question.trim(),
      options: validOptions,
      isActive: true,
      timeLimit,
      results: {},
      totalVotes: 0,
      createdAt: new Date().toISOString(),
    }

    dispatch(setCurrentPoll(poll))
    dispatch(resetStudentAnswers())

    if (socket) {
      socket.emit("create-poll", poll)
    }

    setQuestion("")
    setOptions(["", ""])
    setCorrectAnswers({})
  }

  const addOption = () => {
    setOptions([...options, ""])
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const setCorrectAnswer = (index: number, isCorrect: boolean) => {
    setCorrectAnswers((prev) => ({
      ...prev,
      [index]: isCorrect,
    }))
  }

  const kickStudent = (studentId: string) => {
    if (socket) {
      socket.emit("kick-student", studentId)
    }
  }

  const viewPollHistory = () => {
    if (socket) {
      socket.emit("get-poll-history")
    }
    setShowHistory(true)
  }

  const askNewQuestion = () => {
    dispatch(clearCurrentPoll())
    if (socket) {
      socket.emit("clear-poll")
    }
  }

  const isFormDisabled = currentPoll !== null && currentPoll.isActive === true

  // Results View - Show after poll is created
  if (currentPoll) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-4">
        <div className="max-w-4xl mx-auto animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Question Results</h1>

            <div className="bg-white rounded-xl shadow-lg max-w-2xl mx-auto overflow-hidden">
              <div className="bg-gray-dark text-white p-6">
                <h2 className="text-xl font-medium">{currentPoll.question}</h2>
                {currentPoll.isActive && (
                  <div className="mt-3 text-primary-light">
                    ⏰ Time remaining: {Math.floor(timeRemaining / 60)}:
                    {(timeRemaining % 60).toString().padStart(2, "0")}
                  </div>
                )}
              </div>

              <div className="p-6">
                <PollResults poll={currentPoll} />
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={askNewQuestion}
                className="bg-primary hover:bg-primary-medium text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
              >
                + Ask a new question
              </button>
            </div>

            <div className="mt-4">
              <button
                onClick={viewPollHistory}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-full text-lg font-medium transition-all duration-300"
              >
                View Poll History
              </button>
            </div>
          </div>

          <ChatPopup isTeacher students={students} onKickStudent={kickStudent} />
        </div>

        {showHistory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Poll History</h2>
                  <button onClick={() => setShowHistory(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                    ×
                  </button>
                </div>
              </div>
              <div className="p-6">
                {pollHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Poll History</h3>
                    <p className="text-gray-600">Create your first poll to see results here</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {pollHistory.map((poll, index) => (
                      <div key={poll.id} className="bg-white border rounded-lg overflow-hidden">
                        <div className="bg-gray-dark text-white p-4">
                          <h3 className="text-lg font-medium">Question {index + 1}</h3>
                          <p className="text-sm opacity-90">{poll.question}</p>
                        </div>
                        <div className="p-6">
                          <PollResults poll={poll} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Poll Creation View - Matching the design from the image
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="bg-primary text-white px-4 py-2 rounded-full mb-6 inline-flex items-center gap-2 text-sm font-medium">
                ✨ Intervue Poll
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Let's Get Started</h1>
              <p className="text-gray-600 text-lg">
                You'll have the ability to create and manage polls, ask questions, and monitor your students' responses
                in real-time.
              </p>
            </div>
            <div>
              <button
                onClick={viewPollHistory}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
              >
                View Poll History
              </button>
            </div>
          </div>
        </div>

        {/* Question Input and Time Limit Row */}
        <div className="flex items-start gap-6 mb-8">
          <div className="flex-1">
            <label className="block text-lg font-semibold text-gray-900 mb-4">Enter your question</label>
            <div className="relative">
              <textarea
                placeholder="What is the capital of France?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={isFormDisabled}
                className="w-full h-32 p-4 bg-gray-100 border-0 rounded-lg resize-none text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
              />
              <div className="absolute bottom-3 right-3 text-sm text-gray-400">{question.length}/100</div>
            </div>
          </div>

          <div className="flex-shrink-0">
            <select
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
              disabled={isFormDisabled}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <option value={30}>30 seconds</option>
              <option value={60}>60 seconds</option>
              <option value={90}>90 seconds</option>
              <option value={120}>120 seconds</option>
            </select>
          </div>
        </div>

        {/* Options Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Edit Options</h2>
            <h3 className="text-lg font-semibold text-gray-900">Is it Correct?</h3>
          </div>

          <div className="space-y-4">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </div>
                  <input
                    type="text"
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    disabled={isFormDisabled}
                    className="flex-1 p-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        correctAnswers[index] === true
                          ? "border-primary bg-primary"
                          : "border-gray-300 bg-white hover:border-primary"
                      }`}
                    >
                      {correctAnswers[index] === true && <div className="w-3 h-3 bg-white rounded-full"></div>}
                    </div>
                    <input
                      type="radio"
                      name={`correct-${index}`}
                      checked={correctAnswers[index] === true}
                      onChange={() => setCorrectAnswer(index, true)}
                      className="sr-only"
                      disabled={isFormDisabled}
                    />
                    <span className="text-gray-700 font-medium">Yes</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        correctAnswers[index] === false
                          ? "border-gray-400 bg-gray-400"
                          : "border-gray-300 bg-white hover:border-gray-400"
                      }`}
                    >
                      {correctAnswers[index] === false && <div className="w-3 h-3 bg-white rounded-full"></div>}
                    </div>
                    <input
                      type="radio"
                      name={`correct-${index}`}
                      checked={correctAnswers[index] === false}
                      onChange={() => setCorrectAnswer(index, false)}
                      className="sr-only"
                      disabled={isFormDisabled}
                    />
                    <span className="text-gray-700 font-medium">No</span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addOption}
            disabled={isFormDisabled}
            className="mt-6 px-4 py-2 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            + Add More option
          </button>
        </div>

        {/* Ask Question Button */}
        <div className="flex justify-end">
          <button
            onClick={createPoll}
            disabled={isFormDisabled}
            className={`px-8 py-3 rounded-full text-lg font-medium transition-all duration-300 ${
              !isFormDisabled
                ? "bg-primary hover:bg-primary-medium text-white shadow-lg hover:shadow-xl"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Ask Question
          </button>
        </div>

        <ChatPopup isTeacher students={students} onKickStudent={kickStudent} />
      </div>

      {/* Poll History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Poll History</h2>
                <button onClick={() => setShowHistory(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              {pollHistory.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Poll History</h3>
                  <p className="text-gray-600">Create your first poll to see results here</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {pollHistory.map((poll, index) => (
                    <div key={poll.id} className="bg-white border rounded-lg overflow-hidden">
                      <div className="bg-gray-dark text-white p-4">
                        <h3 className="text-lg font-medium">Question {index + 1}</h3>
                        <p className="text-sm opacity-90">{poll.question}</p>
                      </div>
                      <div className="p-6">
                        <PollResults poll={poll} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
