require('dotenv').config()
const app = require('./config/app')
const connectDB = require('./dbConnect')
const PORT = process.env.PORT || 5000
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`))
})
