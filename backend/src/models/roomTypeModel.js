// Owner: Hoàng — room category detail (UC-57→59)
const mongoose = require('mongoose')

const roomTypeSchema = new mongoose.Schema({
  branch:      { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  name:        { type: String, required: true, trim: true },
  bedType:     { type: String, enum: ['single', 'double', 'twin', 'king'] },
  capacity:    { type: Number, default: 2 },
  totalBeds:   { type: Number, default: 1 }, // sức chứa = totalBeds × 2 đơn vị (người lớn=1, trẻ em=0.5)
  extraBedFee: { type: Number, default: 0 }, // phụ phí mỗi GIƯỜNG PHỤ khi party vượt số giường, tính /đêm
  area:        { type: Number }, // m2
  basePrice:   { type: Number, required: true },
  description: { type: String, trim: true },
  images:      [{ type: String }],
  status:      { type: String, enum: ['active', 'inactive'], default: 'active' },
  amenities:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Amenity' }], // Hoàng — gán amenity theo loại phòng
  // Số lượng CHUẨN từng thiết bị theo loại phòng (baseline kiểm kê — manager set, housekeeper không sửa).
  // Tách khỏi `amenities` (vốn dùng để hiển thị cho khách) để không phá code module khác.
  amenityStandards: [{
    amenity:  { type: mongoose.Schema.Types.ObjectId, ref: 'Amenity' },
    quantity: { type: Number, default: 1, min: 0 },
  }],
}, { timestamps: true })

roomTypeSchema.index({ branch: 1, name: 1 }, { unique: true })

module.exports = mongoose.model('RoomType', roomTypeSchema)
