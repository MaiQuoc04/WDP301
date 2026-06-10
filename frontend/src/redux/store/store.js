// Sprint 0 — PRE-WIRED. Không sửa sau Sprint 0; mỗi người làm trong slice của mình.
import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../slices/authSlice'         // Sprint 0
import customerReducer from '../slices/customerSlice'  // Khánh
import bookingReducer from '../slices/bookingSlice'    // Quốc
import taskReducer from '../slices/taskSlice'          // Tú
import roomReducer from '../slices/roomSlice'          // Hoàng
import adminReducer from '../slices/adminSlice'        // Sáng

export const store = configureStore({
  reducer: {
    auth: authReducer,
    customer: customerReducer,
    booking: bookingReducer,
    task: taskReducer,
    room: roomReducer,
    admin: adminReducer,
  },
})
