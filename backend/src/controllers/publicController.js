const mongoose = require('mongoose')
const RoomType = require('../models/roomTypeModel')
require('../models/branchModel') // Cần thiết cho populate
require('../models/amenityModel') // Cần thiết cho populate

exports.getRooms = async (req, res) => {
  try {
    const { Offer } = require('../models/offerModel') || {};
    const OfferModel = Offer || mongoose.models.Offer || require('../models/offerModel');

    // Populate branch and amenities
    const rooms = await RoomType.find({ status: 'active' })
      .populate('branch', 'name location hotline')
      .populate('amenities', 'name icon description')
      .lean();

    // Fetch the active offer for the Hero banner (if any)
    const offer = await OfferModel.findOne({ status: 'active' });

    // Fetch all active branches
    const BranchModel = mongoose.models.Branch || require('../models/branchModel');
    const branches = await BranchModel.find({ isActive: true }).lean();

    res.json({ success: true, data: { rooms, offer, branches } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

const Offer = require('../models/offerModel')
const Service = require('../models/serviceModel')
const Review = require('../models/reviewModel')
require('../models/customerModel')

exports.getHomeData = async (req, res) => {
  try {
    const featuredRooms = await RoomType.find({ status: 'active' }).sort({ basePrice: -1 }).limit(3)
    const offers = await Offer.find({ status: 'active' })
    const dining = await Service.find({ status: 'active', category: 'dining' })
    const reviews = await Review.find({ status: 'active' })
      .populate('customer', 'fullName')
      .sort({ createdAt: -1 })
      .limit(5)

    res.json({
      success: true,
      data: {
        featuredRooms,
        offers,
        dining,
        reviews
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
