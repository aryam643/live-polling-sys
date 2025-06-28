import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface ChatMessage {
  id: string
  sender: string
  message: string
  timestamp: string
  isTeacher: boolean
}

interface ChatState {
  messages: ChatMessage[]
  isOpen: boolean
  unreadCount: number
}

const initialState: ChatState = {
  messages: [],
  isOpen: false,
  unreadCount: 0,
}

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload)
      if (!state.isOpen) {
        state.unreadCount += 1
      }
    },
    setMessages: (state, action: PayloadAction<ChatMessage[]>) => {
      state.messages = action.payload
    },
    toggleChat: (state) => {
      state.isOpen = !state.isOpen
      if (state.isOpen) {
        state.unreadCount = 0
      }
    },
    clearUnreadCount: (state) => {
      state.unreadCount = 0
    },
  },
})

export const { addMessage, setMessages, toggleChat, clearUnreadCount } = chatSlice.actions

export default chatSlice.reducer
