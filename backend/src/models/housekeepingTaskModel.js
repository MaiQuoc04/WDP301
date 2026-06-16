// Owner: Tú — room cleaning & inspection tasks (UC-44→55). Status theo docs/STATUS_WORKFLOW_SPEC.md §7.
// ⚠️ HỢP ĐỒNG: housekeepingService.createOnCheckIn(bookingId, roomId) do Tú cung cấp, Quốc gọi khi check-in.
//    Amenity thiếu ghi ngược vào Booking (Quốc định nghĩa). Giao việc qua assignedTo (null = chưa nhận - BR-38).
const mongoose = require('mongoose')

const TASK_STATUS = ['pending', 'in_progress', 'completed', 'missed']

const housekeepingTaskSchema = new mongoose.Schema({
  branch:     { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  room:       { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  booking:    { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }, // null = chưa ai claim
  assignedAt: { type: Date },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  status:     { type: String, enum: TASK_STATUS, default: 'pending' },
  isUrgent:   { type: Boolean, default: false },


  // Báo cáo kiểm kê amenity (UC-49→51, BR-41/42)
  amenityReport: [{
    amenity:   { type: mongoose.Schema.Types.ObjectId, ref: 'Amenity' },
    name:      String,
    expected:  Number,
    actual:    Number,
    missing:   Number,
    condition: { type: String, enum: ['active', 'broken', 'missing'], default: 'active' },
  }],
  amenityChecked: { type: Boolean, default: false }, // HK đã submit kiểm tra thiết bị chưa
  issueNote:      { type: String, trim: true },      // báo sự cố phòng (UC-52)

  startedAt:   { type: Date },
  completedAt: { type: Date },
}, { timestamps: true })

housekeepingTaskSchema.statics.TASK_STATUS = TASK_STATUS
module.exports = mongoose.model('HousekeepingTask', housekeepingTaskSchema)
