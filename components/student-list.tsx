"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, UserX, User } from "lucide-react"

interface Student {
  id: string
  name: string
  hasAnswered: boolean
  isOnline: boolean
  joinedAt?: string
}

interface StudentListProps {
  students: Student[]
  onKickStudent?: (studentId: string) => void
  showKickButton?: boolean
  detailed?: boolean
}

export function StudentList({ students, onKickStudent, showKickButton = false, detailed = false }: StudentListProps) {
  if (students.length === 0) {
    return (
      <div className="text-center py-8">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No students joined yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {students.map((student) => (
        <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${student.isOnline ? "bg-green-500" : "bg-gray-400"}`} />
            <div>
              <span className="font-medium text-gray-900">{student.name}</span>
              {detailed && student.joinedAt && (
                <p className="text-sm text-gray-500">Joined: {new Date(student.joinedAt).toLocaleTimeString()}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {student.hasAnswered ? (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Answered
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Waiting
              </Badge>
            )}
            {showKickButton && onKickStudent && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onKickStudent(student.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <UserX className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
