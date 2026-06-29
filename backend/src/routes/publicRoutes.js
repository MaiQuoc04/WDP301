// Owner: Khánh — Guest APIs (UC-11→16): homepage, hotel detail, room list/detail, search, review
const router = require('express').Router()
const publicController = require('../controllers/publicController')
const galleryController = require('../controllers/galleryController')

// Public routes (không cần protect)
router.get('/rooms', publicController.getRooms)
router.get('/rooms/available', publicController.searchRooms)   // tìm phòng trống theo chi nhánh + ngày
router.get('/branches', publicController.getBranches)          // danh sách chi nhánh (ô chọn)
router.get('/home-data', publicController.getHomeData)
router.get('/gallery', galleryController.getPublicGallery)     // ảnh thư viện/ẩm thực (?category=gallery|dining)

// TODO(Khánh): GET /branches/:id, /rooms/:id, /reviews ...

module.exports = router
