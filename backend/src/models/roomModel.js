// Owner: Hoàng — physical room detail & status (UC-60→62)
const mongoose = require('mongoose')

const ROOM_STATUS = ['available', 'occupied', 'cleaning', 'maintenance', 'locked']

const roomSchema = new mongoose.Schema({
  branch:     { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  roomType:   { type: mongoose.Schema.Types.ObjectId, ref: 'RoomType', required: true },
  roomNumber: { type: String, required: true, trim: true },
  floor:      { type: Number },
  status:     { type: String, enum: ROOM_STATUS, default: 'available' },
  // Soft delete — không xóa vật lý để giữ nguyên reference với Booking (BR-UC60)
  isDeleted:  { type: Boolean, default: false, index: true },
  notes:      { type: String, trim: true },
  bookingSeq: { type: Number, default: 0 }, // Quốc — token serialize chống đặt trùng theo PHÒNG (nội bộ)
  // Quốc — phòng đã dọn xong nhưng thiếu đồ, chờ manager bổ sung đủ chuẩn mới available (Đợt 4)
  awaitingRestock: { type: Boolean, default: false },
}, { timestamps: true })

roomSchema.index(
  { branch: 1, roomNumber: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
)
roomSchema.statics.ROOM_STATUS = ROOM_STATUS
module.exports = mongoose.model('Room', roomSchema)
