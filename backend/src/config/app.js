const express = require('express')
const cors = require('cors')
const routes = require('../routes')

const app = express()
// Cho phép nhiều origin: FE chạy port 3000, Vite mặc định 5173
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      // Không có origin (Postman/curl/mobile) hoặc nằm trong danh sách hoặc là localhost (dev mode) => cho qua
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin)) return callback(null, true)
      if (process.env.NODE_ENV !== 'production' && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
        return callback(null, true)
      }
      return callback(new Error(`CORS error: origin ${origin} không được phép`))
    },
    credentials: true,
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static('uploads'))
app.use('/api', routes)
module.exports = app
