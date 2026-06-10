// Owner: Quốc (Sprint 0) — auth lõi trên Account. Khánh dựng UI gọi vào các hàm này.
const bcrypt = require('bcryptjs')
const Account = require('../models/accountModel')
const Customer = require('../models/customerModel')
const Employee = require('../models/employeeModel')
const otpUtil = require('../utils/otp')
const { sendOtpEmail } = require('../utils/email')
const { signAccessToken } = require('../utils/token')

const isDev = () => process.env.NODE_ENV !== 'production'

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
  if (!email || !password || !fullName) throw new Error('Thiếu email, mật khẩu hoặc họ tên')
  if (await Account.findOne({ email })) throw new Error('Email đã được đăng ký')
  const account = await Account.create({
    email, password: await bcrypt.hash(password, 10), role: 'customer', isVerified: false,
  })
  await Customer.create({ account: account._id, fullName, phone })
  const otp = await issueOtp(account, 'verify')
  const res = { email: account.email, message: 'Đăng ký thành công, vui lòng kiểm tra OTP trong email' }
  if (isDev()) res.devOtp = otp
  return res
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
  const otp = await issueOtp(account, 'verify')
  const res = { message: 'Đã gửi lại OTP' }
  if (isDev()) res.devOtp = otp
  return res
}

// UC-03: đăng nhập, phát JWT kèm role
exports.login = async ({ email, password }) => {
  const account = await Account.findOne({ email })
  if (!account || !(await bcrypt.compare(password, account.password)))
    throw new Error('Email hoặc mật khẩu không đúng')
  if (!account.isActive) throw new Error('Tài khoản đã bị khoá')
  if (!account.isVerified) throw new Error('Tài khoản chưa xác thực email')
  return { token: signAccessToken(account), user: await buildUser(account) }
}

// UC-05: quên mật khẩu -> gửi OTP đặt lại (không tiết lộ email có tồn tại hay không)
exports.forgotPassword = async ({ email }) => {
  const account = await Account.findOne({ email })
  const res = { message: 'Nếu email tồn tại, OTP đặt lại mật khẩu đã được gửi' }
  if (account && account.isActive) {
    const otp = await issueOtp(account, 'reset')
    if (isDev()) res.devOtp = otp
  }
  return res
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

// UC-04: stub — Khánh hoàn thiện khi có GOOGLE_CLIENT_ID (google-auth-library)
exports.googleLogin = async () => {
  throw new Error('Google OAuth chưa được cài đặt (stub - UC-04)')
}
