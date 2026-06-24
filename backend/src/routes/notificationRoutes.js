// Owner: Quốc — thông báo dùng chung (mọi role đăng nhập đều có hộp thư của mình).
const router = require('express').Router()
const { protect } = require('../middlewares/authMiddleware')
const { validateObjectId } = require('../middlewares/validateMiddleware')
const c = require('../controllers/notificationController')

router.use(protect)
router.get('/', c.list)                                            // ?unreadOnly=true&limit=50
router.get('/unread-count', c.unreadCount)                         // { count }
router.patch('/read-all', c.markAllRead)                           // đánh dấu đã đọc tất cả
router.patch('/:id/read', validateObjectId('id'), c.markRead)      // đánh dấu 1 cái đã đọc

module.exports = router
