// Owner: Khánh — customer reviews & ratings, with staff replies (UC-22→25)
//
// Khách chấm CHI NHÁNH (không phải phòng, không phải loại phòng).
// `group` = 1 LẦN ĐI Ở (BookingGroup: 1 mã, 1 cọc, có thể gồm nhiều phòng). Nó đóng 2 vai:
//   1. Bằng chứng đã ở  -> không có nhóm hợp lệ thì không có gì để gắn review vào,
//      nên người chưa từng ở KHÔNG thể review (đây là ràng buộc dữ liệu, không phải check bề mặt).
//   2. Khoá chống trùng -> unique index bên dưới: 1 lần đi ở chỉ đẻ được 1 review.
//      Gắn vào Booking (từng phòng) thì nhóm 3 phòng đẻ 3 review cho cùng 1 kỳ nghỉ.
// Chi nhánh SUY RA từ nhóm, không cho khách tự chọn -> không thể chấm nơi mình chưa ở.
const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
  group:     { type: mongoose.Schema.Types.ObjectId, ref: 'BookingGroup', required: true },
  customer:  { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  branch:    { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true }, // chủ thể được chấm
  rating:    { type: Number, min: 1, max: 5, required: true },
  comment:   { type: String, trim: true },
  reactions: [{
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    type:    { type: String, enum: ['like', 'helpful'], default: 'like' },
  }],
  // Chưa dựng UI (nằm trong UC-22→25 của Khánh) — giữ field, không xoá phần việc đã chia.
  staffReply: {
    text:      { type: String },
    repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    repliedAt: { type: Date },
  },
  // Chưa dựng UI ẩn review. KHÔNG bỏ field: publicController.getHomeData đang lọc status:'active'.
  status: { type: String, enum: ['active', 'hidden'], default: 'active' },
}, { timestamps: true })

// 1 lần đi ở = 1 review. Ở tầng DB chứ không chỉ check trong service: 2 request gửi
// song song thì check-rồi-ghi vẫn lọt cả hai (race condition).
reviewSchema.index({ group: 1 }, { unique: true })
// Đọc review + tính điểm trung bình theo chi nhánh.
reviewSchema.index({ branch: 1, status: 1, createdAt: -1 })

module.exports = mongoose.model('Review', reviewSchema)
