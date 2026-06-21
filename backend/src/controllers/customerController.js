const bookingService = require('../services/bookingService');

exports.createBooking = async (req, res) => {
  try {
    const { branchId, roomTypeId, checkIn, checkOut, adults, children, guestName, guestPhone } = req.body;
    
    // Call service to create booking
    const booking = await bookingService.create({
      branchId,
      roomTypeId,
      checkIn,
      checkOut,
      adults,
      children,
      guestName,
      guestPhone,
      source: 'online',
      customerId: req.user ? req.user._id : undefined 
    });

    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const Booking = require('../models/bookingModel');

exports.getBookingDetail = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('roomType', 'name basePrice images')
      .populate('branch', 'name location hotline');
      
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy booking' });
    }
    
    // Auth check: if logged in, must match user. If guest, maybe we should check a token or just allow by ID for now.
    // For simplicity, we allow fetching by ID as long as the user knows the ID.
    
    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createPaymentLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // 'deposit' or 'full'
    
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy booking' });
    }
    
    // Tương lai: Gọi SDK PayOS ở đây để lấy URL QR code thanh toán
    // const payosData = await payos.createPaymentLink({ ... })
    // return res.json({ success: true, paymentUrl: payosData.checkoutUrl, qrCode: payosData.qrCode });

    // Mock data trả về cho frontend chờ setup PayOS
    const mockPaymentData = {
      checkoutUrl: '#',
      qrCode: 'mock_qr_base64_string',
      amount: type === 'deposit' ? booking.depositAmount : booking.totalAmount,
      message: ''
    };
    
    res.json({ success: true, data: mockPaymentData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
