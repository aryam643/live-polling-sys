import { configureStore } from "@reduxjs/toolkit"
import pollReducer from "./slices/pollSlice"
import studentReducer from "./slices/studentSlice"
import chatReducer from "./slices/chatSlice"

export const store = configureStore({
  reducer: {
    poll: pollReducer,
    student: studentReducer,
    chat: chatReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
