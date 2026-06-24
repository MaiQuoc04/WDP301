// Owner: Sáng — Super Admin APIs (UC-71→82)
const router = require('express').Router()
const { protect, authorize } = require('../middlewares/authMiddleware')
const adminController = require('../controllers/adminController')

router.use(protect, authorize('super_admin'))

// --- BRANCH ROUTES ---
router.post('/branches', adminController.createBranch)
router.get('/branches', adminController.getBranches)
router.put('/branches/:id', adminController.updateBranch)
router.patch('/branches/:id/deactivate', adminController.toggleBranchActive)

// --- STAFF & ACCOUNT ROUTES ---
router.post('/staff', adminController.createStaff)
router.get('/staff', adminController.getAllStaff)
router.patch('/accounts/:id/deactivate', adminController.toggleAccountActive)
router.put('/staff/:id/role', adminController.updateStaffRole)
router.post('/staff/:id/assignments', adminController.assignStaffBranch)
router.delete('/staff/assignments/:assignmentId', adminController.removeStaffBranch)
router.get('/users', adminController.getAllAccounts)
router.get('/dashboard/stats', adminController.getDashboardStats)
router.get('/dashboard/branches/:branchId', adminController.getBranchDashboard)

module.exports = router


