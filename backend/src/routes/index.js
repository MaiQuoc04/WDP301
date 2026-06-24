// Sprint 0 — PRE-WIRED. KHÔNG sửa file này sau Sprint 0.
// Mỗi người chỉ làm việc trong file route của module mình (xem cột "Chủ").
const router = require('express').Router()

router.use('/auth',         require('./authRoutes'))         // Sprint 0  — Quốc
router.use('/public',       require('./publicRoutes'))       // Guest     — Khánh (UC-11→16)
router.use('/customer',     require('./customerRoutes'))     // Customer  — Khánh (UC-01→25)
router.use('/reception',    require('./receptionRoutes'))    // Reception — Quốc  (UC-26→43)
router.use('/housekeeping', require('./housekeepingRoutes')) // Housekeep — Tú    (UC-44→55)
router.use('/manager',      require('./managerRoutes'))      // Manager   — Hoàng (UC-56→70)
router.use('/admin',        require('./adminRoutes'))        // SuperAdmin— Sáng  (UC-71→82)
router.use('/notifications', require('./notificationRoutes')) // Thông báo dùng chung — Quốc (Đợt 2)

module.exports = router
