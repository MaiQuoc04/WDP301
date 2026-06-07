// Owner: Tú — room cleaning & inspection tasks (UC-44→55)
// ⚠️ HỢP ĐỒNG: housekeepingService.createOnCheckIn(bookingId, roomId) do Tú cung cấp,
//    Quốc gọi khi check-in. Amenity thiếu ghi ngược vào Booking.missingAmenities (Quốc định nghĩa).
const mongoose = require('mongoose')

const TASK_STATUS = ['unassigned', 'claimed', 'in_progress', 'completed']

const housekeepingTaskSchema = new mongoose.Schema({
  branch:     { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  room:       { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  booking:    { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }, // null = chưa ai claim
  type:       { type: String, enum: ['checkout_cleaning', 'inspection'], default: 'checkout_cleaning' },
  status:     { type: String, enum: TASK_STATUS, default: 'unassigned' },

  // Báo cáo kiểm kê amenity (UC-49→51)
  amenityReport: [{
    amenity:   { type: mongoose.Schema.Types.ObjectId, ref: 'Amenity' },
    name:      String,
    expected:  Number,
    actual:    Number,
    missing:   Number,
    condition: { type: String, enum: ['good', 'damaged', 'missing'], default: 'good' },
  }],
  issueReport: { type: String, trim: true }, // báo sự cố phòng (UC-52)

  startedAt:   { type: Date },
  completedAt: { type: Date },
}, { timestamps: true })

housekeepingTaskSchema.statics.TASK_STATUS = TASK_STATUS
module.exports = mongoose.model('HousekeepingTask', housekeepingTaskSchema)
