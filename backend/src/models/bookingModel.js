// Owner: Quốc — booking lifecycle (UC-17/29 create, UC-30→43 vận hành)
// ⚠️ HỢP ĐỒNG LIÊN-MODULE: enum BOOKING_STATUS dưới đây là nguồn sự thật cho cả nhóm.
//    Khánh tạo booking online qua bookingService.create(); Tú ghi vào `missingAmenities`.
const mongoose = require('mongoose')

const BOOKING_STATUS = [
  'pending',      // mới tạo, chờ thanh toán cọc / chờ xác nhận
  'confirmed',    // đã cọc / đã xác nhận
  'checked_in',   // khách đã nhận phòng
  'checked_out',  // khách đã trả phòng (chờ chốt bill)
  'completed',    // hoàn tất
  'cancelled',    // huỷ trước check-in
  'no_show',      // khách không đến, giữ cọc
]

const bookingSchema = new mongoose.Schema({
  code:      { type: String, unique: true },
  branch:    { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  roomType:  { type: mongoose.Schema.Types.ObjectId, ref: 'RoomType', required: true },
  room:      { type: mongoose.Schema.Types.ObjectId, ref: 'Room' }, // gán khi check-in
  customer:  { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }, // null nếu walk-in
  guestName: { type: String, trim: true },
  guestPhone:{ type: String, trim: true },
  checkIn:   { type: Date, required: true },
  checkOut:  { type: Date, required: true },
  guests:    { type: Number, default: 1 },
  source:    { type: String, enum: ['online', 'walk_in'], default: 'online' },
  status:    { type: String, enum: BOOKING_STATUS, default: 'pending' },

  // Tiền (đơn vị VND) — bill tổng hợp realtime
  roomCharge:            { type: Number, default: 0 },
  depositAmount:         { type: Number, default: 0 },
  extraServicesTotal:    { type: Number, default: 0 },
  missingAmenitiesTotal: { type: Number, default: 0 },
  totalAmount:           { type: Number, default: 0 },
  paidAmount:            { type: Number, default: 0 },
  remainingAmount:       { type: Number, default: 0 },

  // Extra service do lễ tân thêm (UC-32)
  services: [{
    service:  { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    name:     String,
    price:    Number,
    quantity: { type: Number, default: 1 },
    addedAt:  { type: Date, default: Date.now },
  }],

  // Amenity thiếu (UC-33/50) — Tú ghi, phản ánh vào bill
  missingAmenities: [{
    amenity:  { type: mongoose.Schema.Types.ObjectId, ref: 'Amenity' },
    name:     String,
    price:    Number,
    quantity: { type: Number, default: 1 },
  }],

  notes:     { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }, // lễ tân (walk-in)
}, { timestamps: true })

bookingSchema.statics.BOOKING_STATUS = BOOKING_STATUS
module.exports = mongoose.model('Booking', bookingSchema)
