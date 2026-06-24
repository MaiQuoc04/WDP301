const bcrypt = require('bcryptjs')
const Branch = require('../models/branchModel')
const Account = require('../models/accountModel')
const Employee = require('../models/employeeModel')
const RoleAssignment = require('../models/roleAssignmentModel')
const Customer = require('../models/customerModel')
const Booking = require('../models/bookingModel')
const Room = require('../models/roomModel')
const HousekeepingTask = require('../models/housekeepingTaskModel')



// --- BRANCH MANAGEMENT ---

exports.createBranch = async (data) => {
  const branch = new Branch(data)
  await branch.save()
  return branch
}

exports.getBranches = async () => {
  return await Branch.find().sort({ createdAt: -1 })
}

exports.updateBranch = async (id, data) => {
  const branch = await Branch.findByIdAndUpdate(id, data, { new: true, runValidators: true })
  if (!branch) throw { status: 404, message: 'Không tìm thấy chi nhánh' }
  return branch
}

exports.toggleBranchActive = async (id) => {
  const branch = await Branch.findById(id)
  if (!branch) throw { status: 404, message: 'Không tìm thấy chi nhánh' }
  branch.isActive = !branch.isActive
  await branch.save()
  return branch
}

// --- STAFF & ACCOUNT MANAGEMENT ---

exports.createStaff = async (payload) => {
  const { email, password, fullName, phone, gender, role, branchId } = payload

  // 1. Kiểm tra email
  const existingAccount = await Account.findOne({ email })
  if (existingAccount) throw { status: 400, message: 'Email đã tồn tại' }

  // 2. Tạo Account (has password)
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password, salt)

  const account = new Account({
    email,
    password: hashedPassword,
    role,
    isVerified: true // Staff do admin tạo mặc định là đã verify
  })
  await account.save()

  // 3. Tạo Employee profile
  const employee = new Employee({
    account: account._id,
    fullName,
    phone,
    gender
  })
  await employee.save()

  // 4. Gán branch (nếu có, và không phải super_admin)
  let assignment = null
  if (branchId && role !== 'super_admin') {
    // Kiểm tra branch tồn tại
    const branch = await Branch.findById(branchId)
    if (!branch) throw { status: 400, message: 'Chi nhánh không hợp lệ' }

    assignment = new RoleAssignment({
      account: account._id,
      branch: branchId,
      role
    })
    await assignment.save()
  }

  return { account, employee, assignment }
}

exports.getAllStaff = async () => {
  // Lấy tất cả Employee (populate account), bỏ qua password
  const employees = await Employee.find().populate('account', '-password -otp')
  
  // Lấy các role assignment để match với nhân viên
  const assignments = await RoleAssignment.find().populate('branch', 'name code')

  // Gắn assignment vào nhân viên để trả về FE cho dễ hiển thị
  const result = employees.map(emp => {
    const empObj = emp.toObject()
    empObj.assignments = assignments.filter(a => a.account.toString() === emp.account._id.toString())
    return empObj
  })

  return result
}

exports.toggleAccountActive = async (id) => {
  const account = await Account.findById(id)
  if (!account) throw { status: 404, message: 'Không tìm thấy tài khoản' }
  // Chỉ super_admin có quyền này, nhưng tránh tự khoá chính mình (nếu cần có thể add logic)
  account.isActive = !account.isActive
  await account.save()
  return account
}

exports.updateStaffRole = async (accountId, newRole) => {
  const account = await Account.findById(accountId)
  if (!account) throw { status: 404, message: 'Không tìm thấy tài khoản' }
  if (account.role === 'super_admin') throw { status: 400, message: 'Không thể thay đổi vai trò của Super Admin' }

  account.role = newRole
  await account.save()

  // Đồng bộ trường role trong RoleAssignment
  await RoleAssignment.updateMany(
    { account: accountId },
    { role: newRole }
  )

  return account
}

exports.assignBranchToStaff = async (accountId, branchId) => {
  const account = await Account.findById(accountId)
  if (!account) throw { status: 404, message: 'Không tìm thấy tài khoản' }
  if (account.role === 'super_admin') throw { status: 400, message: 'Super Admin không cần gán chi nhánh' }
  if (account.role === 'customer') throw { status: 400, message: 'Khách hàng không thể gán vào chi nhánh' }

  const branch = await Branch.findById(branchId)
  if (!branch) throw { status: 400, message: 'Chi nhánh không hợp lệ' }

  // Kiểm tra xem đã gán chi nhánh nào chưa (1 người chỉ được làm 1 chi nhánh)
  const existing = await RoleAssignment.findOne({
    account: accountId
  })

  if (existing) {
    existing.branch = branchId
    if (existing.role !== account.role) {
      existing.role = account.role
    }
    if (!existing.isActive) {
      existing.isActive = true
    }
    await existing.save()
    return existing
  }

  const assignment = new RoleAssignment({
    account: accountId,
    branch: branchId,
    role: account.role
  })
  await assignment.save()
  return assignment
}

exports.removeBranchFromStaff = async (assignmentId) => {
  const assignment = await RoleAssignment.findById(assignmentId)
  if (!assignment) throw { status: 404, message: 'Không tìm thấy bản ghi phân công' }

  await RoleAssignment.findByIdAndDelete(assignmentId)
  return { _id: assignmentId, message: 'Đã gỡ nhân viên khỏi chi nhánh' }
}

exports.getAllAccounts = async (roleFilter) => {
  let query = {}
  if (roleFilter) {
    query.role = roleFilter
  }

  // Lấy danh sách Account
  const accounts = await Account.find(query, '-password -otp').sort({ createdAt: -1 })

  // Lấy chi tiết Employee hoặc Customer tương ứng
  const result = await Promise.all(accounts.map(async (acc) => {
    const accObj = acc.toObject()
    if (acc.role === 'customer') {
      const customer = await Customer.findOne({ account: acc._id })
      accObj.profile = customer || null
    } else {
      const employee = await Employee.findOne({ account: acc._id })
      accObj.profile = employee || null
      // Tìm assignments
      const assignments = await RoleAssignment.find({ account: acc._id }).populate('branch', 'name code')
      accObj.assignments = assignments
    }
    return accObj
  }))

  return result
}

exports.getDashboardStats = async () => {
  const activeBranchesCount = await Branch.countDocuments({ isActive: true })

  // 1. Doanh thu theo chi nhánh
  const revenue = await Booking.aggregate([
    { $match: { status: { $in: ['completed', 'checked_out'] } } },
    { $group: { _id: '$branch', total: { $sum: '$totalAmount' } } },
    { $lookup: { from: 'branches', localField: '_id', foreignField: '_id', as: 'branchInfo' } },
    { $unwind: { path: '$branchInfo', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        total: 1,
        name: { $ifNull: ['$branchInfo.name', 'Chi nhánh khác'] },
        code: { $ifNull: ['$branchInfo.code', 'OTHER'] }
      }
    }
  ])

  // 2. Tỷ lệ lấp đầy phòng theo chi nhánh
  const roomStats = await Room.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: '$branch',
        total: { $sum: 1 },
        occupied: { $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] } }
      }
    },
    { $lookup: { from: 'branches', localField: '_id', foreignField: '_id', as: 'branchInfo' } },
    { $unwind: { path: '$branchInfo', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        totalRooms: '$total',
        occupiedRooms: '$occupied',
        name: { $ifNull: ['$branchInfo.name', 'Chi nhánh khác'] },
        code: { $ifNull: ['$branchInfo.code', 'OTHER'] },
        occupancyRate: {
          $cond: [
            { $gt: ['$total', 0] },
            { $round: [{ $multiply: [{ $divide: ['$occupied', '$total'] }, 100] }] },
            0
          ]
        }
      }
    }
  ])

  // 3. Xu hướng đặt phòng 6 tháng
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)
  sixMonthsAgo.setHours(0, 0, 0, 0)

  const trend = await Booking.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo }, status: { $ne: 'cancelled' } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ])

  const trendList = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const month = d.getMonth() + 1
    const year = d.getFullYear()

    const found = trend.find(t => t._id.month === month && t._id.year === year)
    trendList.push({
      label: `${String(month).padStart(2, '0')}/${year}`,
      count: found ? found.count : 0
    })
  }

  // 4. Housekeeping Missed Rate theo chi nhánh
  const housekeepingStats = await HousekeepingTask.aggregate([
    {
      $group: {
        _id: '$branch',
        total: { $sum: 1 },
        missed: { $sum: { $cond: [{ $eq: ['$status', 'missed'] }, 1, 0] } }
      }
    },
    { $lookup: { from: 'branches', localField: '_id', foreignField: '_id', as: 'branchInfo' } },
    { $unwind: { path: '$branchInfo', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        totalTasks: '$total',
        missedTasks: '$missed',
        name: { $ifNull: ['$branchInfo.name', 'Chi nhánh khác'] },
        code: { $ifNull: ['$branchInfo.code', 'OTHER'] },
        missedRate: {
          $cond: [
            { $gt: ['$total', 0] },
            { $round: [{ $multiply: [{ $divide: ['$missed', '$total'] }, 100] }] },
            0
          ]
        }
      }
    }
  ])

  // 5. Thống kê tổng hợp (Summary)
  const totalRevenueResult = await Booking.aggregate([
    { $match: { status: { $in: ['completed', 'checked_out'] } } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ])
  const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0

  const totalRoomsCount = roomStats.reduce((acc, curr) => acc + curr.totalRooms, 0)
  const occupiedRoomsCount = roomStats.reduce((acc, curr) => acc + curr.occupiedRooms, 0)
  const averageOccupancy = totalRoomsCount > 0 ? Math.round((occupiedRoomsCount / totalRoomsCount) * 100) : 0

  const totalTasksCount = housekeepingStats.reduce((acc, curr) => acc + curr.totalTasks, 0)
  const missedTasksCount = housekeepingStats.reduce((acc, curr) => acc + curr.missedTasks, 0)
  const averageMissedRate = totalTasksCount > 0 ? Math.round((missedTasksCount / totalTasksCount) * 100) : 0

  return {
    summary: {
      totalBranches: activeBranchesCount,
      totalRevenue,
      averageOccupancy,
      averageMissedRate
    },
    revenueByBranch: revenue,
    occupancyByBranch: roomStats,
    monthlyBookingTrend: trendList,
    housekeepingKPI: housekeepingStats
  }
}

exports.getBranchDashboard = async (branchId) => {
  const mongoose = require('mongoose')
  const branchObjId = new mongoose.Types.ObjectId(branchId)

  // Kiểm tra branch tồn tại
  const branch = await Branch.findById(branchId)
  if (!branch) throw { status: 404, message: 'Không tìm thấy chi nhánh' }

  // 1. Doanh thu của chi nhánh này
  const totalRevenueResult = await Booking.aggregate([
    { $match: { branch: branchObjId, status: { $in: ['completed', 'checked_out'] } } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ])
  const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0

  // 2. Tỷ lệ lấp đầy phòng của chi nhánh này
  const roomStats = await Room.aggregate([
    { $match: { branch: branchObjId, isDeleted: false } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        occupied: { $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] } }
      }
    }
  ])
  const totalRooms = roomStats.length > 0 ? roomStats[0].total : 0
  const occupiedRooms = roomStats.length > 0 ? roomStats[0].occupied : 0
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0

  // 3. Xu hướng đặt phòng 6 tháng của chi nhánh này
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)
  sixMonthsAgo.setHours(0, 0, 0, 0)

  const trend = await Booking.aggregate([
    { $match: { branch: branchObjId, createdAt: { $gte: sixMonthsAgo }, status: { $ne: 'cancelled' } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ])

  const trendList = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const month = d.getMonth() + 1
    const year = d.getFullYear()

    const found = trend.find(t => t._id.month === month && t._id.year === year)
    trendList.push({
      label: `${String(month).padStart(2, '0')}/${year}`,
      count: found ? found.count : 0
    })
  }

  // 4. Housekeeping Missed Rate của chi nhánh này
  const housekeepingStats = await HousekeepingTask.aggregate([
    { $match: { branch: branchObjId } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        missed: { $sum: { $cond: [{ $eq: ['$status', 'missed'] }, 1, 0] } }
      }
    }
  ])
  const totalTasks = housekeepingStats.length > 0 ? housekeepingStats[0].total : 0
  const missedTasks = housekeepingStats.length > 0 ? housekeepingStats[0].missed : 0
  const missedRate = totalTasks > 0 ? Math.round((missedTasks / totalTasks) * 100) : 0

  return {
    branch,
    summary: {
      totalRevenue,
      totalRooms,
      occupiedRooms,
      occupancyRate,
      totalTasks,
      missedTasks,
      missedRate
    },
    monthlyBookingTrend: trendList
  }
}



