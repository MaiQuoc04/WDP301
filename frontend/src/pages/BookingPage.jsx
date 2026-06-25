import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { notification } from 'antd';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { customerService } from '../services';
import { socket, connectSocket, disconnectSocket } from '../services/socketService';
import './BookingPage.css';

// Đặt phòng DATE-FIRST: chọn chi nhánh + ngày + số khách -> tìm phòng TRỐNG (gộp theo loại phòng) -> đặt.
const BookingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useSelector((s) => s.auth || {});

  const [catalog, setCatalog] = useState([]);   // loại phòng (ảnh, tiện ích, diện tích...)
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tiêu chí tìm (lấy từ query param khi đến từ trang chủ)
  const sp = new URLSearchParams(location.search);
  const [branch, setBranch] = useState(sp.get('branch') || '');
  const [checkIn, setCheckIn] = useState(sp.get('checkIn') || sp.get('checkin') || '');
  const [checkOut, setCheckOut] = useState(sp.get('checkOut') || sp.get('checkout') || '');
  const [adults, setAdults] = useState(sp.get('adults') || '2');
  const [children, setChildren] = useState(sp.get('children') || '0');

  const [avail, setAvail] = useState([]);        // phòng trống (searchAvailableRooms)
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState({});

  // Modal nhập thông tin khách
  const [modalRoom, setModalRoom] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [formErr, setFormErr] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) { setGuestName(user.fullName || user.name || ''); setGuestPhone(user.phone || ''); }
  }, [user]);

  // Load catalog loại phòng + chi nhánh
  useEffect(() => {
    (async () => {
      try {
        const res = await customerService.getPublicRooms();
        const data = res.data || {};
        setCatalog(Array.isArray(data) ? data : (data.rooms || []));
        setBranches(data.branches || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p || 0) + 'đ';
  const getBedText = (t) => ({ king: '1 Giường đôi lớn', double: '1 Giường đôi', twin: '2 Giường đơn' }[t] || '1 Giường đơn');
  const parseGuestCount = (value, min) => {
    const n = Number(value);
    return Number.isInteger(n) && n >= min ? n : null;
  };
  const displayAdults = parseGuestCount(adults, 1) ?? 1;
  const displayChildren = parseGuestCount(children, 0) ?? 0;
  const getFitText = (r) => {
    if (!r) return '';
    if (r.fit === 'short') return `Cần ${r.extraBeds} giường phụ (+${formatPrice(r.surcharge)})`;
    if (r.fit === 'surplus') return 'Còn trống';
    return 'Vừa khít';
  };

  const doSearch = useCallback(async (opts = {}) => {
    const b = opts.branch ?? branch, ci = opts.checkIn ?? checkIn, co = opts.checkOut ?? checkOut;
    const adultCount = parseGuestCount(opts.adults ?? adults, 1);
    const childCount = parseGuestCount(opts.children ?? children, 0);
    const e = {};
    if (!b) e.branch = 'Chọn chi nhánh';
    if (!ci) e.checkIn = 'Chọn ngày nhận';
    if (!co) e.checkOut = 'Chọn ngày trả';
    else if (ci && new Date(co) <= new Date(ci)) e.checkOut = 'Ngày trả phải sau ngày nhận';
    if (adultCount == null) e.adults = 'Số người lớn phải từ 1 trở lên';
    if (childCount == null) e.children = 'Số trẻ em không hợp lệ';
    setSearchErr(e);
    if (Object.keys(e).length) return;
    setSearching(true); setSearched(true);
    try {
      const res = await customerService.searchAvailableRooms({ branch: b, checkIn: ci, checkOut: co, adults: adultCount, children: childCount });
      setAvail(res.data || []);
    } catch (err) {
      notification.error({ message: err.response?.data?.message || 'Lỗi tìm phòng', placement: 'bottomRight' });
      setAvail([]);
    } finally { setSearching(false); }
  }, [branch, checkIn, checkOut, adults, children]);

  // Tự tìm khi đến từ trang chủ (đã có đủ tham số)
  useEffect(() => {
    if (branch && checkIn && checkOut) doSearch({ branch, checkIn, checkOut });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    connectSocket();
    const onNew = () => { if (searched) doSearch(); }; // có người vừa đặt -> làm mới phòng trống
    socket.on('new_booking', onNew);
    return () => { socket.off('new_booking', onNew); disconnectSocket(); };
  }, [searched, doSearch]);

  // Gộp phòng trống theo LOẠI PHÒNG (giá thấp nhất + số phòng trống)
  const availByType = useMemo(() => {
    const m = {};
    for (const r of avail) {
      const k = r.roomType?._id; if (!k) continue;
      if (!m[k]) m[k] = {
        total: r.total,
        perNight: Math.round(r.roomCharge / Math.max(1, r.nights)),
        nights: r.nights,
        count: 0,
        fit: r.fit,
        extraBeds: r.extraBeds,
        surcharge: r.surcharge,
      };
      m[k].count++;
      if (r.total < m[k].total) {
        m[k].total = r.total;
        m[k].perNight = Math.round(r.roomCharge / Math.max(1, r.nights));
        m[k].fit = r.fit;
        m[k].extraBeds = r.extraBeds;
        m[k].surcharge = r.surcharge;
      }
    }
    return m;
  }, [avail]);

  // Loại phòng hiển thị = catalog có trong kết quả phòng trống
  const displayRooms = useMemo(() => catalog.filter((rt) => availByType[rt._id]), [catalog, availByType]);

  const openBook = (room) => {
    if (!token) {
      notification.warning({ message: 'Vui lòng đăng nhập để đặt phòng' });
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }
    setFormErr({});
    setModalRoom(room);
  };

  const submitBooking = async () => {
    const e = {};
    if (!guestName.trim() || guestName.trim().length < 2) e.guestName = 'Nhập họ tên hợp lệ';
    if (!/^0\d{9,10}$/.test(guestPhone.trim())) e.guestPhone = 'SĐT không hợp lệ (VD: 0987654321)';
    setFormErr(e);
    if (Object.keys(e).length) return;
    const adultCount = parseGuestCount(adults, 1);
    const childCount = parseGuestCount(children, 0);
    if (adultCount == null || childCount == null) {
      notification.warning({ message: 'Vui lòng nhập số người lớn/trẻ em hợp lệ' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await customerService.createBooking({
        branchId: branch, roomTypeId: modalRoom._id,
        checkIn, checkOut, adults: adultCount, children: childCount, guestName, guestPhone,
      });
      if (res.success) { setModalRoom(null); navigate('/checkout/' + res.data._id); }
    } catch (err) {
      notification.error({ message: err.response?.data?.message || 'Có lỗi khi đặt phòng' });
    } finally { setSubmitting(false); }
  };

  const branchName = branches.find((b) => b._id === branch)?.name;

  return (
    <div className="bk-page">
      <Navbar />

      {/* Thanh tìm phòng (date-first) */}
      <div className="bk-search-bar-wrapper" style={{ marginTop: 90 }}>
        <div className="bk-search-bar">
          <div className="bk-dates" style={{ flexWrap: 'wrap', gap: 12 }}>
            <select value={branch} onChange={(e) => setBranch(e.target.value)} className="bk-date-input" style={{ minWidth: 180, background: '#fff', borderColor: searchErr.branch ? 'red' : undefined }}>
              <option value="">-- Chọn chi nhánh --</option>
              {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
            <input type="date" value={checkIn} min={new Date().toISOString().split('T')[0]} onChange={(e) => setCheckIn(e.target.value)} className="bk-date-input" style={{ borderColor: searchErr.checkIn ? 'red' : undefined }} title="Ngày nhận (14:00)" />
            <input type="date" value={checkOut} min={checkIn || new Date().toISOString().split('T')[0]} onChange={(e) => setCheckOut(e.target.value)} className="bk-date-input" style={{ borderColor: searchErr.checkOut ? 'red' : undefined }} title="Ngày trả (12:00)" />
            <input
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={adults}
              onChange={(e) => setAdults(e.target.value)}
              className="bk-date-input"
              style={{ width: 130, background: '#fff', borderColor: searchErr.adults ? 'red' : undefined }}
              placeholder="Người lớn"
              title="Người lớn"
            />
            <input
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={children}
              onChange={(e) => setChildren(e.target.value)}
              className="bk-date-input"
              style={{ width: 120, background: '#fff', borderColor: searchErr.children ? 'red' : undefined }}
              placeholder="Trẻ em"
              title="Trẻ em"
            />
            <button className="bk-btn-apply" onClick={() => doSearch()} disabled={searching}>{searching ? 'Đang tìm...' : 'Tìm phòng'}</button>
          </div>
          <div style={{ fontSize: 12, color: '#fff', marginTop: 6, opacity: 0.85 }}>Nhận phòng 14:00 · Trả phòng 12:00 · Giá tính theo đêm</div>
        </div>
      </div>

      {/* Kết quả */}
      <div className="bk-main">
        {!searched ? (
          <div className="bk-loading">Chọn chi nhánh & ngày rồi bấm “Tìm phòng” để xem phòng trống.</div>
        ) : searching ? (
          <div className="bk-loading">Đang tìm phòng trống...</div>
        ) : displayRooms.length === 0 ? (
          <div className="bk-loading">Không còn phòng trống cho {branchName} trong khoảng ngày đã chọn.</div>
        ) : (
          <div className="bk-room-list">
            {displayRooms.map((room) => {
              const a = availByType[room._id];
              const fit = getFitText(a);
              return (
                <div key={room._id} className="bk-room-card">
                  <div className="bk-room-info-section">
                    <div className="bk-room-image">
                      {room.images?.length ? <img src={room.images[0]} alt={room.name} /> : (
                        <div style={{ width: '100%', height: '100%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span>Chưa có ảnh</span></div>
                      )}
                    </div>
                    <div className="bk-room-details">
                      <h3>{room.name}</h3>
                      <div className="bk-room-icons">
                        {room.amenities?.length ? room.amenities.map((am, i) => <span key={i} title={am.name}>{am.icon || '✨'}</span>) : <span style={{ fontSize: 14, color: '#888' }}>Chưa cập nhật tiện ích</span>}
                      </div>
                      <div className="bk-room-specs">
                        <span><strong>Loại giường:</strong> {getBedText(room.bedType)}</span>
                        <span><strong>Diện tích:</strong> {room.area} m²</span>
                        <span><strong>Sức chứa:</strong> {room.capacity || 2} khách</span>
                      </div>
                    </div>
                  </div>

                  <div className="bk-rate-plans">
                    <div className="bk-rate-row">
                      <div className="bk-rate-info">
                        <h4>Giá tiêu chuẩn</h4>
                        <div className="bk-rate-perks"><span className="bk-grey">{a.nights} đêm · {branchName}</span></div>
                      </div>
                      <div className="bk-rate-occupancy">
                        <span className="bk-occ-icon">👥</span>
                        <span className="bk-occ-text">Tối đa {room.capacity || 2} khách</span>
                        {fit && <span className="bk-occ-fit">{fit}</span>}
                      </div>
                      <div className="bk-rate-price">
                        <div className="bk-rooms-left">Còn {a.count} phòng</div>
                        <div className="bk-price-current">đ {formatPrice(a.perNight).replace('đ', '').trim()}</div>
                        <div className="bk-price-note">/ đêm · Tổng {formatPrice(a.total)}</div>
                      </div>
                      <div className="bk-rate-action">
                        <button className="bk-btn-book active" onClick={() => openBook(room)}>ĐẶT NGAY</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal nhập thông tin khách (ngày đã chọn ở thanh tìm) */}
      {modalRoom && (
        <div className="bk-modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div className="bk-modal-content" style={{ backgroundColor: '#fff', padding: 24, borderRadius: 8, width: 420, maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: 12, color: '#333' }}>Đặt phòng: {modalRoom.name}</h3>
            <div style={{ background: '#faf8f3', padding: '10px 14px', borderRadius: 6, marginBottom: 16, fontSize: 14 }}>
              <div>🏨 {branchName}</div>
              <div>📅 Nhận {checkIn} 14:00 → Trả {checkOut} 12:00</div>
              <div>👥 {displayAdults} người lớn{displayChildren ? ` + ${displayChildren} trẻ em` : ''}</div>
              <div style={{ marginTop: 4, fontWeight: 700, color: '#a18348' }}>Tổng: {formatPrice(availByType[modalRoom._id]?.total)}</div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold', color: '#555' }}>Họ và tên <span style={{ color: 'red' }}>*</span></label>
              <input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Nguyễn Văn A"
                style={{ width: '100%', padding: 10, border: formErr.guestName ? '1px solid red' : '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
              {formErr.guestName && <div style={{ color: 'red', fontSize: 12, marginTop: 4 }}>{formErr.guestName}</div>}
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold', color: '#555' }}>Số điện thoại <span style={{ color: 'red' }}>*</span></label>
              <input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="0987654321"
                style={{ width: '100%', padding: 10, border: formErr.guestPhone ? '1px solid red' : '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
              {formErr.guestPhone && <div style={{ color: 'red', fontSize: 12, marginTop: 4 }}>{formErr.guestPhone}</div>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button onClick={() => setModalRoom(null)} style={{ padding: '10px 20px', border: '1px solid #ccc', background: '#fff', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>Huỷ</button>
              <button onClick={submitBooking} disabled={submitting} style={{ padding: '10px 20px', border: 'none', background: '#d2b356', color: '#fff', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>
                {submitting ? 'Đang xử lý...' : 'Xác nhận đặt'}
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
