// Owner: Quốc — booking lifecycle (UC-17/29 create, UC-30→43 vận hành)
// ⚠️ HỢP ĐỒNG LIÊN-MODULE: enum BOOKING_STATUS dưới đây là nguồn sự thật cho cả nhóm.
//    Mọi lần đặt (online lẫn walk-in) đều đi qua BookingGroup: createGroupOnline / createGroup.
//    Không còn đường tạo booking lẻ — Tú ghi vào `missingAmenities`.
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
const PAYMENT_PROGRESS = ['unpaid', 'partial', 'paid'] // BR-33

const bookingSchema = new mongoose.Schema({
  code:      { type: String, unique: true },
  // Nhóm đặt nhiều phòng (cùng khách). null = booking đơn lẻ (đường cũ giữ nguyên). docs đặt nhiều phòng.
  group:     { type: mongoose.Schema.Types.ObjectId, ref: 'BookingGroup' },
  branch:    { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  roomType:  { type: mongoose.Schema.Types.ObjectId, ref: 'RoomType', required: true },
  room:      { type: mongoose.Schema.Types.ObjectId, ref: 'Room' }, // gán khi check-in
  customer:  { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }, // null nếu walk-in
  guestName: { type: String, trim: true },
  guestPhone:{ type: String, trim: true },
  checkIn:   { type: Date, required: true },
  checkOut:  { type: Date, required: true },
  guests:    { type: Number, default: 1 },   // tổng = adults + children
  adults:    { type: Number, default: 1, min: 1 },
  children:  { type: Number, default: 0, min: 0 },
  source:    { type: String, enum: ['online', 'walk_in'], default: 'online' },
  status:        { type: String, enum: BOOKING_STATUS, default: 'pending' },
  paymentStatus: { type: String, enum: PAYMENT_PROGRESS, default: 'unpaid' }, // BR-33

  // Tiền (đơn vị VND) — bill tổng hợp realtime
  roomCharge:            { type: Number, default: 0 },
  depositAmount:         { type: Number, default: 0 },
  extraServicesTotal:    { type: Number, default: 0 },
  missingAmenitiesTotal: { type: Number, default: 0 },
  bedSurcharge:          { type: Number, default: 0 },      // phụ phí giường phụ (ước tính, theo §9.7)
  bedSurchargeApplied:   { type: Boolean, default: false }, // đã cộng vào bill chưa (tự áp khi check-in)

  // ── Đổi phòng giữa kỳ (UC-37) — kế toán theo CHẶNG ─────────────────────
  // Mỗi lần đổi phòng cắt 1 mốc: tiền các chặng ĐÃ QUA khoá vào ...Locked (bất biến),
  // còn roomCharge/bedSurcharge chỉ tính cho CHẶNG HIỆN TẠI [roomSegmentStart → checkOut].
  // Mặc định: chưa đổi phòng -> Locked=0, segmentStart=checkIn -> bill y hệt trước, không đổi số.
  roomChargeLocked:      { type: Number, default: 0 },      // Σ tiền phòng các chặng đã qua
  bedSurchargeLocked:    { type: Number, default: 0 },      // Σ phụ phí giường phụ các chặng đã qua
  roomSegmentStart:      { type: Date },                    // mốc bắt đầu chặng hiện tại (null = checkIn)
  // Phòng bị ĐỔI ĐI (không phải trả phòng thật): status='checked_out' nhưng đây là 1 chặng đã kết
  // thúc do đổi phòng. TIỀN vẫn tính (đêm đã ngủ đã khoá), nhưng KHÔNG đếm là phòng đang ở / không
  // gây "hỗn hợp" ở rollup — chỉ hiện riêng để lễ tân biết booking nào đã đổi.
  transferredOut:        { type: Boolean, default: false },
  transferredAt:         { type: Date },
  // Phí giờ: nhận sớm / trả muộn — 10% giá đêm/giờ; trả muộn quá 18:00 -> tính 1 đêm (lateFullNight)
  earlyHours:            { type: Number, default: 0 },
  lateHours:             { type: Number, default: 0 },
  lateFullNight:         { type: Boolean, default: false },
  extraHourFee:          { type: Number, default: 0 },
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
    // Theo dõi triển khai tại phòng (UI bảng dịch vụ) — KHÔNG ảnh hưởng bill
    status:      { type: String, enum: ['pending', 'delivered'], default: 'pending' },
    deliveredAt: { type: Date },
    deliveredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  }],

  // Amenity thiếu (UC-33/50) — Tú ghi, phản ánh vào bill
  missingAmenities: [{
    amenity:  { type: mongoose.Schema.Types.ObjectId, ref: 'Amenity' },
    name:     String,
    price:    Number,
    quantity: { type: Number, default: 1 },
  }],

  creditApplied: { type: Number, default: 0 },     // credit từ booking trước áp lúc checkout (BR-34)
  cancelReason:  { type: String, trim: true },     // vd 'payment_timeout' khi quá hạn cọc
  expiresAt:     { type: Date },                    // hạn thanh toán cọc (online); quá hạn -> job tự huỷ
  notes:     { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }, // lễ tân (walk-in)
}, { timestamps: true })

bookingSchema.statics.BOOKING_STATUS = BOOKING_STATUS
bookingSchema.statics.PAYMENT_PROGRESS = PAYMENT_PROGRESS
module.exports = mongoose.model('Booking', bookingSchema)
