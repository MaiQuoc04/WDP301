// Owner: Quốc — đặt NHIỀU phòng cho cùng một nhóm khách (walk-in).
// Mỗi phòng vẫn là 1 Booking độc lập (vòng đời riêng: check-in/out, dọn phòng, huỷ lẻ);
// BookingGroup chỉ gom NHẬN DẠNG + TIỀN (1 mã, 1 lần cọc) cho cả nhóm. Tiền chi tiết vẫn nằm ở từng Booking.
const mongoose = require('mongoose')

const bookingGroupSchema = new mongoose.Schema({
  code:      { type: String, unique: true },
  branch:    { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  source:    { type: String, enum: ['online', 'walk_in'], default: 'walk_in' },
  customer:  { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }, // null nếu walk-in
  guestName: { type: String, trim: true },
  guestPhone:{ type: String, trim: true },
  checkIn:   { type: Date, required: true },
  checkOut:  { type: Date, required: true },
  // Tổng số khách KHAI BÁO của cả nhóm (= Σ allocation từng phòng). Dùng để đối chiếu.
  adultsTotal:   { type: Number, default: 1, min: 1 },
  childrenTotal: { type: Number, default: 0, min: 0 },
  roomCount:     { type: Number, default: 1, min: 1 },
  // Snapshot tiền lúc tạo (đơn vị VND). Hiển thị "1 hoá đơn"; chi tiết vẫn đọc từ member bookings.
  totalAmount:   { type: Number, default: 0 },
  depositAmount: { type: Number, default: 0 },
  expiresAt:     { type: Date },     // hạn thanh toán cọc (online); quá hạn -> job huỷ cả nhóm
  // Lễ tân đổi người dọn cho vài phòng trước khi trả nhóm: { bookingId -> accountId của housekeeper }.
  // Phải LƯU LẠI vì luồng QR trả phòng do webhook PayOS gọi checkOutGroup — webhook không biết gì
  // về lựa chọn trên màn hình, không lưu thì lễ tân đổi người xong khách quét QR là ghi đè mất sạch.
  cleaningAssignees: { type: Map, of: mongoose.Schema.Types.ObjectId, default: undefined },
  notes:     { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }, // lễ tân
}, { timestamps: true })

module.exports = mongoose.model('BookingGroup', bookingGroupSchema)
