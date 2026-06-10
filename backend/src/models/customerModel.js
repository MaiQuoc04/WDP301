// Owner: Khánh — customer profile, linked to an Account
const mongoose = require('mongoose')

const customerSchema = new mongoose.Schema({
  account:  { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true, unique: true },
  fullName: { type: String, required: true, trim: true },
  phone:    { type: String, trim: true },
  idCard:   { type: String, trim: true },
  avatar:   { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('Customer', customerSchema)
