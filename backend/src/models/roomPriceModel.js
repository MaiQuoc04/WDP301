// Owner: Hoàng — dynamic room pricing by date / weekday-weekend / holiday / discount
const mongoose = require('mongoose')

const roomPriceSchema = new mongoose.Schema({
  roomType: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomType', required: true },
  date:     { type: Date },
  dayType:  { type: String, enum: ['weekday', 'weekend', 'holiday'], default: 'weekday' },
  price:    { type: Number, required: true },
  discount: { type: Number, default: 0 }, // % giảm
}, { timestamps: true })

roomPriceSchema.index({ roomType: 1, date: 1 })
module.exports = mongoose.model('RoomPrice', roomPriceSchema)
