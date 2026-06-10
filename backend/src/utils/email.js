// Dev: in OTP ra console (không cần creds). Prod: cắm SMTP qua nodemailer khi EMAIL_HOST có giá trị.
// Để bật SMTP thật: `npm i nodemailer` + điền EMAIL_* trong .env.
let _transporter = null

function getTransporter() {
  if (_transporter !== null) return _transporter
  if (process.env.EMAIL_HOST) {
    try {
      const nodemailer = require('nodemailer')
      _transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: Number(process.env.EMAIL_PORT) === 465,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      })
    } catch {
      console.warn('[email] Chưa cài nodemailer — fallback console. Chạy: npm i nodemailer')
      _transporter = false
    }
  } else {
    _transporter = false // dev console mode
  }
  return _transporter
}

exports.sendOtpEmail = async (to, otp, purpose = 'verify') => {
  const subject = purpose === 'reset' ? 'HBMS - Đặt lại mật khẩu' : 'HBMS - Xác thực tài khoản'
  const ttl = process.env.OTP_TTL_MINUTES || 10
  const text = `Mã OTP của bạn là: ${otp} (hết hạn sau ${ttl} phút).`
  const t = getTransporter()
  if (!t) {
    console.log(`\n📧 [DEV EMAIL] To: ${to}\n   ${subject}\n   ${text}\n`)
    return { dev: true }
  }
  await t.sendMail({
    from: process.env.EMAIL_FROM || 'HBMS <no-reply@hbms.com>',
    to, subject, text,
  })
  return { sent: true }
}
