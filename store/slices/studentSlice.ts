import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface Student {
  id: string
  name: string
  hasAnswered: boolean
  isOnline: boolean
  joinedAt: string
}

interface StudentState {
  students: Student[]
  currentStudent: { name: string; hasAnswered: boolean } | null
  selectedAnswer: string
}

const initialState: StudentState = {
  students: [],
  currentStudent: null,
  selectedAnswer: "",
}

const studentSlice = createSlice({
  name: "student",
  initialState,
  reducers: {
    setStudents: (state, action: PayloadAction<Student[]>) => {
      state.students = action.payload
    },
    addStudent: (state, action: PayloadAction<Student>) => {
      const existingIndex = state.students.findIndex((s) => s.id === action.payload.id)
      if (existingIndex >= 0) {
        state.students[existingIndex] = action.payload
      } else {
        state.students.push(action.payload)
      }
    },
    removeStudent: (state, action: PayloadAction<string>) => {
      state.students = state.students.filter((s) => s.id !== action.payload)
    },
    updateStudentAnswer: (state, action: PayloadAction<{ studentId: string; answer: string }>) => {
      const { studentId } = action.payload
      const student = state.students.find((s) => s.id === studentId)
      if (student) {
        student.hasAnswered = true
      }
    },
    setCurrentStudent: (state, action: PayloadAction<{ name: string; hasAnswered: boolean } | null>) => {
      state.currentStudent = action.payload
    },
    setSelectedAnswer: (state, action: PayloadAction<string>) => {
      state.selectedAnswer = action.payload
    },
    resetStudentAnswers: (state) => {
      state.students.forEach((student) => {
        student.hasAnswered = false
      })
      if (state.currentStudent) {
        state.currentStudent.hasAnswered = false
      }
      state.selectedAnswer = ""
    },
  },
})

export const {
  setStudents,
  addStudent,
  removeStudent,
  updateStudentAnswer,
  setCurrentStudent,
  setSelectedAnswer,
  resetStudentAnswers,
} = studentSlice.actions

export default studentSlice.reducer
