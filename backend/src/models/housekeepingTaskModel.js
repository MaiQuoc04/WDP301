// Owner: Tú — room cleaning & inspection tasks (UC-44→55). Status theo docs/STATUS_WORKFLOW_SPEC.md §7.
// ⚠️ HỢP ĐỒNG: housekeepingService.createOnCheckIn(bookingId, roomId) do Tú cung cấp, Quốc gọi khi check-in.
//    Amenity thiếu ghi ngược vào Booking (Quốc định nghĩa). Giao việc qua assignedTo (null = chưa nhận - BR-38).
const mongoose = require('mongoose')

const TASK_STATUS = ['pending', 'in_progress', 'urgent', 'completed', 'missed']
// Loại việc: inspection = kiểm tra thiết bị trước trả phòng (cộng bill); turnover = dọn sau check-out
// (đưa phòng về sẵn sàng); mid_stay = khách đang ở yêu cầu dọn (miễn phí, không kiểm kê, không đổi phòng).
const TASK_TYPE = ['inspection', 'turnover', 'mid_stay']

const housekeepingTaskSchema = new mongoose.Schema({
  branch:     { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  room:       { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  booking:    { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  type:       { type: String, enum: TASK_TYPE, default: 'inspection' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }, // null = chưa ai claim
  assignedAt: { type: Date },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }, // lễ tân yêu cầu (inspection/mid_stay)
  requestedAt: { type: Date },
  status:     { type: String, enum: TASK_STATUS, default: 'pending' },
  isUrgent:   { type: Boolean, default: false },
  // Escalation tự nhận (Quốc): 2p chưa ai nhận -> nhắc HK (remindedAt); 5p -> báo manager + khoá tự nhận (escalatedAt)
  remindedAt:   { type: Date },
  escalatedAt:  { type: Date },


  // Báo cáo kiểm kê amenity (UC-49→51, BR-41/42)
  amenityReport: [{
    amenity:   { type: mongoose.Schema.Types.ObjectId, ref: 'Amenity' },
    name:      String,
    expected:  Number,
    actual:    Number,
    missing:   Number,
    condition: { type: String, enum: ['active', 'broken', 'missing'], default: 'active' },
    note:      { type: String, trim: true },
    chargedAt: Date,
  }],
  amenityChecked: { type: Boolean, default: false }, // HK đã submit kiểm tra thiết bị chưa
  issueNote:      { type: String, trim: true },      // báo sự cố phòng (UC-52)

  startedAt:   { type: Date },
  completedAt: { type: Date },
}, { timestamps: true })

housekeepingTaskSchema.statics.TASK_STATUS = TASK_STATUS
housekeepingTaskSchema.statics.TASK_TYPE = TASK_TYPE
module.exports = mongoose.model('HousekeepingTask', housekeepingTaskSchema)
