import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { notification } from 'antd';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Reveal from '../components/common/Reveal';
import { customerService } from '../services';
import { socket, connectSocket, disconnectSocket } from '../services/socketService';

// Đặt phòng DATE-FIRST: chọn chi nhánh + ngày + số khách -> tìm phòng TRỐNG (gộp theo loại phòng) -> đặt.
const fieldCls =
  'w-full rounded-sm border bg-white px-3.5 py-2.5 font-body text-sm text-charcoal outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold/40';
const labelCls = 'mb-1.5 block font-nav text-[11px] font-semibold uppercase tracking-wide text-charcoal/55';

/* Icon + dòng tóm tắt cho modal xác nhận */
const BkIcon = {
  pin: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
  calendar: 'M6.75 3v2.25M17.25 3v2.25M3 8.25h18M4.5 21h15a1.5 1.5 0 001.5-1.5V6.75a1.5 1.5 0 00-1.5-1.5h-15A1.5 1.5 0 003 6.75v12.75A1.5 1.5 0 004.5 21z',
  clock: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
  guest: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.1a7.5 7.5 0 0115 0A17.9 17.9 0 0112 21.75c-2.68 0-5.22-.584-7.5-1.632z',
};
const SummaryRow = ({ icon, label, value, sub }) => (
  <div className="flex items-start gap-3">
    <svg className="mt-0.5 h-5 w-5 shrink-0 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>
    <div className="min-w-0">
      <div className="font-nav text-[10px] font-semibold uppercase tracking-wide text-charcoal/45">{label}</div>
      <div className="font-body text-sm font-medium text-charcoal">{value}</div>
      {sub && <div className="font-body text-xs text-charcoal/50">{sub}</div>}
    </div>
  </div>
);

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
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white">
      <Navbar />

      {/* ---------- Hero Banner ---------- */}
      <section data-page-hero className="relative flex h-[56vh] min-h-[440px] flex-col items-center justify-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1920&q=80"
          alt="Đặt phòng Khách sạn Hà Nội"
          className="absolute inset-0 z-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 z-[1] bg-black/45" />
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/55 via-black/30 to-black/75" />

        <div className="container relative z-10 px-5 pt-16 text-center text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.6)]">
          <span className="font-nav text-xs font-semibold uppercase tracking-luxe text-gold-light">Đặt phòng</span>
          <h1 className="mt-4 font-display text-5xl font-medium leading-none md:text-7xl">Tìm phòng trống</h1>
          <p className="mx-auto mt-4 max-w-xl font-body text-sm text-white/85 sm:text-base">
            Chọn ngày và tận hưởng kỳ nghỉ của bạn tại Khách sạn Hà Nội.
          </p>
        </div>
      </section>

      {/* ---------- Search Bar (nổi đè lên đáy hero) ---------- */}
      <div className="relative z-20 mx-auto -mt-16 max-w-6xl px-5">
        <div className="rounded-lg bg-white p-5 shadow-modal">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-12 md:items-end">
            <div className="col-span-2 md:col-span-3">
              <label className={labelCls}>Chi nhánh</label>
              <select value={branch} onChange={(e) => setBranch(e.target.value)} className={`${fieldCls} ${searchErr.branch ? 'border-red-500' : 'border-black/10'}`}>
                <option value="">-- Chọn chi nhánh --</option>
                {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Nhận phòng</label>
              <input type="date" value={checkIn} min={todayStr} onChange={(e) => setCheckIn(e.target.value)} className={`${fieldCls} ${searchErr.checkIn ? 'border-red-500' : 'border-black/10'}`} title="Ngày nhận (14:00)" />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Trả phòng</label>
              <input type="date" value={checkOut} min={checkIn || todayStr} onChange={(e) => setCheckOut(e.target.value)} className={`${fieldCls} ${searchErr.checkOut ? 'border-red-500' : 'border-black/10'}`} title="Ngày trả (12:00)" />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Người lớn</label>
              <input type="number" min={1} step={1} inputMode="numeric" value={adults} onChange={(e) => setAdults(e.target.value)} className={`${fieldCls} ${searchErr.adults ? 'border-red-500' : 'border-black/10'}`} title="Người lớn" />
            </div>
            <div className="md:col-span-1">
              <label className={labelCls}>Trẻ em</label>
              <input type="number" min={0} step={1} inputMode="numeric" value={children} onChange={(e) => setChildren(e.target.value)} className={`${fieldCls} ${searchErr.children ? 'border-red-500' : 'border-black/10'}`} title="Trẻ em" />
            </div>
            <div className="col-span-2 md:col-span-2">
              <button onClick={() => doSearch()} disabled={searching} className="w-full rounded-sm bg-gold px-5 py-3 font-nav text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gold-hover disabled:opacity-60">
                {searching ? 'Đang tìm...' : 'Tìm phòng'}
              </button>
            </div>
          </div>
          <div className="mt-3 font-body text-xs text-charcoal/50">Nhận phòng 14:00 · Trả phòng 12:00 · Giá tính theo đêm</div>
        </div>
      </div>

      {/* ---------- Kết quả ---------- */}
      <section className="bg-off-white py-16 md:py-20">
        <div className="container mx-auto px-5 lg:px-10">
          {searched && displayRooms.length > 0 && (
            <h2 className="mb-8 font-display text-3xl font-medium text-charcoal md:text-4xl">Phòng trống</h2>
          )}

          {!searched ? (
            <div className="py-16 text-center font-body text-charcoal/55">Chọn chi nhánh &amp; ngày rồi bấm “Tìm phòng” để xem phòng trống.</div>
          ) : searching ? (
            <div className="py-16 text-center font-body text-charcoal/55">Đang tìm phòng trống...</div>
          ) : displayRooms.length === 0 ? (
            <div className="rounded-lg border border-black/5 bg-white py-16 text-center shadow-subtle">
              <p className="font-display text-2xl text-charcoal">Không còn phòng trống</p>
              <p className="mt-2 font-body text-sm text-charcoal/55">Cho {branchName} trong khoảng ngày đã chọn. Vui lòng thử ngày khác.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {displayRooms.map((room) => {
                const a = availByType[room._id];
                const fit = getFitText(a);
                return (
                  <Reveal as="article" key={room._id} className="grid overflow-hidden rounded-lg bg-white shadow-raised transition-shadow duration-300 hover:shadow-elevated md:grid-cols-[280px_1fr_240px]">
                    {/* Ảnh */}
                    <div className="h-56 overflow-hidden md:h-auto">
                      {room.images?.length ? (
                        <img src={room.images[0]} alt={room.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-cream text-sm text-charcoal/40">Chưa có ảnh</div>
                      )}
                    </div>

                    {/* Thông tin */}
                    <div className="flex flex-col justify-center p-6">
                      <h3 className="font-display text-2xl font-semibold text-charcoal">{room.name}</h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {room.amenities?.length ? room.amenities.slice(0, 6).map((am, i) => (
                          <span key={i} className="rounded-full bg-cream px-2.5 py-1 font-body text-[11px] text-gold" title={am.name}>{am.name}</span>
                        )) : <span className="font-body text-xs text-charcoal/45">Chưa cập nhật tiện ích</span>}
                      </div>
                      <div className="mt-4 space-y-1.5 font-body text-sm text-charcoal/70">
                        <div><span className="text-charcoal/45">Loại giường:</span> {getBedText(room.bedType)}</div>
                        <div><span className="text-charcoal/45">Diện tích:</span> {room.area} m²</div>
                        <div><span className="text-charcoal/45">Sức chứa:</span> {room.capacity || 2} khách</div>
                      </div>
                    </div>

                    {/* Panel giá */}
                    <div className="flex flex-col justify-center border-t border-black/5 bg-off-white/40 p-6 text-right md:border-l md:border-t-0">
                      <span className="font-nav text-[11px] font-semibold uppercase tracking-wide text-charcoal/50">Giá tiêu chuẩn</span>
                      <span className="mt-1 font-body text-xs text-charcoal/55">Tối đa {room.capacity || 2} khách</span>
                      {fit && <span className="mt-1 font-body text-xs text-gold">{fit}</span>}
                      <span className="mt-2 font-nav text-[11px] font-semibold uppercase tracking-wide text-emerald-600">Còn {a.count} phòng</span>
                      <span className="mt-2 font-display text-2xl font-semibold text-gold">{formatPrice(a.perNight)}</span>
                      <span className="font-body text-xs text-charcoal/50">/ đêm · {a.nights} đêm · Tổng {formatPrice(a.total)}</span>
                      <button onClick={() => openBook(room)} className="mt-4 rounded-sm bg-gold px-5 py-2.5 font-nav text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gold-hover">
                        Đặt ngay
                      </button>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ---------- Modal xác nhận đặt phòng (theo thiết kế Stitch) ---------- */}
      {modalRoom && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={() => setModalRoom(null)}>
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-modal" onClick={(e) => e.stopPropagation()}>
            {/* Tiêu đề */}
            <div className="px-8 pb-5 pt-8 text-center">
              <h3 className="font-display text-2xl font-semibold text-charcoal md:text-3xl">Xác nhận đặt phòng: {modalRoom.name}</h3>
              <div className="mx-auto mt-3 h-px w-12 bg-gold" />
            </div>

            <div className="px-8 pb-8">
              {/* Ô tóm tắt */}
              <div className="rounded-md bg-cream p-6">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <SummaryRow icon={BkIcon.pin} label="Địa điểm" value={branchName} />
                  </div>
                  <SummaryRow
                    icon={BkIcon.calendar}
                    label="Thời gian"
                    value={`${new Date(checkIn).toLocaleDateString('vi-VN')} → ${new Date(checkOut).toLocaleDateString('vi-VN')}`}
                    sub={availByType[modalRoom._id]?.nights ? `${availByType[modalRoom._id].nights} đêm` : undefined}
                  />
                  <SummaryRow icon={BkIcon.clock} label="Giờ nhận / trả" value="Nhận 14:00 → Trả 12:00" />
                  <div className="sm:col-span-2">
                    <SummaryRow icon={BkIcon.guest} label="Khách hàng" value={`${displayAdults} người lớn${displayChildren ? ` + ${displayChildren} trẻ em` : ''}`} />
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-gold/25 pt-4">
                  <span className="font-nav text-xs font-bold uppercase tracking-wide text-charcoal/70">Tổng cộng</span>
                  <span className="font-display text-2xl font-semibold text-gold">{formatPrice(availByType[modalRoom._id]?.total)}</span>
                </div>
              </div>

              {/* Form khách */}
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Họ và tên <span className="text-red-500">*</span></label>
                  <input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Nguyễn Văn A"
                    className={`${fieldCls} ${formErr.guestName ? 'border-red-500' : 'border-black/10'}`} />
                  {formErr.guestName && <div className="mt-1 text-xs text-red-500">{formErr.guestName}</div>}
                </div>
                <div>
                  <label className={labelCls}>Số điện thoại <span className="text-red-500">*</span></label>
                  <input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="0987654321"
                    className={`${fieldCls} ${formErr.guestPhone ? 'border-red-500' : 'border-black/10'}`} />
                  {formErr.guestPhone && <div className="mt-1 text-xs text-red-500">{formErr.guestPhone}</div>}
                </div>
              </div>

              {/* Nút */}
              <div className="mt-7 flex items-center justify-end gap-3">
                <button onClick={() => setModalRoom(null)} className="rounded-sm border border-black/15 px-7 py-2.5 font-nav text-sm font-semibold uppercase tracking-wide text-charcoal/70 transition-colors hover:bg-cream">Huỷ</button>
                <button onClick={submitBooking} disabled={submitting} className="rounded-sm bg-gold px-8 py-2.5 font-nav text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gold-hover disabled:opacity-60">
                  {submitting ? 'Đang xử lý...' : 'Xác nhận đặt'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default BookingPage;
