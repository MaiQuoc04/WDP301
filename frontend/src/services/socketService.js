import { io } from 'socket.io-client'

// Socket nối tới GỐC server (không /api). Suy từ VITE_API_BASE_URL (vd http://localhost:9999/api).
const RAW = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:9999/api'
const URL = RAW.replace(/\/api\/?$/, '')

export const socket = io(URL, {
  autoConnect: false, // tự connect ở component cần
})

export const connectSocket = () => {
  // Backend đọc handshake.auth.token để join room user:<id> (auth optional)
  socket.auth = { token: localStorage.getItem('token') }
  if (!socket.connected) socket.connect()
}

export const disconnectSocket = () => {
  if (socket.connected) socket.disconnect()
}
