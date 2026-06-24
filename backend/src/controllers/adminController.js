const adminService = require('../services/adminService')

// Wrapper để bắt lỗi đồng bộ
const handle = (fn, okCode = 200) => async (req, res) => {
  try {
    const result = await fn(req)
    res.status(okCode).json({ success: true, data: result })
  } catch (err) {
    console.error('Admin API Error:', err)
    res.status(err.status || 400).json({ success: false, message: err.message || 'Lỗi server' })
  }
}

// --- BRANCH CONTROLLERS ---

exports.createBranch = handle((req) => adminService.createBranch(req.body), 201)
exports.getBranches = handle((req) => adminService.getBranches())
exports.updateBranch = handle((req) => adminService.updateBranch(req.params.id, req.body))
exports.toggleBranchActive = handle((req) => adminService.toggleBranchActive(req.params.id))

// --- STAFF & ACCOUNT CONTROLLERS ---

exports.createStaff = handle((req) => adminService.createStaff(req.body), 201)
exports.getAllStaff = handle((req) => adminService.getAllStaff())
exports.toggleAccountActive = handle((req) => adminService.toggleAccountActive(req.params.id))
exports.updateStaffRole = handle((req) => adminService.updateStaffRole(req.params.id, req.body.role))
exports.assignStaffBranch = handle((req) => adminService.assignBranchToStaff(req.params.id, req.body.branchId))
exports.removeStaffBranch = handle((req) => adminService.removeBranchFromStaff(req.params.assignmentId))
exports.getAllAccounts = handle((req) => adminService.getAllAccounts(req.query.role))
exports.getDashboardStats = handle((req) => adminService.getDashboardStats())
exports.getBranchDashboard = handle((req) => adminService.getBranchDashboard(req.params.branchId))



