// Seed dữ liệu khởi tạo cho cả nhóm test. Chạy: `npm run seed`
// Idempotent — chạy lại nhiều lần không tạo trùng.
require('dotenv').config()
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
const connectDB = require('./dbConnect')
const Account = require('./models/accountModel')
const Employee = require('./models/employeeModel')
const Customer = require('./models/customerModel')
const Branch = require('./models/branchModel')
const RoleAssignment = require('./models/roleAssignmentModel')
const RoomType = require('./models/roomTypeModel')
const Room = require('./models/roomModel')
const Amenity = require('./models/amenityModel')
const RoomAmenity = require('./models/roomAmenityModel')
const Service = require('./models/serviceModel')

// Tạo nếu chưa có (theo `query`), trả về document.
async function ensure(Model, query, data, label) {
  let doc = await Model.findOne(query)
  if (doc) { console.log(`⏭  ${label} đã có`); return doc }
  doc = await Model.create({ ...query, ...data })
  console.log(`✅ Tạo ${label}`)
  return doc
}

// Tạo 1 tài khoản staff + Employee + RoleAssignment vào branch
async function ensureStaff(email, password, role, fullName, branch) {
  let acc = await Account.findOne({ email })
  if (!acc) {
    acc = await Account.create({
      email, password: await bcrypt.hash(password, 10),
      role, isVerified: true, isActive: true,
    })
    await Employee.create({ account: acc._id, fullName })
    console.log(`✅ Tạo ${role}: ${email} / ${password}`)
  } else {
    console.log(`⏭  ${role} đã có: ${email}`)
  }
  await ensure(RoleAssignment, { account: acc._id, branch: branch._id, role },
    { isActive: true }, `RoleAssignment ${role}@${branch.code}`)
  return acc
}

async function seed() {
  await connectDB()

  // 1) Branch
  const branch = await ensure(Branch, { code: 'HN01' }, {
    name: 'Hanoi Hotel - Chi nhánh Hoàn Kiếm',
    location: 'Hoàn Kiếm, Hà Nội', hotline: '1900 1234',
    depositRate: 0.3, pendingTimeoutMinutes: 15,
  }, 'Branch HN01')

  // 2) Super Admin
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@hbms.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123'
  let admin = await Account.findOne({ email: adminEmail })
  if (!admin) {
    admin = await Account.create({
      email: adminEmail, password: await bcrypt.hash(adminPassword, 10),
      role: 'super_admin', isVerified: true, isActive: true,
    })
    await Employee.create({ account: admin._id, fullName: 'Super Admin' })
    console.log(`✅ Tạo Super Admin: ${adminEmail} / ${adminPassword}`)
  } else { console.log('⏭  Super Admin đã có') }

  // 3) Staff mỗi role 1 tài khoản (gán vào HN01)
  await ensureStaff('receptionist@hbms.com', 'Recept@123', 'receptionist', 'Lễ Tân A', branch)
  await ensureStaff('housekeeper@hbms.com', 'House@123', 'housekeeper', 'Buồng Phòng A', branch)
  await ensureStaff('manager@hbms.com', 'Manager@123', 'branch_manager', 'Quản Lý A', branch)

  // 4) 1 Customer mẫu (đã verify)
  let custAcc = await Account.findOne({ email: 'customer@hbms.com' })
  if (!custAcc) {
    custAcc = await Account.create({
      email: 'customer@hbms.com', password: await bcrypt.hash('Customer@123', 10),
      role: 'customer', isVerified: true, isActive: true,
    })
    await Customer.create({ account: custAcc._id, fullName: 'Khách Hàng A', phone: '0909000111', idCard: '012345678901' })
    console.log('✅ Tạo Customer: customer@hbms.com / Customer@123')
  } else { console.log('⏭  Customer mẫu đã có') }

  // 5) RoomType + Room
  const standard = await ensure(RoomType, { branch: branch._id, name: 'Standard' },
    { bedType: 'double', capacity: 2, area: 20, basePrice: 800000, status: 'active',
      description: 'Phòng tiêu chuẩn 2 người' }, 'RoomType Standard')
  const deluxe = await ensure(RoomType, { branch: branch._id, name: 'Deluxe' },
    { bedType: 'king', capacity: 2, area: 30, basePrice: 1500000, status: 'active',
      description: 'Phòng cao cấp giường King' }, 'RoomType Deluxe')

  const rooms = [
    { roomType: standard, roomNumber: '101', floor: 1 },
    { roomType: standard, roomNumber: '102', floor: 1 },
    { roomType: deluxe,   roomNumber: '201', floor: 2 },
  ]
  const roomDocs = []
  for (const r of rooms) {
    roomDocs.push(await ensure(Room, { branch: branch._id, roomNumber: r.roomNumber },
      { roomType: r.roomType._id, floor: r.floor, status: 'available' }, `Room ${r.roomNumber}`))
  }

  // 6) Amenity + gán vào từng phòng (RoomAmenity)
  const amenitySpecs = [
    { name: 'Khăn tắm', missingPrice: 50000 },
    { name: 'Dép', missingPrice: 30000 },
    { name: 'Nước suối', missingPrice: 15000 },
  ]
  const amenityDocs = []
  for (const a of amenitySpecs) {
    amenityDocs.push(await ensure(Amenity, { branch: branch._id, name: a.name },
      { missingPrice: a.missingPrice, unit: 'cái', status: 'active' }, `Amenity ${a.name}`))
  }
  for (const room of roomDocs) {
    for (const am of amenityDocs) {
      await ensure(RoomAmenity, { room: room._id, amenity: am._id },
        { quantity: 2, condition: 'active' }, `RoomAmenity ${room.roomNumber}/${am.name}`)
    }
  }

  // 7) Extra Service
  await ensure(Service, { branch: branch._id, name: 'Massage' },
    { price: 300000, status: 'active', description: 'Dịch vụ massage 60 phút' }, 'Service Massage')
  await ensure(Service, { branch: branch._id, name: 'Ăn sáng' },
    { price: 100000, status: 'active', description: 'Buffet sáng' }, 'Service Ăn sáng')

  console.log('\n🌱 Seed hoàn tất.')
  console.log('Tài khoản test: admin@hbms.com/Admin@123 · receptionist@hbms.com/Recept@123 · housekeeper@hbms.com/House@123 · manager@hbms.com/Manager@123 · customer@hbms.com/Customer@123')
  await mongoose.disconnect()
  process.exit(0)
}

seed().catch((e) => { console.error('❌ Seed lỗi:', e.message); process.exit(1) })
