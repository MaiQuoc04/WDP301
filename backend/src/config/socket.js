const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')

let io

exports.initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Adjust for production
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
  })

  // Auth OPTIONAL: có token hợp lệ -> gắn user để join room riêng; không có -> vẫn cho kết nối (broadcast cũ).
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token
    if (token) {
      try { socket.user = jwt.verify(token, process.env.JWT_SECRET) } catch { /* anonymous */ }
    }
    next()
  })

  io.on('connection', (socket) => {
    if (socket.user?.id) {
      socket.join(`user:${socket.user.id}`) // phòng riêng để bắn notification theo người
      console.log(`[Socket] Connected: ${socket.id} (user ${socket.user.id})`)
    } else {
      console.log(`[Socket] Connected: ${socket.id} (anonymous)`)
    }
    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`)
    })
  })

  return io
}

exports.getIO = () => {
  if (!io) throw new Error('Socket.io is not initialized!')
  return io
}

// Bắn realtime tới 1 người (nếu đang online). Không ném lỗi nếu socket chưa init.
exports.emitToUser = (userId, event, payload) => {
  if (!io || !userId) return
  io.to(`user:${userId}`).emit(event, payload)
}

// Bắn realtime "booking vừa thay đổi" (broadcast) để MỌI màn đang mở đúng booking đó tự cập nhật,
// không phải reload tay (vd: lễ tân đang checkout khi housekeeper vừa kiểm kê thiết bị). FE lọc theo bookingId.
exports.emitBookingUpdated = (bookingId) => {
  if (!io || !bookingId) return
  io.emit('booking_updated', { bookingId: String(bookingId) })
}

// Bắn realtime "chi nhánh khoá/mở" (broadcast) để khách đang đặt/xem đơn ở chi nhánh đó thấy cảnh báo NGAY. FE lọc theo branchId.
exports.emitBranchUpdated = (branchId, isActive) => {
  if (!io || !branchId) return
  io.emit('branch_updated', { branchId: String(branchId), isActive: !!isActive })
}
