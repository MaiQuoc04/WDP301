// Owner: Hoàng — giá theo KHOẢNG NGÀY (sự kiện/khuyến mãi/lễ). Ngày ngoài mọi khoảng -> RoomType.basePrice.
const mongoose = require('mongoose')

const roomPriceSchema = new mongoose.Schema({
  roomType:  { type: mongoose.Schema.Types.ObjectId, ref: 'RoomType', required: true },
  startDate: { type: Date },
  endDate:   { type: Date }, // ngày đêm cuối được áp (inclusive)
  dayType:   { type: String, enum: ['weekday', 'weekend', 'holiday'] }, // nhãn tuỳ chọn, chưa dùng khi tính giá
  price:     { type: Number }, // giá tuyệt đối; bỏ trống = dùng basePrice rồi áp discount
  discount:  { type: Number, default: 0 }, // % giảm áp lên price (hoặc basePrice nếu price trống)
  note:      { type: String, trim: true }, // vd "Khuyến mãi hè", "Lễ 30/4"
}, { timestamps: true })

roomPriceSchema.pre('validate', function validateRoomPriceTarget(next) {
  const hasRange = !!this.startDate && !!this.endDate
  if (!hasRange && !this.dayType) return next(new Error('RoomPrice cần startDate/endDate hoặc dayType'))
  if ((this.startDate && !this.endDate) || (!this.startDate && this.endDate)) {
    return next(new Error('RoomPrice cần đủ startDate và endDate'))
  }
  return next()
})

roomPriceSchema.index({ roomType: 1, startDate: 1, endDate: 1 })
module.exports = mongoose.model('RoomPrice', roomPriceSchema)
