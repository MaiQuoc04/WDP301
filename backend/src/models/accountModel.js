// Sprint 0 / Owner: Khánh — login credentials for ALL users (UC-01→10)
// NOTE: authService/authController hiện vẫn dùng userModel.js (legacy).
//       Quốc migrate auth sang Account ở Sprint 0 và nhét `role` vào JWT.
const mongoose = require('mongoose')

const ROLES = ['customer', 'receptionist', 'housekeeper', 'branch_manager', 'super_admin']

const accountSchema = new mongoose.Schema({
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:     { type: String, required: true },
  role:         { type: String, enum: ROLES, default: 'customer' },
  isVerified:   { type: Boolean, default: false },
  isActive:     { type: Boolean, default: true },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  // OTP cho verify email / forgot password (UC-02/05/06)
  otp:          { type: String, select: false },
  otpExpiresAt: { type: Date, select: false },
  otpAttempts:  { type: Number, default: 0 },
  lockedUntil:  { type: Date },
}, { timestamps: true })

accountSchema.statics.ROLES = ROLES
module.exports = mongoose.model('Account', accountSchema)
