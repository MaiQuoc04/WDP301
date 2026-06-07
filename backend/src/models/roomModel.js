// Owner: Hoàng — physical room detail & status (UC-60→62)
const mongoose = require('mongoose')

const ROOM_STATUS = ['available', 'occupied', 'cleaning', 'maintenance']

const roomSchema = new mongoose.Schema({
  branch:     { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  roomType:   { type: mongoose.Schema.Types.ObjectId, ref: 'RoomType', required: true },
  roomNumber: { type: String, required: true, trim: true },
  floor:      { type: Number },
  status:     { type: String, enum: ROOM_STATUS, default: 'available' },
}, { timestamps: true })

roomSchema.index({ branch: 1, roomNumber: 1 }, { unique: true })
roomSchema.statics.ROOM_STATUS = ROOM_STATUS
module.exports = mongoose.model('Room', roomSchema)
