// Owner: Quốc (Sprint 0) — auth lõi trên Account. Khánh dựng UI gọi vào các hàm này.
const bcrypt = require('bcryptjs')
const Account = require('../models/accountModel')
const Customer = require('../models/customerModel')
const Employee = require('../models/employeeModel')
const otpUtil = require('../utils/otp')
const { sendOtpEmail } = require('../utils/email')
const { signAccessToken } = require('../utils/token')
const { STAFF_ROLES, isBranchBlocked } = require('../utils/access')

const isDev = () => process.env.NODE_ENV !== 'production'

// Quy tắc validate dùng chung (khớp FE LoginPage). Nguồn sự thật ở BE.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/   // TLD là chữ, tối thiểu 2 ký tự
const PHONE_RE = /^0\d{9,10}$/                       // SĐT VN: 0 + 9-10 số
const NAME_RE = /^\p{L}+(?:[ ]\p{L}+)*$/u            // chỉ chữ (kể cả tiếng Việt) + 1 khoảng trắng giữa các từ
// Nhà cung cấp phổ biến -> domain ĐÚNG (bắt lỗi gõ nhầm kiểu gmail.co / gmail.con / gmail.vn).
const EMAIL_CANON = {
  gmail: ['gmail.com'], googlemail: ['googlemail.com'], hotmail: ['hotmail.com'],
  icloud: ['icloud.com'], outlook: ['outlook.com', 'outlook.com.vn'], yahoo: ['yahoo.com', 'yahoo.com.vn'],
}
// Trả message lỗi email, hoặc null nếu hợp lệ.
function emailError(email) {
  const v = (email || '').trim().toLowerCase()
  if (!EMAIL_RE.test(v)) return 'Email không hợp lệ'
  const domain = v.split('@')[1]
  const brand = domain.split('.')[0]
  if (EMAIL_CANON[brand] && !EMAIL_CANON[brand].includes(domain))
    return `Email ${brand} phải là @${EMAIL_CANON[brand][0]}`
  return null
}
function assertValidRegister({ fullName, email, phone, password }) {
  if (!fullName || fullName.length < 2 || fullName.length > 50 || !NAME_RE.test(fullName))
    throw new Error('Họ tên phải 2–50 ký tự, chỉ gồm chữ và khoảng trắng')
  const emErr = emailError(email)
  if (emErr) throw new Error(emErr)
  if (!PHONE_RE.test(phone)) throw new Error('Số điện thoại không hợp lệ (VD: 0901234567)')
  if (!password || password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password))
    throw new Error('Mật khẩu tối thiểu 8 ký tự, gồm cả chữ và số')
}

// Hồ sơ + payload user trả về client
async function buildUser(account) {
  const profile = account.role === 'customer'
    ? await Customer.findOne({ account: account._id })
    : await Employee.findOne({ account: account._id })
  return {
    id: account._id,
    email: account.email,
    role: account.role,
    fullName: profile?.fullName || '',
    isVerified: account.isVerified,
  }
}

// Sinh + lưu (hash) + "gửi" OTP. Trả về OTP gốc để dev test.
async function issueOtp(account, purpose) {
  const otp = otpUtil.generateOtp()
  account.otp = await otpUtil.hashOtp(otp)
  account.otpExpiresAt = otpUtil.expiryFromNow()
  account.otpAttempts = 0
  await account.save()
  await sendOtpEmail(account.email, otp, purpose)
  return otp
}

// Kiểm tra OTP + xử lý khoá sau 5 lần sai (UC-02). Ném lỗi nếu không hợp lệ.
async function assertOtpValid(account, otp) {
  if (account.lockedUntil && account.lockedUntil > new Date())
    throw new Error('Đã nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút')
  if (!account.otp || !account.otpExpiresAt || account.otpExpiresAt < new Date())
    throw new Error('OTP không tồn tại hoặc đã hết hạn')
  const ok = await otpUtil.compareOtp(otp, account.otp)
  if (!ok) {
    account.otpAttempts = (account.otpAttempts || 0) + 1
    if (account.otpAttempts >= otpUtil.MAX_ATTEMPTS) {
      account.lockedUntil = new Date(Date.now() + otpUtil.LOCK_MINUTES * 60 * 1000)
      account.otpAttempts = 0
    }
    await account.save()
    throw new Error('OTP không đúng')
  }
}

function clearOtp(account) {
  account.otp = undefined
  account.otpExpiresAt = undefined
  account.otpAttempts = 0
  account.lockedUntil = undefined
}

// UC-01: đăng ký Customer (chưa verify) + gửi OTP
exports.register = async ({ email, password, fullName, phone }) => {
  fullName = (fullName || '').trim()
  email = (email || '').trim().toLowerCase()
  phone = (phone || '').trim()
  assertValidRegister({ fullName, email, phone, password })
  if (await Account.findOne({ email })) throw new Error('Email đã được đăng ký')
  const account = await Account.create({
    email, password: await bcrypt.hash(password, 10), role: 'customer', isVerified: false,
  })
  await Customer.create({ account: account._id, fullName, phone })
  await issueOtp(account, 'verify')
  return { email: account.email, message: 'Đăng ký thành công, vui lòng kiểm tra OTP trong email' }
}

// UC-02: xác thực OTP, kích hoạt tài khoản (tự đăng nhập luôn)
exports.verifyOtp = async ({ email, otp }) => {
  const account = await Account.findOne({ email }).select('+otp +otpExpiresAt')
  if (!account) throw new Error('Tài khoản không tồn tại')
  if (account.isVerified) throw new Error('Tài khoản đã được xác thực')
  await assertOtpValid(account, otp)
  account.isVerified = true
  clearOtp(account)
  await account.save()
  return { token: signAccessToken(account), user: await buildUser(account) }
}

// UC-06: gửi lại OTP, cooldown 60s
exports.resendOtp = async ({ email }) => {
  const account = await Account.findOne({ email }).select('+otpExpiresAt')
  if (!account) throw new Error('Tài khoản không tồn tại')
  if (account.isVerified) throw new Error('Tài khoản đã được xác thực')
  if (account.otpExpiresAt) {
    const sentAt = account.otpExpiresAt.getTime() - otpUtil.OTP_TTL_MINUTES * 60 * 1000
    const elapsed = (Date.now() - sentAt) / 1000
    if (elapsed < otpUtil.RESEND_COOLDOWN_SEC)
      throw new Error(`Vui lòng đợi ${Math.ceil(otpUtil.RESEND_COOLDOWN_SEC - elapsed)}s để gửi lại OTP`)
  }
  await issueOtp(account, 'verify')
  return { message: 'Đã gửi lại OTP' }
}

// UC-03: đăng nhập, phát JWT kèm role
exports.login = async ({ email, password }) => {
  email = (email || '').trim().toLowerCase()
  if (!email || !password) throw new Error('Vui lòng nhập email và mật khẩu')
  const account = await Account.findOne({ email })
  if (!account || !(await bcrypt.compare(password, account.password)))
    throw new Error('Email hoặc mật khẩu không đúng')
  if (!account.isActive) throw new Error('Tài khoản đã bị khoá')
  if (!account.isVerified) throw new Error('Tài khoản chưa xác thực email')
  if (STAFF_ROLES.includes(account.role) && await isBranchBlocked(account._id))
    throw new Error('Chi nhánh của bạn đang tạm ngừng hoạt động, vui lòng liên hệ quản trị viên')
  return { token: signAccessToken(account), user: await buildUser(account) }
}

// UC-05: quên mật khẩu -> gửi OTP đặt lại (không tiết lộ email có tồn tại hay không)
exports.forgotPassword = async ({ email }) => {
  const account = await Account.findOne({ email })
  if (account && account.isActive) {
    await issueOtp(account, 'reset')
  }
  return { message: 'Nếu email tồn tại, OTP đặt lại mật khẩu đã được gửi' }
}

exports.resetPassword = async ({ email, otp, password }) => {
  if (!password) throw new Error('Thiếu mật khẩu mới')
  const account = await Account.findOne({ email }).select('+otp +otpExpiresAt')
  if (!account) throw new Error('Tài khoản không tồn tại')
  await assertOtpValid(account, otp)
  account.password = await bcrypt.hash(password, 10)
  clearOtp(account)
  await account.save()
  return { message: 'Đặt lại mật khẩu thành công' }
}

// UC-10: đổi mật khẩu (đã đăng nhập)
exports.changePassword = async ({ accountId, oldPassword, newPassword }) => {
  if (!newPassword) throw new Error('Thiếu mật khẩu mới')
  const account = await Account.findById(accountId)
  if (!account) throw new Error('Tài khoản không tồn tại')
  if (!(await bcrypt.compare(oldPassword || '', account.password)))
    throw new Error('Mật khẩu cũ không đúng')
  account.password = await bcrypt.hash(newPassword, 10)
  await account.save()
  return { message: 'Đổi mật khẩu thành công' }
}

// UC-08: thông tin tài khoản hiện tại
exports.getMe = async (accountId) => {
  const account = await Account.findById(accountId)
  if (!account) throw new Error('Tài khoản không tồn tại')
  return buildUser(account)
}

// UC-04: Google Login
const { OAuth2Client } = require('google-auth-library')
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

exports.googleLogin = async ({ credential }) => {
  if (!credential) throw new Error('Thiếu Google credential token')

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload()
    const { email, name, picture } = payload

    // 1. Kiểm tra tài khoản đã tồn tại chưa
    let account = await Account.findOne({ email })

    if (!account) {
      // 2. Nếu chưa, tạo tài khoản mới tự động
      const randomPassword = Math.random().toString(36).slice(-8) // Mật khẩu ngẫu nhiên để pass validation
      account = await Account.create({
        email,
        password: await bcrypt.hash(randomPassword, 10),
        role: 'customer',
        isVerified: true, // Đã xác thực qua Google
        isActive: true
      })
      await Customer.create({ 
        account: account._id, 
        fullName: name, 
        phone: '' // Cho phép cập nhật sau
      })
    } else {
      // Nếu đã có tài khoản nhưng chưa verify (đăng ký bằng email nhưng chưa nhập OTP)
      if (!account.isVerified) {
        account.isVerified = true;
        await account.save();
      }
      if (!account.isActive) throw new Error('Tài khoản đã bị khoá')
    }
    if (STAFF_ROLES.includes(account.role) && await isBranchBlocked(account._id))
      throw new Error('Chi nhánh của bạn đang tạm ngừng hoạt động, vui lòng liên hệ quản trị viên')

    // 3. Cấp token
    return { token: signAccessToken(account), user: await buildUser(account) }
  } catch (err) {
    console.error('Google Auth Error:', err)
    throw new Error('Đăng nhập Google thất bại: ' + err.message)
  }
}
