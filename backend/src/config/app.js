const express = require('express')
const cors = require('cors')
const routes = require('../routes')

const app = express()
const allowedOrigins = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : []

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true)
    // Allow any localhost port in development
    if (process.env.NODE_ENV !== 'production' && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
      return callback(null, true)
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    return callback(new Error('CORS error: Origin not allowed'), false)
  },
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static('uploads'))
app.use('/api', routes)
module.exports = app
