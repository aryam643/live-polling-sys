import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

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

interface PollState {
  currentPoll: Poll | null
  pollHistory: Poll[]
  timeRemaining: number
}

const initialState: PollState = {
  currentPoll: null,
  pollHistory: [],
  timeRemaining: 0,
}

const pollSlice = createSlice({
  name: "poll",
  initialState,
  reducers: {
    setCurrentPoll: (state, action: PayloadAction<Poll>) => {
      state.currentPoll = action.payload
      state.timeRemaining = action.payload.timeLimit
    },
    updatePollResults: (state, action: PayloadAction<{ answer: string }>) => {
      if (state.currentPoll) {
        const { answer } = action.payload
        state.currentPoll.results[answer] = (state.currentPoll.results[answer] || 0) + 1
        state.currentPoll.totalVotes += 1
      }
    },
    updateTimeRemaining: (state, action: PayloadAction<number>) => {
      state.timeRemaining = action.payload
    },
    endPoll: (state) => {
      if (state.currentPoll) {
        state.currentPoll.isActive = false
        state.pollHistory.unshift({ ...state.currentPoll })
      }
    },
    setPollHistory: (state, action: PayloadAction<Poll[]>) => {
      state.pollHistory = action.payload
    },
    clearCurrentPoll: (state) => {
      state.currentPoll = null
      state.timeRemaining = 0
    },
  },
})

export const { setCurrentPoll, updatePollResults, updateTimeRemaining, endPoll, setPollHistory, clearCurrentPoll } =
  pollSlice.actions

export default pollSlice.reducer
