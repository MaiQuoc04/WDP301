require('dotenv').config()
const app = require('./config/app')
const connectDB = require('./dbConnect')
const { startBookingExpiryJob } = require('./jobs/bookingExpiry')
const PORT = process.env.PORT || 5000
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`))
  startBookingExpiryJob()
})
