const { Server } = require('socket.io')

let io

exports.initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Adjust for production
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
  })

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`)

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`)
    })
  })

  return io
}

exports.getIO = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized!')
  }
  return io
}
