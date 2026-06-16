// Owner: Hoàng — Branch Manager APIs (UC-56→70)
const router = require('express').Router()
const { protect, authorize, getBranchManagerBranch } = require('../middlewares/authMiddleware')
const managerController = require('../controllers/managerController')

router.use(protect, authorize('branch_manager'), getBranchManagerBranch)

// ─── RoomTypes ─────────────────────────────────────────────────────────────────
router.get('/room-types', managerController.getRoomTypes)
router.get('/room-types/options', managerController.getRoomTypeOptions)
router.get('/room-types/:id', managerController.getRoomTypeById)
router.post('/room-types', managerController.createRoomType)
router.put('/room-types/:id', managerController.updateRoomType)
router.patch('/room-types/:id/status', managerController.updateRoomTypeStatus)

// ─── Rooms ─────────────────────────────────────────────────────────────────────
router.get('/rooms', managerController.getRooms)
router.get('/rooms/:id', managerController.getRoomById)
router.post('/rooms', managerController.createRoom)
router.put('/rooms/:id', managerController.updateRoom)
router.patch('/rooms/:id/status', managerController.updateRoomStatus)
router.patch('/rooms/:id/deactivate', managerController.deactivateRoom)

// ─── RoomPrices ────────────────────────────────────────────────────────────────
router.get('/room-prices', managerController.getRoomPrices)
router.post('/room-prices', managerController.createOrUpdateRoomPrice)
router.delete('/room-prices/:id', managerController.deleteRoomPrice)

// ─── Amenities ─────────────────────────────────────────────────────────────────
router.get('/amenities', managerController.getAmenities)
router.get('/amenities/options', managerController.getAmenityOptions)
router.post('/amenities', managerController.createAmenity)
router.put('/amenities/:id', managerController.updateAmenity)
router.patch('/amenities/:id/deactivate', managerController.deactivateAmenity)

// ─── RoomType Amenities mapping ────────────────────────────────────────────────
router.get('/room-types/:id/amenities', managerController.getRoomTypeAmenities)
router.put('/room-types/:id/amenities', managerController.updateRoomTypeAmenities)

// ─── Services ──────────────────────────────────────────────────────────────────
router.get('/services', managerController.getServices)
router.get('/services/options', managerController.getServiceOptions)
router.get('/services/:id', managerController.getServiceById)
router.post('/services', managerController.createService)
router.put('/services/:id', managerController.updateService)
router.patch('/services/:id/deactivate', managerController.deactivateService)

// ─── Room Issues ───────────────────────────────────────────────────────────────
router.get('/room-issues', managerController.getRoomIssues)
router.get('/room-issues/:id', managerController.getRoomIssueById)
router.post('/room-issues', managerController.createRoomIssue)
router.patch('/room-issues/:id/resolve', managerController.resolveRoomIssue)

// ─── Housekeeping ──────────────────────────────────────────────────────────────
router.get('/housekeeping/tasks', managerController.getHousekeepingTasks)
router.get('/housekeeping/tasks/:id', managerController.getHousekeepingTaskById)
router.patch('/housekeeping/tasks/:id/assign', managerController.assignHousekeepingTask)
router.patch('/housekeeping/tasks/:id/urgent', managerController.markHousekeepingTaskUrgent)

module.exports = router



