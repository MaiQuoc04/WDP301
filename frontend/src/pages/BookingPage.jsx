import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { notification } from 'antd';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { customerService } from '../services';
import { socket, connectSocket, disconnectSocket } from '../services/socketService';
import './BookingPage.css';

const BookingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [rooms, setRooms] = useState([]);
  const [offer, setOffer] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user, token } = useSelector((s) => s.auth || {});

  // Parse query params for search state
  const searchParams = new URLSearchParams(location.search);
  const [checkIn, setCheckIn] = useState(searchParams.get('checkin') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('checkout') || '');
  const [promoCode, setPromoCode] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(searchParams.get('branch') || '');
  const [selectedRoomType, setSelectedRoomType] = useState(searchParams.get('roomType') || '');

  const [modalCheckIn, setModalCheckIn] = useState('');
  const [modalCheckOut, setModalCheckOut] = useState('');

  const [errors, setErrors] = useState({});

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [bookingPayload, setBookingPayload] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setGuestName(user.fullName || user.name || '');
      setGuestPhone(user.phone || '');
    }
  }, [user]);



  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await customerService.getPublicRooms();
        if (res.success && res.data) {
          // Check if data is array (old format) or object (new format)
          if (Array.isArray(res.data)) {
            setRooms(res.data);
          } else {
            setRooms(res.data.rooms || []);
            setOffer(res.data.offer || null);
            setBranches(res.data.branches || []);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  useEffect(() => {
    connectSocket();
    
    const handleNewBooking = (data) => {
      const bookedRoom = rooms.find(r => r._id === data.roomTypeId);
      if (bookedRoom) {
        notification.info({
          message: 'Phòng vừa được đặt!',
          description: `Khách hàng khác vừa đặt hạng phòng ${bookedRoom.name}. Hãy nhanh tay đặt ngay trước khi hết phòng!`,
          placement: 'bottomRight',
          duration: 5
        });
      }
    };

    socket.on('new_booking', handleNewBooking);

    return () => {
      socket.off('new_booking', handleNewBooking);
      disconnectSocket();
    };
  }, [rooms]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const getBedText = (type) => {
    switch(type) {
      case 'king': return '1 Giường đôi lớn';
      case 'double': return '1 Giường đôi';
      case 'twin': return '2 Giường đơn';
      default: return '1 Giường đơn';
    }
  };

  // Hàm lấy đối tượng chi nhánh từ object room
  const getBranchObj = (room) => {
    if (room.branch && typeof room.branch === 'object') return room.branch;
    if (room.branchId && typeof room.branchId === 'object') return room.branchId;
    return null;
  };

  // Lọc danh sách phòng theo chi nhánh và loại phòng đã chọn
  const filteredRooms = rooms.filter(room => {
    if (selectedRoomType && room._id !== selectedRoomType) return false;
    if (!selectedBranch) return true;
    const bObj = getBranchObj(room);
    return bObj && bObj._id === selectedBranch;
  });

  // Xác định thông tin chi nhánh đang hiển thị trên Banner
  const displayBranch = selectedBranch 
    ? branches.find(b => b._id === selectedBranch) || branches[0] || {}
    : branches[0] || { name: 'Hà Nội', location: 'Chưa cập nhật', hotline: 'Chưa cập nhật' };

  const handleBookNow = (room, ratePlan, qty) => {
    if (!token) {
      alert("Vui lòng đăng nhập để đặt phòng!");
      navigate('/login', { state: { from: window.location.pathname + window.location.search } });
      return;
    }

    if (qty > 0) {
      setBookingPayload({
        branchId: selectedBranch || getBranchObj(room)?._id,
        roomTypeId: room._id,
        roomName: room.name,
        adults: 1,
        children: 0
      });
      setModalCheckIn(checkIn);
      setModalCheckOut(checkOut);
      setErrors({});
      setIsModalVisible(true);
    } else {
      alert('Vui lòng chọn số lượng phòng (ít nhất 1 room) trước khi đặt.');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!modalCheckIn) newErrors.checkIn = 'Vui lòng chọn Ngày nhận phòng';
    else {
      const today = new Date();
      today.setHours(0,0,0,0);
      const checkInDate = new Date(modalCheckIn);
      if (checkInDate < today) newErrors.checkIn = 'Không thể chọn ngày trong quá khứ';
    }

    if (!modalCheckOut) newErrors.checkOut = 'Vui lòng chọn Ngày trả phòng';
    
    if (modalCheckIn && modalCheckOut) {
      if (new Date(modalCheckIn) >= new Date(modalCheckOut)) {
        newErrors.checkOut = 'Ngày trả phòng phải sau ngày nhận phòng';
      }
    }

    if (!guestName.trim()) {
      newErrors.guestName = 'Vui lòng điền Họ và tên';
    } else if (guestName.trim().length < 2) {
      newErrors.guestName = 'Họ và tên quá ngắn';
    }

    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!guestPhone.trim()) {
      newErrors.guestPhone = 'Vui lòng điền Số điện thoại';
    } else if (!phoneRegex.test(guestPhone.trim())) {
      newErrors.guestPhone = 'Số điện thoại không hợp lệ (Ví dụ: 0987654321)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitBooking = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const res = await customerService.createBooking({
        ...bookingPayload,
        checkIn: modalCheckIn,
        checkOut: modalCheckOut,
        guestName,
        guestPhone
      });
      if (res.success) {
        setIsModalVisible(false);
        navigate('/checkout/' + res.data._id);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Có lỗi xảy ra khi đặt phòng");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bk-page">
      <Navbar />
      
      {/* Hero Banner */}
      <div className="bk-hero">
        <div className="bk-hero-image-left">
          {offer?.image ? (
            <img src={offer.image} alt="Promotion" />
          ) : (
            <div style={{ width: '100%', height: '100%', backgroundColor: '#444' }}></div>
          )}
        </div>
        <div className="bk-hero-gradient-overlay"></div>
        <div className="bk-hero-content">
          <div className="bk-direct-booking">
            {offer ? (
              <>
                <p>{offer.title}</p>
                {offer.link && <div className="bk-code">MÃ: {offer.link}</div>}
                <p>Nhập mã vào ô Mã khuyến mãi để nhận ưu đãi</p>
                <p className="bk-discount">{offer.description}</p>
              </>
            ) : (
              <p>ĐẶT PHÒNG KHÁCH SẠN</p>
            )}
          </div>
          <div className="bk-contact-info">
            <p>A. {displayBranch.location || 'Chưa cập nhật địa chỉ'}</p>
            <p>T. {displayBranch.hotline || 'Chưa cập nhật SĐT'}</p>
            <p>W. hanoihotel.com.vn</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bk-search-bar-wrapper">
        <div className="bk-search-bar">
          <div className="bk-dates">
            <select 
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bk-date-input"
              style={{ width: '180px', backgroundColor: '#fff', cursor: 'pointer' }}
            >
              <option value="">Tất cả chi nhánh</option>
              {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
            <select 
              value={selectedRoomType}
              onChange={(e) => setSelectedRoomType(e.target.value)}
              className="bk-date-input"
              style={{ width: '180px', backgroundColor: '#fff', cursor: 'pointer' }}
            >
              <option value="">Tất cả hạng phòng</option>
              {rooms.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
            </select>
            <input 
              type="date" 
              value={checkIn} 
              onChange={(e) => setCheckIn(e.target.value)} 
              className="bk-date-input"
            />
            <input 
              type="date" 
              value={checkOut} 
              onChange={(e) => setCheckOut(e.target.value)} 
              className="bk-date-input"
            />
          </div>
          <div className="bk-promo-currency">
            <div className="bk-promo-group">
              <input 
                type="text" 
                placeholder="Mã khuyến mãi" 
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="bk-promo-input"
              />
              <button className="bk-btn-apply">Áp dụng</button>
            </div>
            <select className="bk-currency-select">
              <option>VNĐ</option>
              <option>USD</option>
            </select>
          </div>
        </div>
      </div>

      {/* Room List */}
      <div className="bk-main">
        {loading ? (
          <div className="bk-loading">Đang tải danh sách phòng...</div>
        ) : (
          <div className="bk-room-list">
            {filteredRooms.length === 0 && <div className="bk-loading">Không có phòng trống theo tiêu chí của bạn.</div>}
            {filteredRooms.map((room) => {
              // Dummy rate plans calculation
              const basePrice = room.basePrice;
              const dealPrice = basePrice * 0.85; // 15% off example
              const nrfPrice = basePrice * 0.75; // 25% off example

              return (
                <div key={room._id} className="bk-room-card">
                  {/* Room Info Section */}
                  <div className="bk-room-info-section">
                    <div className="bk-room-image">
                      {room.images && room.images.length > 0 ? (
                        <img src={room.images[0]} alt={room.name} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span>Chưa có ảnh</span>
                        </div>
                      )}
                      <div className="bk-image-hint">Nhấp vào ảnh để xem chi tiết</div>
                    </div>
                    <div className="bk-room-details">
                      <h3>{room.name}</h3>
                      <p className="bk-room-subtitle">{room.name}</p>
                      
                      <div className="bk-room-icons">
                        {room.amenities && room.amenities.length > 0 ? (
                          room.amenities.map((amenity, idx) => (
                            <span key={idx} title={amenity.name}>{amenity.icon || '✨'}</span>
                          ))
                        ) : (
                          <span style={{ fontSize: '14px', color: '#888' }}>Chưa cập nhật tiện ích</span>
                        )}
                        <span className="bk-view-amenities">xem tất cả tiện ích</span>
                      </div>
                      
                      <div className="bk-room-specs">
                        <span><strong>Loại giường:</strong> {getBedText(room.bedType)}</span>
                        <span><strong>Diện tích:</strong> {room.area} m²</span>
                      </div>
                    </div>
                  </div>

                  {/* Room Book Action (Real DB Data) */}
                  <div className="bk-rate-plans">
                    <div className="bk-rate-row">
                      <div className="bk-rate-info">
                        <h4>{room.name}</h4>
                        <div className="bk-rate-deals">
                          Giá Tiêu Chuẩn (Standard)
                        </div>
                        <div className="bk-rate-perks">
                          <span className="bk-grey">Áp dụng theo chính sách chi nhánh ℹ️</span>
                        </div>
                      </div>
                      
                      <div className="bk-rate-occupancy">
                        <span className="bk-occ-icon">👥</span>
                        <span className="bk-occ-text">Tối đa {room.capacity || 2} khách</span>
                      </div>

                      <div className="bk-rate-price">
                        <div className="bk-rooms-left">Có thể đặt ngay</div>
                        <div className="bk-price-current">đ {formatPrice(room.basePrice).replace('₫', '').trim()} <span className="bk-info-icon">ℹ️</span></div>
                        <div className="bk-price-note">mỗi đêm</div>
                      </div>

                      <div className="bk-rate-action">
                        <select className="bk-room-select" value="1" disabled>
                          <option value="1">1 phòng</option>
                        </select>

                        <button 
                          className="bk-btn-book active" 
                          onClick={() => handleBookNow(room, {name: 'Standard Rate'}, 1)}
                        >
                          ĐẶT NGAY
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Customer Support Button */}
      <button className="rd-floating-btn" onClick={() => alert('Customer support clicked')} style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: '#d2b356',
        color: '#fff',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '30px',
        fontWeight: 'bold',
        cursor: 'pointer',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        zIndex: 9999
      }}>
        Hỗ trợ khách hàng
      </button>

      {/* Booking Modal */}
      {isModalVisible && (
        <div className="bk-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div className="bk-modal-content" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', width: '400px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '20px', color: '#333' }}>Đặt phòng: {bookingPayload?.roomName}</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>Ngày nhận phòng <span style={{color:'red'}}>*</span></label>
              <input 
                type="date" 
                min={new Date().toISOString().split('T')[0]}
                value={modalCheckIn} 
                onChange={e => setModalCheckIn(e.target.value)} 
                style={{ width: '100%', padding: '10px', border: errors.checkIn ? '1px solid red' : '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} 
              />
              {errors.checkIn && <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.checkIn}</div>}
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>Ngày trả phòng <span style={{color:'red'}}>*</span></label>
              <input 
                type="date" 
                min={modalCheckIn ? new Date(new Date(modalCheckIn).getTime() + 86400000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                value={modalCheckOut} 
                onChange={e => setModalCheckOut(e.target.value)} 
                style={{ width: '100%', padding: '10px', border: errors.checkOut ? '1px solid red' : '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} 
              />
              {errors.checkOut && <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.checkOut}</div>}
            </div>
            
            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px dashed #ccc' }} />

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>Họ và tên <span style={{color:'red'}}>*</span></label>
              <input 
                type="text" 
                value={guestName} 
                onChange={e => setGuestName(e.target.value)} 
                style={{ width: '100%', padding: '10px', border: errors.guestName ? '1px solid red' : '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} 
                placeholder="Ví dụ: Nguyễn Văn A" 
              />
              {errors.guestName && <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.guestName}</div>}
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>Số điện thoại <span style={{color:'red'}}>*</span></label>
              <input 
                type="text" 
                value={guestPhone} 
                onChange={e => setGuestPhone(e.target.value)} 
                style={{ width: '100%', padding: '10px', border: errors.guestPhone ? '1px solid red' : '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} 
                placeholder="Ví dụ: 0987654321" 
              />
              {errors.guestPhone && <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.guestPhone}</div>}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '25px' }}>
              <button onClick={() => setIsModalVisible(false)} style={{ padding: '10px 20px', border: '1px solid #ccc', backgroundColor: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Huỷ</button>
              <button onClick={submitBooking} disabled={isSubmitting} style={{ padding: '10px 20px', border: 'none', backgroundColor: '#d2b356', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đặt'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default BookingPage;
