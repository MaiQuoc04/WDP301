// Owner: Quốc — quyền truy cập theo 2 cờ ĐỘC LẬP: Account.isActive (khoá tài khoản) & Branch.isActive (khoá chi nhánh).
// Quyền vào = tài khoản mở VÀ chi nhánh mở. Toggle chi nhánh KHÔNG đụng cờ tài khoản (mở chi nhánh không mở oan tài khoản đã khoá riêng).
const RoleAssignment = require('../models/roleAssignmentModel')
require('../models/branchModel') // cho populate

const STAFF_ROLES = ['receptionist', 'housekeeper', 'branch_manager']

// Staff bị chặn khi TẤT CẢ chi nhánh được gán đều đang khoá (thực tế mỗi staff chỉ 1 chi nhánh).
// super_admin / customer: không gán chi nhánh -> không bị chặn theo chi nhánh.
async function isBranchBlocked(accountId) {
  const assignments = await RoleAssignment.find({ account: accountId, isActive: true })
    .populate('branch', 'isActive').lean()
  if (!assignments.length) return false
  return !assignments.some((a) => a.branch && a.branch.isActive)
}

// Danh sách accountId của nhân viên (đang gán) thuộc 1 chi nhánh — để đá văng realtime khi khoá chi nhánh.
async function staffAccountIdsOfBranch(branchId) {
  const ras = await RoleAssignment.find({ branch: branchId, isActive: true }).select('account -_id').lean()
  return [...new Set(ras.map((r) => String(r.account)))]
}

module.exports = { STAFF_ROLES, isBranchBlocked, staffAccountIdsOfBranch }
