import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { customerService } from '../../services';
import './BookingHistoryPage.css';

const BookingHistoryPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth || {});

  useEffect(() => {
    if (!token) {
      navigate('/login', { state: { from: '/customer/booking-history' } });
      return;
    }

    const fetchHistory = async () => {
      try {
        const res = await customerService.getBookingHistory();
        if (res.success) {
          setBookings(res.data);
        }
      } catch (err) {
        alert('Lỗi khi tải lịch sử đặt phòng: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [token, navigate]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Chờ thanh toán cọc';
      case 'confirmed': return 'Đã xác nhận';
      case 'checked_in': return 'Đang lưu trú';
      case 'checked_out': return 'Đã trả phòng';
      case 'cancelled': return 'Đã huỷ';
      case 'no_show': return 'Không đến';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="bk-history-page">
        <Navbar />
        <div style={{ padding: '100px', textAlign: 'center', fontSize: '18px' }}>Đang tải lịch sử đặt phòng...</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bk-history-page">
      <Navbar />
      <div className="bk-history-container">
        <h2 className="bk-history-title">Lịch sử đặt phòng</h2>
        
        {bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <p style={{ fontSize: '18px', color: '#666' }}>Bạn chưa có đơn đặt phòng nào.</p>
            <button onClick={() => navigate('/booking')} style={{ marginTop: '15px', padding: '10px 20px', backgroundColor: '#d2b356', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              Đặt phòng ngay
            </button>
          </div>
        ) : (
          <div className="bk-history-list">
            {bookings.map((booking) => (
              <div key={booking._id} className="bk-history-card">
                <div className="bk-history-image">
                  {booking.roomType?.images && booking.roomType.images.length > 0 ? (
                    <img src={booking.roomType.images[0]} alt={booking.roomType.name} />
                  ) : (
                    <span>Chưa có ảnh</span>
                  )}
                </div>
                
                <div className="bk-history-details">
                  <div>
                    <div className="bk-history-header">
                      <div>
                        <h3>{booking.roomType?.name}</h3>
                        <div className="bk-history-branch">Chi nhánh: {booking.branch?.name}</div>
                      </div>
                      <div className={`bk-history-status status-${booking.status}`}>
                        {getStatusText(booking.status)}
                      </div>
                    </div>

                    <div className="bk-history-info-grid">
                      <div className="bk-history-info-item">
                        <span className="bk-info-label">Mã Booking</span>
                        <span className="bk-info-value">{booking.code}</span>
                      </div>
                      <div className="bk-history-info-item">
                        <span className="bk-info-label">Khách hàng</span>
                        <span className="bk-info-value">{booking.guestName}</span>
                      </div>
                      <div className="bk-history-info-item">
                        <span className="bk-info-label">Ngày nhận phòng</span>
                        <span className="bk-info-value">{new Date(booking.checkIn).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <div className="bk-history-info-item">
                        <span className="bk-info-label">Ngày trả phòng</span>
                        <span className="bk-info-value">{new Date(booking.checkOut).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bk-history-footer">
                    <div className="bk-history-price">
                      Tổng tiền: {formatPrice(booking.totalAmount)}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button className="bk-btn-view" onClick={() => navigate(`/checkout/${booking._id}`)}>
                        Xem chi tiết
                      </button>
                      {booking.status === 'pending' && (
                        <button className="bk-btn-pay" onClick={() => navigate(`/checkout/${booking._id}`)}>
                          Thanh toán tiếp
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default BookingHistoryPage;
