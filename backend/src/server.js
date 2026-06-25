require('dotenv').config()
const http = require('http')
const app = require('./config/app')
const connectDB = require('./dbConnect')
const { startBookingExpiryJob } = require('./jobs/bookingExpiry')
const { initSocket } = require('./config/socket')

const PORT = process.env.PORT || 5000
const server = http.createServer(app)
initSocket(server)

connectDB().then(() => {
  server.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`))
  startBookingExpiryJob()
})
