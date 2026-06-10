// Owner: Sáng — staff profile, linked to an Account
const mongoose = require('mongoose')

const employeeSchema = new mongoose.Schema({
  account:  { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true, unique: true },
  fullName: { type: String, required: true, trim: true },
  phone:    { type: String, trim: true },
  gender:   { type: String, enum: ['male', 'female', 'other'] },
  salary:   { type: Number, default: 0 },
  avatar:   { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('Employee', employeeSchema)
