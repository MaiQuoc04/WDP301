import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { customerService } from '../services';
import './BookingPage.css';

const BookingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [rooms, setRooms] = useState([]);
  const [offer, setOffer] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Parse query params for search state
  const searchParams = new URLSearchParams(location.search);
  const [checkIn, setCheckIn] = useState(searchParams.get('checkin') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('checkout') || '');
  const [promoCode, setPromoCode] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(searchParams.get('branch') || '');

  // State mapping room ID and rate plan index to selected quantities
  const [selections, setSelections] = useState({});

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

  // Lọc danh sách phòng theo chi nhánh đã chọn
  const filteredRooms = rooms.filter(room => {
    if (!selectedBranch) return true;
    const bObj = getBranchObj(room);
    return bObj && bObj._id === selectedBranch;
  });

  // Xác định thông tin chi nhánh đang hiển thị trên Banner
  const displayBranch = selectedBranch 
    ? branches.find(b => b._id === selectedBranch) || branches[0] || {}
    : branches[0] || { name: 'Hà Nội', location: 'Chưa cập nhật', hotline: 'Chưa cập nhật' };

  const handleQuantityChange = (roomId, rateIndex, value) => {
    setSelections(prev => ({
      ...prev,
      [`${roomId}_${rateIndex}`]: parseInt(value)
    }));
  };

  const handleBookNow = (room, ratePlan, qty) => {
    if (qty > 0) {
      alert(`Đang tiến hành thanh toán cho:\n- ${room.name}\n- Gói: ${ratePlan.name}\n- Số lượng: ${qty} phòng`);
      // Here you could save to redux cart and navigate to checkout
      navigate('/customer'); // Example navigation after 'booking'
    } else {
      alert('Vui lòng chọn số lượng phòng (ít nhất 1 room) trước khi đặt.');
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
              
              const qty1 = selections[`${room._id}_0`] || 0;
              const qty2 = selections[`${room._id}_1`] || 0;

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
                        <select className="bk-room-select" value={selections[`${room._id}_0`] || 0} onChange={(e) => handleQuantityChange(room._id, 0, e.target.value)}>
                          <option value="0">0 phòng</option>
                          <option value="1">1 phòng</option>
                          <option value="2">2 phòng</option>
                        </select>
                        <div className="bk-calendar-link">Lịch trình 📅</div>
                        <button 
                          className={`bk-btn-book ${(selections[`${room._id}_0`] || 0) > 0 ? 'active' : ''}`} 
                          onClick={() => handleBookNow(room, {name: 'Standard Rate'}, selections[`${room._id}_0`] || 0)}
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

      <Footer />
    </div>
  );
};

export default BookingPage;
