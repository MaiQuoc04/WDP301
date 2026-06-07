// Owner: Quốc — tạm giữ phòng khi khách chưa thanh toán xong (UC-17/18)
// expiresAt dùng TTL index để Mongo tự xoá khi hết hạn giữ phòng.
const mongoose = require('mongoose')

const holdRoomSchema = new mongoose.Schema({
  roomType:  { type: mongoose.Schema.Types.ObjectId, ref: 'RoomType', required: true },
  room:      { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  customer:  { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  booking:   { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  checkIn:   { type: Date, required: true },
  checkOut:  { type: Date, required: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true })

holdRoomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
module.exports = mongoose.model('HoldRoom', holdRoomSchema)
