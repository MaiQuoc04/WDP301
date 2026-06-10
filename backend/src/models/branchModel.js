// Owner: Sáng — branch detail (UC-71→73)
const mongoose = require('mongoose')

const branchSchema = new mongoose.Schema({
  code:                 { type: String, required: true, unique: true, trim: true },
  name:                 { type: String, required: true, trim: true },
  location:             { type: String, trim: true },
  hotline:              { type: String, trim: true },
  depositRate:          { type: Number, default: 0.3, min: 0, max: 1 }, // tỉ lệ cọc
  pendingTimeoutMinutes:{ type: Number, default: 15 },                  // hết hạn giữ phòng
  images:               [{ type: String }],
  isActive:             { type: Boolean, default: true },
}, { timestamps: true })

module.exports = mongoose.model('Branch', branchSchema)
