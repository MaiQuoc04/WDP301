// Owner: Tu - Housekeeper APIs (UC-44 -> UC-55)
const router = require('express').Router()
const { protect, authorize } = require('../middlewares/authMiddleware')
const { validateObjectId } = require('../middlewares/validateMiddleware')
const c = require('../controllers/housekeepingController')

router.use(protect, authorize('housekeeper'))

router.get('/dashboard', c.getDashboard)
router.get('/tasks', c.listTasks)
router.get('/history', c.getHistory)
router.get('/tasks/:id', validateObjectId('id'), c.getTaskDetail)
router.patch('/tasks/:id/start', validateObjectId('id'), c.startTask)
router.put('/tasks/:id/amenity-report', validateObjectId('id'), c.saveAmenityReport)
router.post('/tasks/:id/issues', validateObjectId('id'), c.reportIssue)   // báo cần bảo trì (chờ QL duyệt)
router.patch('/tasks/:id/complete', validateObjectId('id'), c.completeTask)
router.get('/maintenance', c.listMaintenance)                            // phòng đang bảo trì / chờ xác nhận
router.patch('/maintenance/:id/fixed', validateObjectId('id'), c.requestFix) // báo đã sửa xong

module.exports = router
