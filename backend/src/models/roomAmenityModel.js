// Owner: Hoàng — amenities a room has, quantity & condition (UC-49→51)
const mongoose = require('mongoose')

const roomAmenitySchema = new mongoose.Schema({
  room:      { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  amenity:   { type: mongoose.Schema.Types.ObjectId, ref: 'Amenity', required: true },
  quantity:  { type: Number, default: 1 },
  condition: { type: String, enum: ['good', 'damaged', 'missing'], default: 'good' },
}, { timestamps: true })

roomAmenitySchema.index({ room: 1, amenity: 1 }, { unique: true })
module.exports = mongoose.model('RoomAmenity', roomAmenitySchema)
