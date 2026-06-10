const bcrypt = require('bcryptjs')

const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES) || 10
const RESEND_COOLDOWN_SEC = 60 // UC-06
const MAX_ATTEMPTS = 5         // UC-02: khoá sau 5 lần sai
const LOCK_MINUTES = 15

exports.OTP_TTL_MINUTES = OTP_TTL_MINUTES
exports.RESEND_COOLDOWN_SEC = RESEND_COOLDOWN_SEC
exports.MAX_ATTEMPTS = MAX_ATTEMPTS
exports.LOCK_MINUTES = LOCK_MINUTES

exports.generateOtp = () => String(Math.floor(100000 + Math.random() * 900000)) // 6 chữ số
exports.hashOtp = (otp) => bcrypt.hash(String(otp), 10)
exports.compareOtp = (otp, hash) => bcrypt.compare(String(otp), hash)
exports.expiryFromNow = () => new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000)
