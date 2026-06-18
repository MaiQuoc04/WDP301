// Owner: Khánh — Guest APIs (UC-11→16): homepage, hotel detail, room list/detail, search, review
const router = require('express').Router()
const publicController = require('../controllers/publicController')

// Public routes (không cần protect)
router.get('/rooms', publicController.getRooms)
router.get('/home-data', publicController.getHomeData)

// TODO(Khánh): GET /branches, /branches/:id, /rooms/:id, /rooms/search, /reviews ...

module.exports = router
