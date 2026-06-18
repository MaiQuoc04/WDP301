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
  const isReset = purpose === 'reset'
  const subject = isReset ? 'Ha Noi Hotel - Đặt lại mật khẩu' : 'Ha Noi Hotel - Xác thực tài khoản'
  const ttl = process.env.OTP_TTL_MINUTES || 10

  const title = isReset ? 'Đặt lại mật khẩu' : 'Xác thực tài khoản'
  const message = isReset 
    ? 'Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản tại Ha Noi Hotel. Vui lòng sử dụng mã OTP dưới đây để tiếp tục quá trình này:'
    : 'Cảm ơn bạn đã đăng ký tài khoản tại Ha Noi Hotel. Vui lòng sử dụng mã OTP dưới đây để xác thực địa chỉ email của bạn:'

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #1a365d; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">HA NOI HOTEL</h1>
      </div>
      <div style="padding: 30px; background-color: #ffffff; color: #333333;">
        <h2 style="margin-top: 0; color: #1a365d;">${title}</h2>
        <p style="font-size: 16px; line-height: 1.5;">Chào bạn,</p>
        <p style="font-size: 16px; line-height: 1.5;">${message}</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1a365d; background-color: #f0f4f8; padding: 15px 30px; border-radius: 6px; border: 1px dashed #1a365d;">${otp}</span>
        </div>
        <p style="font-size: 14px; color: #666666; text-align: center; font-style: italic;">
          * Mã OTP này sẽ hết hạn sau ${ttl} phút.
        </p>
        <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;" />
        <p style="font-size: 14px; color: #888888; text-align: center; margin: 0;">
          Nếu bạn không thực hiện yêu cầu này, vui lòng báo cáo email này cho bộ phận hỗ trợ.
        </p>
      </div>
      <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #aaaaaa;">
        &copy; ${new Date().getFullYear()} Ha Noi Hotel. All rights reserved.
      </div>
    </div>
  `

  const text = `Mã OTP của bạn là: ${otp} (hết hạn sau ${ttl} phút).`

  const t = getTransporter()
  if (!t) {
    console.log(`\n📧 [DEV EMAIL] To: ${to}\n   ${subject}\n   ${text}\n`)
    return { dev: true }
  }
  
  await t.sendMail({
    from: process.env.EMAIL_FROM || 'Ha Noi Hotel <no-reply@hanoihotel.com>',
    to, subject, text, html
  })
  
  return { sent: true }
}
