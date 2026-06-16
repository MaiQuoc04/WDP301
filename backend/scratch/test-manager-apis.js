// Script kiểm thử tự động APIs / nghiệp vụ của Branch Manager
// Chạy trực tiếp bằng Node.js: node scratch/test-manager-apis.js
require('dotenv').config()
const mongoose = require('mongoose')
const connectDB = require('../src/dbConnect')
const { getBranchManagerBranch } = require('../src/middlewares/authMiddleware')
const managerService = require('../src/services/managerService')
const bookingService = require('../src/services/bookingService')
const Account = require('../src/models/accountModel')
const Branch = require('../src/models/branchModel')
const Room = require('../src/models/roomModel')
const RoomType = require('../src/models/roomTypeModel')
const RoomPrice = require('../src/models/roomPriceModel')
const { execSync } = require('child_process')

// Helper assert đơn giản
function assert(condition, message) {
  if (!condition) {
    throw new Error(`❌ FAILED: ${message}`)
  }
}

async function runTests() {
  console.log('🔄 Bắt đầu chạy kiểm thử tích hợp nghiệp vụ Manager...')
  await connectDB()

  // Lấy chi nhánh và tài khoản mẫu từ seed
  const branch = await Branch.findOne({ code: 'HN01' })
  assert(branch, 'Chi nhánh HN01 phải tồn tại')

  const managerAcc = await Account.findOne({ email: 'manager@hbms.com' })
  assert(managerAcc, 'Tài khoản manager phải tồn tại')

  const customerAcc = await Account.findOne({ email: 'customer@hbms.com' })
  assert(customerAcc, 'Tài khoản customer phải tồn tại')

  // =========================================================================
  // 1. Kiểm tra Middleware Phân Quyền Chi Nhánh (getBranchManagerBranch)
  // =========================================================================
  console.log('\n--- Test 1: Phân quyền chi nhánh qua getBranchManagerBranch ---')
  
  // Case 1: Tài khoản manager hợp lệ
  let req = { user: { id: managerAcc._id } }
  let res = {}
  let nextCalled = false
  await getBranchManagerBranch(req, res, () => { nextCalled = true })
  assert(nextCalled, 'Next phải được gọi đối với manager hợp lệ')
  assert(req.branchId.toString() === branch._id.toString(), 'req.branchId phải được gán đúng ID chi nhánh HN01')
  console.log('✅ Pass: Manager được gán branchId chính xác')

  // Case 2: Tài khoản customer (không được phân quyền branch_manager)
  req = { user: { id: customerAcc._id } }
  let statusSent = null
  let jsonSent = null
  res = {
    status: (code) => { statusSent = code; return res },
    json: (obj) => { jsonSent = obj; return res }
  }
  await getBranchManagerBranch(req, res, () => {})
  assert(statusSent === 403, 'Phải trả về status 403 khi tài khoản không được phân quyền')
  assert(jsonSent?.message?.includes('không được gán quyền'), 'Thông điệp lỗi phải hợp lệ')
  console.log('✅ Pass: Chặn phân quyền tài khoản không hợp lệ chính xác')


  // =========================================================================
  // 2. Kiểm tra Validation của RoomType
  // =========================================================================
  console.log('\n--- Test 2: Validation của RoomType ---')
  
  // Case 1: Tạo room type giá âm/bằng 0
  try {
    await managerService.createRoomType({
      name: 'Invalid Price RT',
      basePrice: 0,
      capacity: 2
    }, branch._id)
    assert(false, 'Tạo RoomType với giá bằng 0 phải lỗi')
  } catch (err) {
    assert(err.message.includes('lớn hơn 0'), 'Lỗi trả về phải là giá cơ bản lớn hơn 0')
  }

  // Case 2: Tạo room type sức chứa <= 0
  try {
    await managerService.createRoomType({
      name: 'Invalid Capacity RT',
      basePrice: 500000,
      capacity: 0
    }, branch._id)
    assert(false, 'Tạo RoomType với capacity <= 0 phải lỗi')
  } catch (err) {
    assert(err.message.includes('Sức chứa phải lớn hơn 0'), 'Lỗi trả về phải là sức chứa lớn hơn 0')
  }

  // Case 3: Trùng tên trong cùng chi nhánh
  try {
    await managerService.createRoomType({
      name: 'Standard',
      basePrice: 900000,
      capacity: 2
    }, branch._id)
    assert(false, 'Tạo RoomType trùng tên trong chi nhánh phải lỗi')
  } catch (err) {
    assert(err.message.includes('đã tồn tại'), 'Lỗi trả về phải báo tên loại phòng đã tồn tại')
  }
  console.log('✅ Pass: Các ràng buộc validation của RoomType hoạt động tốt')


  // =========================================================================
  // 3. Kiểm tra Validation của Room
  // =========================================================================
  console.log('\n--- Test 3: Validation của Room ---')

  // Lấy RoomType Standard vừa được seed
  const standardRT = await RoomType.findOne({ name: 'Standard', branch: branch._id })
  assert(standardRT, 'RoomType Standard phải tồn tại')

  // Case 1: Trùng số phòng
  try {
    await managerService.createRoom({
      roomType: standardRT._id,
      roomNumber: '101',
      floor: 1
    }, branch._id)
    assert(false, 'Tạo phòng trùng số phòng trong chi nhánh phải lỗi')
  } catch (err) {
    assert(err.message.includes('đã tồn tại'), 'Lỗi phải báo số phòng đã tồn tại')
  }

  // Case 2: Số tầng < 1
  try {
    await managerService.createRoom({
      roomType: standardRT._id,
      roomNumber: '999',
      floor: 0
    }, branch._id)
    assert(false, 'Tạo phòng với số tầng < 1 phải lỗi')
  } catch (err) {
    assert(err.message.includes('Số tầng phải >= 1'), 'Lỗi phải báo số tầng phải >= 1')
  }
  console.log('✅ Pass: Các ràng buộc validation của Room hoạt động tốt')


  // =========================================================================
  // 4. Kiểm tra Validation của RoomPrice (Giá động)
  // =========================================================================
  console.log('\n--- Test 4: Validation của RoomPrice ---')

  // Case 1: Thiếu cả date và dayType
  try {
    await managerService.createOrUpdateRoomPrice({
      roomType: standardRT._id,
      price: 1000000
    }, branch._id)
    assert(false, 'Tạo giá động thiếu cả date và dayType phải lỗi')
  } catch (err) {
    assert(err.message.includes('ngày cụ thể'), 'Lỗi phải yêu cầu nhập date hoặc dayType')
  }

  // Case 2: Giá <= 0
  try {
    await managerService.createOrUpdateRoomPrice({
      roomType: standardRT._id,
      dayType: 'weekday',
      price: -100
    }, branch._id)
    assert(false, 'Tạo giá động <= 0 phải lỗi')
  } catch (err) {
    assert(err.message.includes('lớn hơn 0'), 'Lỗi phải yêu cầu giá lớn hơn 0')
  }
  console.log('✅ Pass: Các ràng buộc validation của RoomPrice hoạt động tốt')


  // =========================================================================
  // 5. Kiểm tra Soft Delete Room và ảnh hưởng tới Booking Availability
  // =========================================================================
  console.log('\n--- Test 5: Soft Delete Room & Booking Availability ---')

  const deluxeTwinRT = await RoomType.findOne({ name: 'Deluxe Twin', branch: branch._id })
  assert(deluxeTwinRT, 'RoomType Deluxe Twin phải tồn tại')

  // Ngày giả định để test đếm phòng khả dụng
  const checkIn = new Date(); checkIn.setDate(checkIn.getDate() + 2)
  const checkOut = new Date(); checkOut.setDate(checkOut.getDate() + 5)

  // 1. Đếm số phòng trước khi soft delete
  const availableBefore = await bookingService.countAvailableRooms(deluxeTwinRT._id, branch._id, checkIn, checkOut)
  console.log(`Số phòng Deluxe Twin khả dụng trước: ${availableBefore}`)

  // 2. Tìm và soft delete 1 phòng Deluxe Twin (VD: phòng 101)
  const roomToDeactivate = await Room.findOne({ roomNumber: '101', branch: branch._id, isDeleted: false })
  assert(roomToDeactivate, 'Phải tìm thấy phòng 101 chưa bị xóa')

  await managerService.deactivateRoom(roomToDeactivate._id, branch._id)
  console.log(`-> Đã deactivate phòng ${roomToDeactivate.roomNumber} (soft delete)`)

  // 3. Đếm số phòng sau khi soft delete
  const availableAfter = await bookingService.countAvailableRooms(deluxeTwinRT._id, branch._id, checkIn, checkOut)
  console.log(`Số phòng Deluxe Twin khả dụng sau: ${availableAfter}`)

  assert(availableBefore - availableAfter === 1, 'Số phòng khả dụng phải giảm đi đúng 1')

  // 4. Kiểm tra xem getRooms có bỏ qua phòng này không
  const activeRooms = await managerService.getRooms({}, branch._id)
  const isFound = activeRooms.some(r => r.roomNumber === '101')
  assert(!isFound, 'Phòng 101 không được xuất hiện trong danh sách active rooms')
  console.log('✅ Pass: Soft delete hoạt động chính xác và đồng bộ với bookingService')


  // =========================================================================
  // 6. Kiểm tra Ràng buộc Ngưng hoạt động (deactivate) RoomType
  // =========================================================================
  console.log('\n--- Test 6: Ràng buộc deactive RoomType ---')

  // Thử ngưng hoạt động Deluxe Twin khi vẫn còn phòng vật lý đang hoạt động thuộc loại này
  try {
    await managerService.updateRoomTypeStatus(deluxeTwinRT._id, 'inactive', branch._id)
    assert(false, 'Ngưng hoạt động RoomType khi còn phòng đang hoạt động phải lỗi')
  } catch (err) {
    assert(err.message.includes('phòng đang dùng'), 'Lỗi phải trả về đúng thông báo chặn')
    console.log('✅ Pass: Chặn ngưng hoạt động RoomType thành công khi còn phòng vật lý')
  }

  // =========================================================================
  // 7. Cleanup & Restore Database
  // =========================================================================
  console.log('\n--- Test 7: Phục hồi cơ sở dữ liệu ---')
  await mongoose.disconnect()
  console.log('🔌 Đã ngắt kết nối test DB')
  
  console.log('🔄 Đang chạy seed lại dữ liệu để trả DB về trạng thái sạch...')
  execSync('npm run seed', { stdio: 'inherit' })
  console.log('✅ Phục hồi cơ sở dữ liệu hoàn tất')

  console.log('\n🎉 TOÀN BỘ CÁC BÀI TEST ĐÃ VƯỢT QUA THÀNH CÔNG! 🎉')
}

runTests().catch(err => {
  console.error('\n❌ PHÁT SINH LỖI KHI CHẠY TEST:', err.message)
  process.exit(1)
})
