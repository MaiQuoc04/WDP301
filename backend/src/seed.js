// Seed dữ liệu khởi tạo: 1 Super Admin + 1 Branch mẫu. Chạy: `npm run seed`
// Idempotent — chạy lại nhiều lần không tạo trùng.
require('dotenv').config()
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
const connectDB = require('./dbConnect')
const Account = require('./models/accountModel')
const Employee = require('./models/employeeModel')
const Branch = require('./models/branchModel')

async function seed() {
  await connectDB()

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@hbms.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123'

  let admin = await Account.findOne({ email: adminEmail })
  if (admin) {
    console.log('⏭  Super Admin đã tồn tại:', adminEmail)
  } else {
    admin = await Account.create({
      email: adminEmail,
      password: await bcrypt.hash(adminPassword, 10),
      role: 'super_admin',
      isVerified: true,
      isActive: true,
    })
    await Employee.create({ account: admin._id, fullName: 'Super Admin' })
    console.log(`✅ Tạo Super Admin: ${adminEmail} / mật khẩu: ${adminPassword}`)
  }

  const branchCode = 'HN01'
  const branch = await Branch.findOne({ code: branchCode })
  if (branch) {
    console.log('⏭  Branch mẫu đã tồn tại:', branchCode)
  } else {
    await Branch.create({
      code: branchCode,
      name: 'Hanoi Hotel - Chi nhánh Hoàn Kiếm',
      location: 'Hoàn Kiếm, Hà Nội',
      hotline: '1900 1234',
      depositRate: 0.3,
      pendingTimeoutMinutes: 15,
    })
    console.log('✅ Tạo Branch mẫu:', branchCode)
  }

  console.log('🌱 Seed hoàn tất.')
  await mongoose.disconnect()
  process.exit(0)
}

seed().catch((e) => {
  console.error('❌ Seed lỗi:', e.message)
  process.exit(1)
})
