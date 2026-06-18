const express = require('express')
const cors = require('cors')
const routes = require('../routes')

const app = express()

// Cho phép nhiều origin: FE chạy port 3000, Vite mặc định 5173, trang lễ tân, v.v.
// CLIENT_URL có thể là 1 hoặc nhiều URL, ngăn cách bằng dấu phẩy.
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      // Không có origin (Postman/curl/mobile/same-origin) hoặc nằm trong danh sách => cho qua
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
      return callback(new Error(`CORS: origin ${origin} không được phép`))
    },
    credentials: true,
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static('uploads'))
app.use('/api', routes)
module.exports = app
