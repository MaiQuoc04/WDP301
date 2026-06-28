const mongoose = require('mongoose')
const RoomType = require('../models/roomTypeModel')
const bookingService = require('../services/bookingService')
require('../models/branchModel') // Cần thiết cho populate
require('../models/amenityModel') // Cần thiết cho populate

// Danh sách chi nhánh đang hoạt động (cho ô chọn chi nhánh ở thanh tìm)
exports.getBranches = async (req, res) => {
  try {
    const Branch = mongoose.models.Branch || require('../models/branchModel')
    const branches = await Branch.find({ isActive: true }).select('name location hotline').lean()
    res.json({ success: true, data: branches })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// Tìm phòng trống CÔNG KHAI cho khách: theo chi nhánh + ngày + số khách (tái dùng searchAvailableRooms)
exports.searchRooms = async (req, res) => {
  try {
    const { branch, checkIn, checkOut, adults, children } = req.query
    if (!branch) return res.status(400).json({ success: false, message: 'Vui lòng chọn chi nhánh' })
    if (!checkIn || !checkOut) return res.status(400).json({ success: false, message: 'Vui lòng chọn ngày nhận/trả' })
    const adultCount = Number(adults ?? 1)
    const childCount = Number(children ?? 0)
    if (!Number.isInteger(adultCount) || adultCount < 1) {
      return res.status(400).json({ success: false, message: 'Số người lớn phải từ 1 trở lên' })
    }
    if (!Number.isInteger(childCount) || childCount < 0) {
      return res.status(400).json({ success: false, message: 'Số trẻ em không hợp lệ' })
    }
    const rooms = await bookingService.searchAvailableRooms(branch, checkIn, checkOut, adultCount, childCount)
    res.json({ success: true, data: rooms })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
}

exports.getRooms = async (req, res) => {
  try {
    // Populate branch and amenities
    const rooms = await RoomType.find({ status: 'active' })
      .populate('branch', 'name location hotline')
      .populate('amenities', 'name icon description')
      .lean();

    // Fetch all active branches
    const BranchModel = mongoose.models.Branch || require('../models/branchModel');
    const branches = await BranchModel.find({ isActive: true }).lean();

    res.json({ success: true, data: { rooms, branches } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

const Service = require('../models/serviceModel')
const Review = require('../models/reviewModel')
require('../models/customerModel')

exports.getHomeData = async (req, res) => {
  try {
    const featuredRooms = await RoomType.find({ status: 'active' }).sort({ basePrice: -1 }).limit(3)
    const dining = await Service.find({ status: 'active', category: 'dining' })
    const reviews = await Review.find({ status: 'active' })
      .populate('customer', 'fullName')
      .sort({ createdAt: -1 })
      .limit(5)

    res.json({
      success: true,
      data: {
        featuredRooms,
        dining,
        reviews
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
