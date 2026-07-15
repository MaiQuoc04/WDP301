// Chỉ giữ slice có người đọc: auth (state.auth) và admin (state.admin).
// Các module khác gọi thẳng services/ nên không cần slice.
import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../slices/authSlice'   // Sprint 0
import adminReducer from '../slices/adminSlice' // Sáng

export const store = configureStore({
  reducer: {
    auth: authReducer,
    admin: adminReducer,
  },
})
