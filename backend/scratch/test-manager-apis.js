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
const RoomAmenity = require('../src/models/roomAmenityModel')
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
  // 7. Kiểm tra Tiện Nghi (Amenity) & Gán Tiện Nghi cho RoomType (RoomAmenity)
  // =========================================================================
  console.log('\n--- Test 7: Tiện Nghi & RoomType-Amenity Mapping ---')

  const AmenityModel = require('../src/models/amenityModel')

  // Case 1: Tạo Amenity mới thành công
  const testAmenity = await managerService.createAmenity({
    name: 'Loa Bluetooth',
    missingPrice: 300000,
    unit: 'cái'
  }, branch._id)
  assert(testAmenity, 'Phải tạo được tiện nghi Loa Bluetooth')
  assert(testAmenity.status === 'active', 'Trạng thái mặc định phải là active')
  console.log('✅ Pass: Tạo tiện nghi mới thành công')

  // Case 2: Chặn tạo trùng tên tiện nghi trên cùng chi nhánh (Unique Index)
  try {
    await managerService.createAmenity({
      name: 'Loa Bluetooth',
      missingPrice: 400000
    }, branch._id)
    assert(false, 'Tạo tiện nghi trùng tên trong chi nhánh phải lỗi')
  } catch (err) {
    assert(err.message.includes('đã tồn tại') || err.code === 11000, 'Lỗi phải trả về đúng thông báo trùng hoặc trùng index')
    console.log('✅ Pass: Chặn tạo tiện nghi trùng tên thành công')
  }

  // Case 3: Gán danh sách tiện nghi cho RoomType (Replace/Ghi đè)
  const seededAmenities = await managerService.getAmenityOptions(branch._id)
  const amenityIds = seededAmenities.slice(0, 3).map(a => a._id.toString()) // 3 tiện nghi đầu

  const updatedRtAmenities = await managerService.updateRoomTypeAmenities(standardRT._id, amenityIds, branch._id)
  assert(updatedRtAmenities.length === 3, 'Danh sách tiện nghi sau khi gán phải đúng bằng 3')
  
  // Kiểm tra duplicate id trong input gán tiện nghi (Deduplicate)
  const dupInputIds = [...amenityIds, amenityIds[0], amenityIds[0]]
  const deduplicatedAmenities = await managerService.updateRoomTypeAmenities(standardRT._id, dupInputIds, branch._id)
  assert(deduplicatedAmenities.length === 3, 'Deduplicate: Gán danh sách chứa phần tử trùng lặp phải được loại bỏ tự động')
  console.log('✅ Pass: Gán tiện nghi cho RoomType thành công với cơ chế ghi đè & deduplicate')

  // Case 4: Chặn gán tiện nghi khác chi nhánh (Branch Isolation)
  const otherBranchId = new mongoose.Types.ObjectId()
  const otherAmenity = await AmenityModel.create({
    branch: otherBranchId,
    name: 'Tủ Lạnh DN01',
    missingPrice: 1000000,
    unit: 'cái',
    status: 'active'
  })
  
  try {
    await managerService.updateRoomTypeAmenities(standardRT._id, [otherAmenity._id.toString()], branch._id)
    assert(false, 'Gán tiện nghi thuộc chi nhánh khác phải lỗi')
  } catch (err) {
    assert(err.message.includes('không thuộc chi nhánh này'), 'Lỗi phải trả về đúng thông báo chặn')
    console.log('✅ Pass: Chặn gán tiện nghi khác chi nhánh thành công')
  }

  // Case 5: Deactivate Amenity & Tự động gỡ khỏi RoomType & RoomAmenity
  const standardAmBefore = await managerService.getRoomTypeAmenities(standardRT._id, branch._id)
  const amToDeactivate = standardAmBefore[0]

  await managerService.deactivateAmenity(amToDeactivate._id, branch._id)
  console.log(`-> Đã deactivate tiện nghi "${amToDeactivate.name}"`)

  const standardAmAfter = await managerService.getRoomTypeAmenities(standardRT._id, branch._id)
  const isStillLinked = standardAmAfter.some(a => a._id.toString() === amToDeactivate._id.toString())
  assert(!isStillLinked, 'Tiện nghi đã deactivate phải được tự động gỡ khỏi RoomType')

  const activeOptions = await managerService.getAmenityOptions(branch._id)
  const isOptionVisible = activeOptions.some(a => a._id.toString() === amToDeactivate._id.toString())
  assert(!isOptionVisible, 'Tiện nghi bị deactive không được hiển thị trong options dropdown')

  // Xác minh đã gỡ sạch khỏi RoomAmenity vật lý của các phòng
  const physicalRoomAmCount = await RoomAmenity.countDocuments({ amenity: amToDeactivate._id })
  assert(physicalRoomAmCount === 0, 'Tất cả RoomAmenity liên quan phải bị xóa khi deactivate')

  console.log('✅ Pass: Deactivate tiện nghi tự động gỡ khỏi RoomType, RoomAmenity và ẩn khỏi dropdown thành công')


  // =========================================================================
  // 8. Kiểm tra Dịch vụ (Service CRUD - UC66→68) & Branch Isolation
  // =========================================================================
  console.log('\n--- Test 8: Dịch Vụ (Service CRUD) & Branch Isolation ---')

  // Case 1: Tạo mới dịch vụ thành công
  const testService = await managerService.createService({
    name: 'Dịch vụ Ủi đồ',
    price: 45000,
    description: 'Giặt ủi là nhanh'
  }, branch._id)
  assert(testService, 'Phải tạo được dịch vụ mới')
  assert(testService.status === 'active', 'Trạng thái mặc định phải là active')
  console.log('✅ Pass: Tạo dịch vụ mới thành công')

  // Case 2: Xem chi tiết dịch vụ
  const serviceDetail = await managerService.getServiceById(testService._id, branch._id)
  assert(serviceDetail, 'Phải lấy được chi tiết dịch vụ')
  assert(serviceDetail.name === 'Dịch vụ Ủi đồ', 'Tên dịch vụ chi tiết phải khớp')
  console.log('✅ Pass: Lấy chi tiết dịch vụ thành công')

  // Case 3: Chặn tạo trùng tên dịch vụ (lỗi E11000 index hoặc check trong service)
  // Phải trả về thông báo nghiệp vụ rõ ràng
  try {
    await managerService.createService({
      name: 'Dịch vụ Ủi đồ',
      price: 60000
    }, branch._id)
    assert(false, 'Tạo trùng tên dịch vụ phải báo lỗi')
  } catch (err) {
    assert(err.message === 'Dịch vụ đã tồn tại trong chi nhánh', 'Lỗi trả về phải là "Dịch vụ đã tồn tại trong chi nhánh"')
    console.log('✅ Pass: Chặn trùng tên dịch vụ với message nghiệp vụ rõ ràng')
  }

  // Case 4: Cập nhật thông tin dịch vụ
  const updatedService = await managerService.updateService(testService._id, {
    price: 50000,
    description: 'Giặt ủi là nhanh siêu sạch'
  }, branch._id)
  assert(updatedService.price === 50000, 'Giá dịch vụ sau khi update phải là 50000')
  console.log('✅ Pass: Cập nhật dịch vụ thành công')

  // Case 5: Chặn cập nhật giá trị âm / không hợp lệ
  try {
    await managerService.updateService(testService._id, {
      price: -100
    }, branch._id)
    assert(false, 'Cập nhật giá âm phải báo lỗi')
  } catch (err) {
    assert(err.message.includes('lớn hơn 0'), 'Lỗi trả về phải báo giá lớn hơn 0')
    console.log('✅ Pass: Chặn cập nhật giá trị không hợp lệ')
  }

  // Case 6: Deactivate và kiểm tra dropdown options loại trừ
  await managerService.deactivateService(testService._id, branch._id)
  const serviceOptions = await managerService.getServiceOptions(branch._id)
  const isSvcInOptions = serviceOptions.some(s => s._id.toString() === testService._id.toString())
  assert(!isSvcInOptions, 'Dịch vụ đã deactivate không được xuất hiện trong dropdown options')
  console.log('✅ Pass: Dịch vụ deactivate đã bị ẩn khỏi dropdown options')


  // Kiểm tra sort dropdown options theo name tăng dần
  let isSorted = true
  for (let i = 0; i < serviceOptions.length - 1; i++) {
    if (serviceOptions[i].name.localeCompare(serviceOptions[i+1].name) > 0) {
      isSorted = false
      break
    }
  }
  assert(isSorted, 'Danh sách dropdown options phải được sắp xếp theo tên (A-Z)')
  console.log('✅ Pass: Dropdown options dịch vụ được sắp xếp tăng dần theo tên')

  // Case 7: Branch Isolation
  const diffBranchId = new mongoose.Types.ObjectId()
  
  // Thử cập nhật dịch vụ của HN01 bằng branchId khác
  try {
    await managerService.updateService(testService._id, { price: 90000 }, diffBranchId)
    assert(false, 'Manager chi nhánh khác không được phép cập nhật dịch vụ')
  } catch (err) {
    assert(err.message.includes('không tồn tại'), 'Lỗi trả về phải là không tồn tại dịch vụ (404)')
    console.log('✅ Pass: Chặn cập nhật dịch vụ từ chi nhánh khác')
  }

  // Thử deactivate dịch vụ của HN01 bằng branchId khác
  try {
    await managerService.deactivateService(testService._id, diffBranchId)
    assert(false, 'Manager chi nhánh khác không được phép deactivate dịch vụ')
  } catch (err) {
    assert(err.message.includes('không tồn tại'), 'Lỗi trả về phải là không tồn tại dịch vụ (404)')
    console.log('✅ Pass: Chặn deactivate dịch vụ từ chi nhánh khác')
  }

  // =========================================================================
  // 9. Kiểm tra Sự Cố Phòng (Room Issue - UC70) & Branch Isolation
  // =========================================================================
  console.log('\n--- Test 9: Sự Cố Phòng (Room Issue - UC70) & Branch Isolation ---')

  const RoomIssue = require('../src/models/roomIssueModel')

  // Lấy phòng 201 đang available
  const room201 = await Room.findOne({ roomNumber: '201', branch: branch._id })
  assert(room201, 'Phòng 201 phải tồn tại')
  assert(room201.status === 'available', 'Phòng 201 ban đầu phải ở trạng thái available')

  // Case 1: Tạo mới sự cố và xác minh trạng thái phòng chuyển sang maintenance
  const issueA = await managerService.createRoomIssue({
    room: room201._id,
    description: 'Hỏng vòi hoa sen',
    severity: 'medium'
  }, branch._id, managerAcc._id)

  assert(issueA, 'Phải tạo thành công sự cố A')
  assert(issueA.status === 'open', 'Trạng thái sự cố A mới tạo phải là open')
  assert(issueA.severity === 'medium', 'Mức độ nghiêm trọng phải là medium')

  const room201AfterA = await Room.findById(room201._id)
  assert(room201AfterA.status === 'maintenance', 'Phòng 201 phải tự động chuyển sang maintenance')
  console.log('✅ Pass: Tạo sự cố mới tự động chuyển trạng thái phòng sang maintenance')

  // Case 2: Tạo thêm sự cố B trên cùng phòng 201 (Multiple Open Issues)
  const issueB = await managerService.createRoomIssue({
    room: room201._id,
    description: 'Điều hòa không lạnh',
    severity: 'high'
  }, branch._id, managerAcc._id)

  assert(issueB, 'Phải tạo thành công sự cố B')
  
  // Resolve sự cố A → Xác minh phòng vẫn ở trạng thái maintenance vì sự cố B vẫn đang open
  await managerService.resolveRoomIssue(issueA._id, {
    resolutionNote: 'Đã thay vòi hoa sen mới'
  }, branch._id, managerAcc._id)

  const room201AfterResolveA = await Room.findById(room201._id)
  assert(room201AfterResolveA.status === 'maintenance', 'Phòng 201 vẫn phải là maintenance do sự cố B còn mở')
  console.log('✅ Pass: Giải quyết 1 sự cố khi vẫn còn sự cố khác mở, phòng vẫn giữ trạng thái maintenance')

  // Case 3: Chặn giải quyết sự cố đã xử lý (Validation)
  try {
    await managerService.resolveRoomIssue(issueA._id, {
      resolutionNote: 'Resolve lại lần nữa'
    }, branch._id, managerAcc._id)
    assert(false, 'Resolve sự cố đã giải quyết phải báo lỗi')
  } catch (err) {
    assert(err.message === 'Sự cố đã được xử lý', 'Thông báo lỗi phải là "Sự cố đã được xử lý"')
    console.log('✅ Pass: Chặn resolve sự cố đã được đóng từ trước thành công')
  }

  // Case 4: Lấy danh sách sự cố và lọc theo open/resolved
  const openIssues = await managerService.getRoomIssues(branch._id, { status: 'open' })
  assert(openIssues.length > 0, 'Danh sách sự cố open phải chứa ít nhất 1 phần tử (sự cố B)')
  assert(openIssues.every(i => i.status === 'open'), 'Tất cả các sự cố trong danh sách open phải có status là open')

  const resolvedIssues = await managerService.getRoomIssues(branch._id, { status: 'resolved' })
  assert(resolvedIssues.length > 0, 'Danh sách sự cố resolved phải chứa ít nhất 1 phần tử (sự cố A)')
  assert(resolvedIssues.every(i => i.status === 'resolved'), 'Tất cả các sự cố trong danh sách resolved phải có status là resolved')
  console.log('✅ Pass: Lấy danh sách sự cố phòng và áp dụng bộ lọc thành công')

  // Case 5: Branch Isolation khi Xem chi tiết / Xử lý sự cố
  const diffBranchId2 = new mongoose.Types.ObjectId()
  
  // Xem chi tiết sự cố của HN01 bằng branchId khác phải lỗi 404
  try {
    await managerService.getRoomIssueById(issueB._id, diffBranchId2)
    assert(false, 'Xem chi tiết sự cố của chi nhánh khác phải lỗi')
  } catch (err) {
    assert(err.message.includes('không tồn tại'), 'Lỗi trả về phải báo sự cố không tồn tại (404)')
    console.log('✅ Pass: Chặn xem chi tiết sự cố của chi nhánh khác')
  }

  // Xử lý sự cố của HN01 bằng branchId khác phải lỗi 404
  try {
    await managerService.resolveRoomIssue(issueB._id, {
      resolutionNote: 'Hack resolve'
    }, diffBranchId2, managerAcc._id)
    assert(false, 'Xử lý sự cố của chi nhánh khác phải lỗi')
  } catch (err) {
    assert(err.message.includes('không tồn tại'), 'Lỗi trả về phải báo sự cố không tồn tại (404)')
    console.log('✅ Pass: Chặn giải quyết sự cố của chi nhánh khác')
  }

  // Case 6: Giải quyết sự cố B (sự cố cuối cùng) → Xác minh phòng trở lại trạng thái available
  await managerService.resolveRoomIssue(issueB._id, {
    resolutionNote: 'Đã sửa quạt gió điều hòa và nạp ga'
  }, branch._id, managerAcc._id)

  const room201AfterResolveB = await Room.findById(room201._id)
  assert(room201AfterResolveB.status === 'available', 'Phòng 201 phải tự động chuyển lại thành available khi hết sự cố open')
  console.log('✅ Pass: Giải quyết sự cố cuối cùng, phòng khôi phục trạng thái available thành công')

  // Case 7: Báo sự cố trên phòng occupied không ghi đè trạng thái occupied
  const room102 = await Room.findOne({ roomNumber: '102', branch: branch._id })
  assert(room102, 'Phòng 102 phải tồn tại')
  // Giả lập phòng 102 đang occupied
  room102.status = 'occupied'
  await room102.save()

  const issueC = await managerService.createRoomIssue({
    room: room102._id,
    description: 'Tivi bị sọc màn hình',
    severity: 'low'
  }, branch._id, managerAcc._id)

  const room102AfterC = await Room.findById(room102._id)
  assert(room102AfterC.status === 'occupied', 'Trạng thái phòng occupied phải được giữ nguyên không ghi đè')

  // Resolve sự cố C
  await managerService.resolveRoomIssue(issueC._id, {
    resolutionNote: 'Đã thay tivi mới'
  }, branch._id, managerAcc._id)

  const room102AfterResolveC = await Room.findById(room102._id)
  assert(room102AfterResolveC.status === 'occupied', 'Giải quyết sự cố xong phòng vẫn phải giữ nguyên trạng thái occupied')
  console.log('✅ Pass: Báo sự cố và giải quyết sự cố trên phòng occupied không ghi đè trạng thái occupied')

  // =========================================================================
  // 10. Kiểm tra Giám Sát Hoạt Động Buồng Phòng (Monitor Housekeeping - UC69)
  // =========================================================================
  console.log('\n--- Test 10: Giám Sát Hoạt Động Buồng Phòng (Monitor Housekeeping - UC69) ---')

  const HousekeepingTask = require('../src/models/housekeepingTaskModel')
  const RoleAssignment = require('../src/models/roleAssignmentModel')

  const housekeeperAcc = await Account.findOne({ email: 'housekeeper@hbms.com' })
  assert(housekeeperAcc, 'Tài khoản housekeeper phải tồn tại')

  const receptionistAcc = await Account.findOne({ email: 'receptionist@hbms.com' })
  assert(receptionistAcc, 'Tài khoản receptionist phải tồn tại')

  // Giả lập tạo 1 task dọn dẹp cho phòng 202
  const room202 = await Room.findOne({ roomNumber: '202', branch: branch._id })
  const taskA = await HousekeepingTask.create({
    branch: branch._id,
    room: room202._id,
    status: 'pending',
    isUrgent: false
  })
  assert(taskA, 'Phải tạo thành công task dọn phòng A')

  // Case 1: Xem chi tiết task dọn phòng
  const taskDetail = await managerService.getHousekeepingTaskById(taskA._id, branch._id)
  assert(taskDetail, 'Phải lấy được chi tiết task dọn phòng')
  assert(taskDetail.room.roomNumber === '202', 'Số phòng trong chi tiết phải là 202')
  console.log('✅ Pass: Lấy chi tiết task dọn phòng thành công')

  // Case 2: Phân công task dọn phòng cho housekeeper chi nhánh (HK-A)
  const assignedTaskA = await managerService.assignHousekeepingTask(taskA._id, housekeeperAcc._id, branch._id, managerAcc._id)
  assert(assignedTaskA.assignedTo.toString() === housekeeperAcc._id.toString(), 'Phân công dọn phòng cho housekeeperAcc phải thành công')
  assert(assignedTaskA.assignedBy.toString() === managerAcc._id.toString(), 'Người phân công phải là managerAcc')
  assert(assignedTaskA.assignedAt instanceof Date, 'Thời gian phân công phải được lưu nhận')
  console.log('✅ Pass: Phân công task dọn phòng thành công cho housekeeper hợp lệ')

  // Case 3: Reassignment Test (Option A - chuyển từ HK-A sang housekeeper mới)
  // Tạo 1 housekeeper mới trong cùng chi nhánh
  const newHKAcc = await Account.create({
    email: 'newhk@hbms.com',
    password: 'Password@123',
    role: 'housekeeper',
    isVerified: true,
    isActive: true
  })
  await RoleAssignment.create({
    account: newHKAcc._id,
    branch: branch._id,
    role: 'housekeeper',
    isActive: true
  })

  const reassignedTask = await managerService.assignHousekeepingTask(taskA._id, newHKAcc._id, branch._id, managerAcc._id)
  assert(reassignedTask.assignedTo.toString() === newHKAcc._id.toString(), 'Reassignment: Phải chuyển sang housekeeper mới thành công')
  console.log('✅ Pass: Phân công lại (reassign) cho housekeeper khác thành công')

  // Case 4: Chặn phân công cho housekeeper thuộc chi nhánh khác hoặc nhân viên role khác
  // Phân công cho receptionist (sai role) -> phải báo lỗi
  try {
    await managerService.assignHousekeepingTask(taskA._id, receptionistAcc._id, branch._id, managerAcc._id)
    assert(false, 'Phân công cho nhân viên sai role phải báo lỗi')
  } catch (err) {
    assert(err.message.includes('không hợp lệ'), 'Lỗi trả về phải là housekeeper không hợp lệ')
    console.log('✅ Pass: Chặn phân công cho nhân viên sai role thành công')
  }

  // Chặn phân công cho chính quản lý
  try {
    await managerService.assignHousekeepingTask(taskA._id, managerAcc._id, branch._id, managerAcc._id)
    assert(false, 'Phân công cho chính quản lý phải báo lỗi')
  } catch (err) {
    assert(err.message.includes('cho quản lý'), 'Lỗi trả về phải là không thể phân công cho quản lý')
    console.log('✅ Pass: Chặn phân công cho chính quản lý thành công')
  }

  // Case 5: Chặn phân công cho task đã kết thúc (completed/missed)
  taskA.status = 'completed'
  await taskA.save()

  try {
    await managerService.assignHousekeepingTask(taskA._id, housekeeperAcc._id, branch._id, managerAcc._id)
    assert(false, 'Phân công cho task completed phải báo lỗi')
  } catch (err) {
    assert(err.message.includes('đã kết thúc'), 'Lỗi trả về phải báo không thể phân công task đã kết thúc')
    console.log('✅ Pass: Chặn phân công cho task đã hoàn thành (completed) thành công')
  }

  // Case 6: Đánh dấu/bỏ đánh dấu khẩn cấp cho task dọn phòng và kiểm tra sắp xếp
  // Tạo 2 task mới: task B (bình thường), task C (bình thường)
  const room203 = await Room.findOne({ roomNumber: '203', branch: branch._id })
  const taskB = await HousekeepingTask.create({ branch: branch._id, room: room203._id, status: 'pending', isUrgent: false })

  const room204 = await Room.findOne({ roomNumber: '204', branch: branch._id })
  const taskC = await HousekeepingTask.create({ branch: branch._id, room: room204._id, status: 'pending', isUrgent: false })

  // Đánh dấu task C khẩn cấp
  const urgentTaskC = await managerService.markHousekeepingTaskUrgent(taskC._id, branch._id)
  assert(urgentTaskC.isUrgent === true, 'Task C phải được đánh dấu isUrgent = true')

  // Lấy danh sách task và kiểm tra sort (task C phải đứng đầu vì isUrgent = true)
  const tasksList = await managerService.getHousekeepingTasks(branch._id)
  assert(tasksList[0]._id.toString() === taskC._id.toString(), 'Task C (khẩn cấp) phải nằm ở vị trí đầu tiên trong danh sách')
  console.log('✅ Pass: Đánh dấu khẩn cấp (isUrgent) và sắp xếp thứ tự chính xác')

  // Bỏ đánh dấu khẩn cấp task C
  const normalTaskC = await managerService.markHousekeepingTaskUrgent(taskC._id, branch._id)
  assert(normalTaskC.isUrgent === false, 'Task C phải được khôi phục isUrgent = false')
  console.log('✅ Pass: Bỏ đánh dấu khẩn cấp thành công')

  // Case 7: Branch Isolation
  const otherBranchId3 = new mongoose.Types.ObjectId()
  
  // Xem chi tiết task của chi nhánh khác phải lỗi 404
  try {
    await managerService.getHousekeepingTaskById(taskB._id, otherBranchId3)
    assert(false, 'Xem chi tiết task dọn dẹp của chi nhánh khác phải lỗi')
  } catch (err) {
    assert(err.message.includes('không tồn tại'), 'Lỗi trả về phải báo không tồn tại (404)')
    console.log('✅ Pass: Chặn xem chi tiết task của chi nhánh khác')
  }

  // Phân công task của chi nhánh khác phải lỗi 404
  try {
    await managerService.assignHousekeepingTask(taskB._id, housekeeperAcc._id, otherBranchId3, managerAcc._id)
    assert(false, 'Phân công task dọn dẹp của chi nhánh khác phải lỗi')
  } catch (err) {
    assert(err.message.includes('không tồn tại'), 'Lỗi trả về phải báo không tồn tại (404)')
    console.log('✅ Pass: Chặn phân công task của chi nhánh khác')
  }

  // Đổi trạng thái khẩn cấp task của chi nhánh khác phải lỗi 404
  try {
    await managerService.markHousekeepingTaskUrgent(taskB._id, otherBranchId3)
    assert(false, 'Đổi khẩn cấp task dọn dẹp của chi nhánh khác phải lỗi')
  } catch (err) {
    assert(err.message.includes('không tồn tại'), 'Lỗi trả về phải báo không tồn tại (404)')
    console.log('✅ Pass: Chặn đổi độ khẩn cấp task của chi nhánh khác')
  }

  // Xóa tài khoản newHKAcc để tránh rác DB
  await Account.deleteOne({ _id: newHKAcc._id })
  await RoleAssignment.deleteOne({ account: newHKAcc._id })

  // =========================================================================
  // 11. Cleanup & Restore Database
  // =========================================================================
  console.log('\n--- Test 11: Phục hồi cơ sở dữ liệu ---')
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


