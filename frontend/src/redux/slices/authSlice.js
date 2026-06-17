import { createSlice } from '@reduxjs/toolkit'

// Khởi tạo từ localStorage để giữ đăng nhập sau khi refresh (axiosInstance đọc 'token')
const token = localStorage.getItem('token') || null
const user = JSON.parse(localStorage.getItem('user') || 'null')

const authSlice = createSlice({
  name: 'auth',
  initialState: { user, token },
  reducers: {
    setCredentials: (state, { payload }) => {
      state.user = payload.user
      state.token = payload.token
      localStorage.setItem('token', payload.token)
      localStorage.setItem('user', JSON.stringify(payload.user))
    },
    logout: (state) => {
      state.user = null
      state.token = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
  },
})

export const { setCredentials, logout } = authSlice.actions
export default authSlice.reducer
