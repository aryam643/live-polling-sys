"use client"
import { useState } from "react"
import Link from "next/link"

export default function HomePage() {
  const [selectedRole, setSelectedRole] = useState<"student" | "teacher" | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full animate-fade-in">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="bg-primary text-white px-6 py-3 rounded-full mb-8 inline-block shadow-lg hover:shadow-xl transition-shadow duration-300">
            🎯 Intervue Poll
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
            Welcome to the{" "}
            <span className="text-primary bg-gradient-to-r from-primary to-primary-medium bg-clip-text text-transparent">
              Live Polling System
            </span>
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            Please select the role that best describes you to begin using the live polling system
          </p>
        </div>

        {/* Role Selection */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div
            className={`cursor-pointer transition-all duration-300 border-2 rounded-xl p-6 hover:shadow-lg transform hover:-translate-y-1 ${
              selectedRole === "student"
                ? "border-primary bg-primary/5 shadow-lg scale-105"
                : "border-gray-200 hover:border-gray-300 bg-white"
            }`}
            onClick={() => setSelectedRole("student")}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-6 h-6 rounded-full border-2 mt-1 transition-all duration-200 ${
                  selectedRole === "student" ? "border-primary bg-primary shadow-sm" : "border-gray-300"
                }`}
              >
                {selectedRole === "student" && (
                  <div className="w-full h-full rounded-full bg-white scale-50 animate-fade-in"></div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-3 text-gray-900">I'm a Student</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Submit your answers and participate in live polls with real-time results
                </p>
              </div>
            </div>
          </div>

          <div
            className={`cursor-pointer transition-all duration-300 border-2 rounded-xl p-6 hover:shadow-lg transform hover:-translate-y-1 ${
              selectedRole === "teacher"
                ? "border-primary bg-primary/5 shadow-lg scale-105"
                : "border-gray-200 hover:border-gray-300 bg-white"
            }`}
            onClick={() => setSelectedRole("teacher")}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-6 h-6 rounded-full border-2 mt-1 transition-all duration-200 ${
                  selectedRole === "teacher" ? "border-primary bg-primary shadow-sm" : "border-gray-300"
                }`}
              >
                {selectedRole === "teacher" && (
                  <div className="w-full h-full rounded-full bg-white scale-50 animate-fade-in"></div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-3 text-gray-900">I'm a Teacher</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Create polls, manage students, and view live poll results in real-time
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <Link href={selectedRole === "student" ? "/student" : selectedRole === "teacher" ? "/teacher" : "#"}>
            <button
              className={`px-10 py-4 rounded-full text-lg font-medium transition-all duration-300 transform ${
                selectedRole
                  ? "bg-primary hover:bg-primary-medium text-white shadow-lg hover:shadow-xl hover:-translate-y-1 scale-105"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              disabled={!selectedRole}
            >
              Continue
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
