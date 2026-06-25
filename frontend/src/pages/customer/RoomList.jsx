import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerService } from '../../services';
import './RoomList.css';

const RoomList = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ROOMS');

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await customerService.getPublicRooms();
      if (res.success) {
        setRooms(Array.isArray(res.data) ? res.data : (res.data.rooms || []));
      } else {
        setError('Không thể tải danh sách phòng.');
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Lọc phòng theo tab (giả lập logic phân loại)
  const displayRooms = rooms.filter(room => {
    if (activeTab === 'SUITES') return room.name.toLowerCase().includes('suite');
    return !room.name.toLowerCase().includes('suite');
  });

  return (
    <div className="room-list-container">
      {/* Tabs */}
      <div className="room-tabs">
        <div 
          className={`room-tab ${activeTab === 'ROOMS' ? 'active' : ''}`}
          onClick={() => setActiveTab('ROOMS')}
        >
          PHÒNG TIÊU CHUẨN
        </div>
        <div 
          className={`room-tab ${activeTab === 'SUITES' ? 'active' : ''}`}
          onClick={() => setActiveTab('SUITES')}
        >
          PHÒNG CAO CẤP
        </div>
      </div>

      {/* Main Content */}
      {loading && <div className="loading-state">Đang tải danh sách phòng...</div>}
      {error && <div className="error-state">{error}</div>}
      
      {!loading && !error && (
        <div className="room-grid">
          {displayRooms.length > 0 ? displayRooms.map((room) => (
            <div className="room-card" key={room._id}>
              <img 
                src={room.images && room.images.length > 0 ? room.images[0] : 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80&w=1000'} 
                alt={room.name} 
                className="room-image" 
              />
              <div className="room-content">
                <h3 className="room-title">{room.name}</h3>
                <p className="room-desc">{room.description}</p>
                
                <div className="room-features">
                  <div className="feature-item">
                    <span className="feature-icon">📐</span>
                    <span>Diện tích: {room.area}m2</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">🛏️</span>
                    <span>Loại giường: {room.bedType === 'king' ? 'Giường King' : room.bedType === 'double' ? 'Giường Đôi' : room.bedType === 'twin' ? '2 Giường Đơn' : 'Giường Đơn'}</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">👥</span>
                    <span>Tối đa: {room.capacity} Người lớn</span>
                  </div>
                </div>

                <div className="room-price">
                  {formatPrice(room.basePrice)} / Đêm
                </div>

                <div className="card-actions">
                  <button className="action-btn" onClick={() => navigate('/')}>ĐẶT PHÒNG</button>
                  <button className="action-btn outline" onClick={() => navigate(`/rooms/${room._id}`)}>CHI TIẾT &rarr;</button>
                </div>
              </div>
            </div>
          )) : (
            <div className="loading-state" style={{gridColumn: '1/-1'}}>Hiện tại chưa có phòng nào trong danh mục này.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default RoomList;
