const mongoose = require('mongoose')

const offerSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  image:       { type: String },
  link:        { type: String },
  status:      { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true })

module.exports = mongoose.model('Offer', offerSchema)
