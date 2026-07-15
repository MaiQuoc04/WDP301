// Owner: Quốc — payment records of a booking (UC-18/21/31). Enum theo docs/STATUS_WORKFLOW_SPEC.md §5.
const mongoose = require('mongoose')

const PAYMENT_STATUS = ['pending', 'paid', 'failed', 'expired']

const paymentSchema = new mongoose.Schema({
  booking:         { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  // Khi thu GOM cho nhóm nhiều phòng: payment gắn group + booking đại diện (phòng đầu) để ledger cũ vẫn chạy.
  group:           { type: mongoose.Schema.Types.ObjectId, ref: 'BookingGroup' },
  type:            { type: String, enum: ['deposit', 'remaining'], required: true },
  method:          { type: String, enum: ['online_qr', 'cash', 'bank_transfer'], default: 'online_qr' },
  amount:          { type: Number, required: true },
  status:          { type: String, enum: PAYMENT_STATUS, default: 'pending' },
  transactionRef:  { type: String }, // mã gửi kèm khi tạo link, dùng match webhook
  transactionCode: { type: String }, // mã giao dịch ngân hàng nhận từ webhook
  paidAt:          { type: Date },
  expiredAt:       { type: Date },    // hạn link QR online (= hạn giữ chỗ; xem payosService.payWindowEnd)
  // Lưu lại QR để lần bấm "Thanh toán" sau TRẢ VỀ CHÍNH NÓ, không đẻ đơn PayOS mới.
  // Nhiều đơn cùng sống = khách có thể quét trúng 2 cái -> trả tiền 2 lần mà chỉ nhận 1 booking.
  qrCode:          { type: String },
  checkoutUrl:     { type: String },
  confirmedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }, // lễ tân xác nhận (remaining)
}, { timestamps: true })

paymentSchema.statics.PAYMENT_STATUS = PAYMENT_STATUS
module.exports = mongoose.model('Payment', paymentSchema)
