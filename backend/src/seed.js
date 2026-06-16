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
const Role = require('./models/roleModel')
const RoleAssignment = require('./models/roleAssignmentModel')
const RoomType = require('./models/roomTypeModel')
const Room = require('./models/roomModel')
const Amenity = require('./models/amenityModel')
const RoomAmenity = require('./models/roomAmenityModel')
const Service = require('./models/serviceModel')
const RoomPrice = require('./models/roomPriceModel')
const RoomIssue = require('./models/roomIssueModel')


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

  // 0) Roles (bảng tham chiếu — jurisdiction theo report_final). permissions = scope module.
  const ROLES = [
    { name: 'super_admin',    description: 'Quản trị toàn hệ thống: quản lý chi nhánh, cấp tài khoản & phân quyền', permissions: ['*'] },
    { name: 'branch_manager', description: 'Quản lý chi nhánh: cấu hình phòng/dịch vụ/giá, theo dõi dashboard',     permissions: ['manager'] },
    { name: 'receptionist',   description: 'Lễ tân: quản lý booking, check-in/out, thu phí, gán phòng',             permissions: ['reception'] },
    { name: 'housekeeper',    description: 'Buồng phòng: nhận task dọn, kiểm kê thiết bị, báo thiếu/hỏng',           permissions: ['housekeeping'] },
    { name: 'customer',       description: 'Khách đã đăng ký: đặt phòng, thanh toán cọc, xem lịch sử',               permissions: ['customer'] },
  ]
  for (const r of ROLES) {
    await ensure(Role, { name: r.name }, { description: r.description, permissions: r.permissions }, `Role ${r.name}`)
  }

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

  // 5) Clean and Seed RoomType, Room, Amenity, RoomAmenity, Service, RoomPrice
  console.log('🧹 Clearing old room types, rooms, prices, amenities, and services...')
  await RoomPrice.deleteMany({})
  await RoomAmenity.deleteMany({})
  await Room.deleteMany({})
  await RoomType.deleteMany({})
  await Amenity.deleteMany({})
  await Service.deleteMany({})
  await RoomIssue.deleteMany({})


  const standard = await ensure(RoomType, { branch: branch._id, name: 'Standard' },
    { bedType: 'double', capacity: 2, area: 20, basePrice: 800000, status: 'active',
      description: 'Phòng tiêu chuẩn 2 người' }, 'RoomType Standard')
  
  const deluxeTwin = await ensure(RoomType, { branch: branch._id, name: 'Deluxe Twin' },
    { bedType: 'twin', capacity: 2, area: 30, basePrice: 1200000, status: 'active',
      description: 'Phòng cao cấp 2 giường đơn' }, 'RoomType Deluxe Twin')

  const deluxeDouble = await ensure(RoomType, { branch: branch._id, name: 'Deluxe Double' },
    { bedType: 'double', capacity: 2, area: 30, basePrice: 1500000, status: 'active',
      description: 'Phòng cao cấp 1 giường đôi lớn' }, 'RoomType Deluxe Double')

  const familySuite = await ensure(RoomType, { branch: branch._id, name: 'Family Suite' },
    { bedType: 'king', capacity: 4, area: 50, basePrice: 2500000, status: 'active',
      description: 'Phòng Suite cho gia đình' }, 'RoomType Family Suite')

  const execSuite = await ensure(RoomType, { branch: branch._id, name: 'Executive Suite' },
    { bedType: 'king', capacity: 2, area: 65, basePrice: 4000000, status: 'active',
      description: 'Phòng Suite hoàng gia hạng sang' }, 'RoomType Executive Suite')

  const rooms = []
  // Tầng 1: 101 -> 110: Deluxe Twin
  for (let i = 1; i <= 10; i++) {
    rooms.push({ roomType: deluxeTwin, roomNumber: `1${String(i).padStart(2, '0')}`, floor: 1 })
  }
  // Tầng 2: 201 -> 210: Deluxe Double
  for (let i = 1; i <= 10; i++) {
    rooms.push({ roomType: deluxeDouble, roomNumber: `2${String(i).padStart(2, '0')}`, floor: 2 })
  }
  // Tầng 3: 301 -> 305: Family Suite
  for (let i = 1; i <= 5; i++) {
    rooms.push({ roomType: familySuite, roomNumber: `3${String(i).padStart(2, '0')}`, floor: 3 })
  }
  // Tầng 4: 401 -> 403: Executive Suite
  for (let i = 1; i <= 3; i++) {
    rooms.push({ roomType: execSuite, roomNumber: `4${String(i).padStart(2, '0')}`, floor: 4 })
  }

  const roomDocs = []
  for (const r of rooms) {
    roomDocs.push(await ensure(Room, { branch: branch._id, roomNumber: r.roomNumber },
      { roomType: r.roomType._id, floor: r.floor, status: 'available' }, `Room ${r.roomNumber}`))
  }

  // 6) Amenity + gán vào từng phòng (RoomAmenity) & RoomType
  const amenitySpecs = [
    { name: 'Khăn tắm', missingPrice: 50000 },
    { name: 'Dép', missingPrice: 30000 },
    { name: 'Nước suối', missingPrice: 15000 },
    { name: 'Wifi', missingPrice: 0 },
    { name: 'TV', missingPrice: 2000000 },
    { name: 'Air Conditioner', missingPrice: 5000000 },
    { name: 'Mini Bar', missingPrice: 1500000 },
    { name: 'Bathtub', missingPrice: 4000000 },
    { name: 'Breakfast', missingPrice: 0 },
    { name: 'Balcony', missingPrice: 0 },
    { name: 'Safe Box', missingPrice: 1000000 },
  ]
  const amenityDocs = []
  for (const a of amenitySpecs) {
    amenityDocs.push(await ensure(Amenity, { branch: branch._id, name: a.name },
      { missingPrice: a.missingPrice, unit: 'cái', status: 'active' }, `Amenity ${a.name}`))
  }

  const wifi = amenityDocs.find(a => a.name === 'Wifi')
  const tv = amenityDocs.find(a => a.name === 'TV')
  const ac = amenityDocs.find(a => a.name === 'Air Conditioner')
  const miniBar = amenityDocs.find(a => a.name === 'Mini Bar')
  const bathtub = amenityDocs.find(a => a.name === 'Bathtub')
  const breakfast = amenityDocs.find(a => a.name === 'Breakfast')
  const balcony = amenityDocs.find(a => a.name === 'Balcony')
  const safeBox = amenityDocs.find(a => a.name === 'Safe Box')

  // Gán tiện nghi tiêu chuẩn cho RoomType
  standard.amenities = [wifi._id, tv._id]
  await standard.save()

  deluxeTwin.amenities = [wifi._id, tv._id, ac._id]
  await deluxeTwin.save()

  deluxeDouble.amenities = [wifi._id, tv._id, ac._id, miniBar._id]
  await deluxeDouble.save()

  familySuite.amenities = [wifi._id, tv._id, ac._id, bathtub._id, breakfast._id]
  await familySuite.save()

  execSuite.amenities = [wifi._id, tv._id, ac._id, miniBar._id, bathtub._id, breakfast._id, balcony._id, safeBox._id]
  await execSuite.save()

  // Gán RoomAmenity vật lý cho phòng (bao gồm Khăn tắm, Dép, Nước suối + các tiện nghi của RoomType đó)
  const baseAmenities = amenityDocs.filter(a => ['Khăn tắm', 'Dép', 'Nước suối'].includes(a.name))

  for (const room of roomDocs) {
    // Tìm RoomType của room này để lấy amenities tiêu chuẩn
    let rtAmenities = []
    if (room.roomType.toString() === standard._id.toString()) rtAmenities = standard.amenities
    else if (room.roomType.toString() === deluxeTwin._id.toString()) rtAmenities = deluxeTwin.amenities
    else if (room.roomType.toString() === deluxeDouble._id.toString()) rtAmenities = deluxeDouble.amenities
    else if (room.roomType.toString() === familySuite._id.toString()) rtAmenities = familySuite.amenities
    else if (room.roomType.toString() === execSuite._id.toString()) rtAmenities = execSuite.amenities

    // Các amenities cần gán cho room vật lý này
    const allRoomAmIds = [...baseAmenities.map(a => a._id), ...rtAmenities]
    
    for (const amId of allRoomAmIds) {
      const amObj = amenityDocs.find(a => a._id.toString() === amId.toString())
      await ensure(RoomAmenity, { room: room._id, amenity: amId },
        { quantity: 2, condition: 'active' }, `RoomAmenity ${room.roomNumber}/${amObj.name}`)
    }
  }

  // 7) Extra Service
  await ensure(Service, { branch: branch._id, name: 'Breakfast Buffet' },
    { price: 150000, status: 'active', description: 'Buffet sáng tự chọn' }, 'Service Breakfast Buffet')
  await ensure(Service, { branch: branch._id, name: 'Airport Transfer' },
    { price: 300000, status: 'active', description: 'Đưa đón sân bay' }, 'Service Airport Transfer')
  await ensure(Service, { branch: branch._id, name: 'Laundry Service' },
    { price: 50000, status: 'active', description: 'Dịch vụ giặt ủi' }, 'Service Laundry Service')
  await ensure(Service, { branch: branch._id, name: 'Spa Package' },
    { price: 500000, status: 'active', description: 'Gói trị liệu Spa toàn thân' }, 'Service Spa Package')
  await ensure(Service, { branch: branch._id, name: 'Extra Bed' },
    { price: 350000, status: 'active', description: 'Kê thêm giường phụ' }, 'Service Extra Bed')
  await ensure(Service, { branch: branch._id, name: 'Mini Bar Combo' },
    { price: 120000, status: 'active', description: 'Combo nước ngọt và snack tại phòng' }, 'Service Mini Bar Combo')


  console.log('\n🌱 Seed hoàn tất.')
  console.log('Tài khoản test: admin@hbms.com/Admin@123 · receptionist@hbms.com/Recept@123 · housekeeper@hbms.com/House@123 · manager@hbms.com/Manager@123 · customer@hbms.com/Customer@123')
  await mongoose.disconnect()
  process.exit(0)
}

seed().catch((e) => { console.error('❌ Seed lỗi:', e.message); process.exit(1) })
