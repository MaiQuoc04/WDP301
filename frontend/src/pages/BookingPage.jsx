import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { notification } from 'antd';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Reveal from '../components/common/Reveal';
import { customerService } from '../services';
import { socket, connectSocket, disconnectSocket } from '../services/socketService';

// Đặt phòng DATE-FIRST: chọn chi nhánh + ngày + số khách -> tìm phòng TRỐNG (gộp theo loại phòng)
// -> chọn SỐ LƯỢNG từng loại (giỏ) -> đặt 1 nhóm (1 mã, 1 cọc gom). Hệ thống tự chia khách + báo phụ phí.
const fieldCls =
  'w-full rounded-sm border bg-white px-3.5 py-2.5 font-body text-sm text-charcoal outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold/40';
const labelCls = 'mb-1.5 block font-nav text-[11px] font-semibold uppercase tracking-wide text-charcoal/55';

const CHILD_UNIT = 0.5;

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

  // Giỏ chọn phòng: { [roomTypeId]: số lượng }
  const [qty, setQty] = useState({});
  const [quote, setQuote] = useState(null);      // báo giá nhóm từ backend
  const [quoting, setQuoting] = useState(false);

  // Modal xác nhận (nhập tên/SĐT)
  const [showConfirm, setShowConfirm] = useState(false);
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
    setSearching(true); setSearched(true); setQty({}); setQuote(null);
    try {
      // Tìm với party=1 để GIÁ MỖI PHÒNG hiển thị "thuần" (không dính phụ phí của cả nhóm dồn 1 phòng).
      // Phụ phí giường phụ thực tế do quoteBookingGroup tính lại theo phân bổ. (availability không phụ thuộc party)
      const res = await customerService.searchAvailableRooms({ branch: b, checkIn: ci, checkOut: co, adults: 1, children: 0 });
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
      if (!m[k]) m[k] = { total: r.total, perNight: Math.round(r.roomCharge / Math.max(1, r.nights)), nights: r.nights, count: 0 };
      m[k].count++;
      if (r.total < m[k].total) {
        m[k].total = r.total;
        m[k].perNight = Math.round(r.roomCharge / Math.max(1, r.nights));
      }
    }
    return m;
  }, [avail]);

  // Loại phòng hiển thị = catalog có trong kết quả phòng trống
  const displayRooms = useMemo(() => catalog.filter((rt) => availByType[rt._id]), [catalog, availByType]);

  // ── Giỏ: tính cục bộ cho phản hồi tức thì ──
  const qtyOf = (id) => qty[id] || 0;
  const inc = (id, max) => setQty((q) => ({ ...q, [id]: Math.min((q[id] || 0) + 1, max) }));
  const dec = (id) => setQty((q) => ({ ...q, [id]: Math.max((q[id] || 0) - 1, 0) }));

  const selectedRooms = displayRooms.reduce((s, rt) => s + qtyOf(rt._id), 0);
  const capacityTotal = displayRooms.reduce((s, rt) => s + qtyOf(rt._id) * (rt.capacity || 2), 0);
  const partyUnits = displayAdults + displayChildren * CHILD_UNIT;
  const enoughAdults = selectedRooms <= displayAdults;       // mỗi phòng cần ≥1 người lớn
  const enoughCapacity = capacityTotal >= partyUnits;        // đủ chỗ, không phụ phí

  // Báo giá nhóm (debounce) — chỉ gọi khi đã chọn ≥1 phòng và đủ người lớn
  useEffect(() => {
    if (!branch || !checkIn || !checkOut) { setQuote(null); return undefined; }
    const items = displayRooms.filter((rt) => qtyOf(rt._id) > 0).map((rt) => ({ roomTypeId: rt._id, quantity: qtyOf(rt._id) }));
    if (!items.length || !enoughAdults) { setQuote(null); return undefined; }
    let cancelled = false;
    setQuoting(true);
    const t = setTimeout(() => {
      customerService.quoteBookingGroup({ branchId: branch, checkIn, checkOut, items, adults: displayAdults, children: displayChildren })
        .then((res) => { if (!cancelled && res.success) setQuote(res.data); })
        .catch(() => { if (!cancelled) setQuote(null); })
        .finally(() => { if (!cancelled) setQuoting(false); });
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch, checkIn, checkOut, JSON.stringify(qty), displayAdults, displayChildren]);

  const openConfirm = () => {
    if (!token) {
      notification.warning({ message: 'Vui lòng đăng nhập để đặt phòng' });
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }
    if (selectedRooms < 1 || !enoughAdults) return;
    setFormErr({});
    setShowConfirm(true);
  };

  const submitGroup = async () => {
    const e = {};
    if (!guestName.trim() || guestName.trim().length < 2) e.guestName = 'Nhập họ tên hợp lệ';
    if (!/^0\d{9,10}$/.test(guestPhone.trim())) e.guestPhone = 'SĐT không hợp lệ (VD: 0987654321)';
    setFormErr(e);
    if (Object.keys(e).length) return;
    const items = displayRooms.filter((rt) => qtyOf(rt._id) > 0).map((rt) => ({ roomTypeId: rt._id, quantity: qtyOf(rt._id) }));
    setSubmitting(true);
    try {
      const res = await customerService.createBookingGroup({
        branchId: branch, checkIn, checkOut, items,
        adults: displayAdults, children: displayChildren, guestName, guestPhone,
      });
      if (res.success) { setShowConfirm(false); navigate('/checkout/group/' + res.data.groupId); }
    } catch (err) {
      notification.error({ message: err.response?.data?.message || 'Có lỗi khi đặt phòng' });
    } finally { setSubmitting(false); }
  };

  const branchName = branches.find((b) => b._id === branch)?.name;
  const todayStr = new Date().toISOString().split('T')[0];

  // Thông điệp + màu thanh tóm tắt theo tình huống
  const summary = (() => {
    if (selectedRooms === 0) return { tone: 'muted', text: 'Chọn số lượng phòng để tiếp tục' };
    if (!enoughAdults) return { tone: 'bad', text: `${displayAdults} người lớn không đủ cho ${selectedRooms} phòng — mỗi phòng cần ít nhất 1 người lớn` };
    if (!enoughCapacity) {
      const sc = quote?.totalSurcharge || 0;
      return { tone: 'warn', text: `Thiếu chỗ cho ${displayAdults + displayChildren} khách${sc ? ` → phụ phí giường phụ +${formatPrice(sc)}` : ''} · 💡 thêm phòng để khỏi phụ phí` };
    }
    return { tone: 'ok', text: `Đủ chỗ cho ${displayAdults} người lớn${displayChildren ? ` + ${displayChildren} trẻ em` : ''}` };
  })();
  const summaryColor = { ok: 'text-emerald-700', warn: 'text-amber-700', bad: 'text-red-600', muted: 'text-charcoal/55' }[summary.tone];

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
          <div className="mt-3 font-body text-xs text-charcoal/50">Nhận phòng 14:00 · Trả phòng 12:00 · Giá tính theo đêm · Có thể chọn nhiều phòng trong 1 lần đặt</div>
        </div>
      </div>

      {/* ---------- Kết quả ---------- */}
      <section className="bg-off-white py-16 md:py-20">
        <div className="container mx-auto px-5 lg:px-10">
          {searched && displayRooms.length > 0 && (
            <h2 className="mb-8 font-display text-3xl font-medium text-charcoal md:text-4xl">Phòng trống · chọn số lượng</h2>
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
            <div className="space-y-6 pb-28">
              {displayRooms.map((room) => {
                const a = availByType[room._id];
                const n = qtyOf(room._id);
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
                        <div><span className="text-charcoal/45">Tối đa:</span> {room.capacity || 2} khách / phòng</div>
                      </div>
                    </div>

                    {/* Panel giá + stepper số lượng */}
                    <div className="flex flex-col justify-center border-t border-black/5 bg-off-white/40 p-6 text-right md:border-l md:border-t-0">
                      <span className="font-nav text-[11px] font-semibold uppercase tracking-wide text-charcoal/50">Giá tiêu chuẩn</span>
                      <span className="mt-2 font-display text-2xl font-semibold text-gold">{formatPrice(a.total)}</span>
                      <span className="font-body text-xs text-charcoal/50">{formatPrice(a.perNight)}/đêm · {a.nights} đêm / phòng</span>
                      <span className="mt-2 font-nav text-[11px] font-semibold uppercase tracking-wide text-emerald-600">Còn {a.count} phòng</span>

                      <div className="mt-4 flex items-center justify-end gap-3">
                        <button onClick={() => dec(room._id)} disabled={n === 0}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-black/15 font-display text-xl text-charcoal disabled:opacity-30 hover:border-gold hover:text-gold">−</button>
                        <span className="min-w-8 text-center font-display text-xl font-semibold text-charcoal">{n}</span>
                        <button onClick={() => inc(room._id, a.count)} disabled={n >= a.count}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-black/15 font-display text-xl text-charcoal disabled:opacity-30 hover:border-gold hover:text-gold">+</button>
                      </div>
                      {n > 0 && <span className="mt-2 font-body text-xs text-charcoal/55">{n} phòng = {formatPrice(n * a.total)}</span>}
                    </div>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ---------- Thanh tóm tắt sống (sticky đáy) ---------- */}
      {searched && displayRooms.length > 0 && selectedRooms > 0 && (
        <div className="sticky bottom-0 z-30 border-t border-black/10 bg-white/95 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className={`font-body text-sm font-medium ${summaryColor}`}>
                {summary.tone === 'ok' && '✓ '}{(summary.tone === 'warn' || summary.tone === 'bad') && '⚠ '}{summary.text}
              </div>
              <div className="mt-0.5 font-body text-xs text-charcoal/55">
                Đã chọn <b>{selectedRooms}</b> phòng · sức chứa <b>{capacityTotal}</b> / cần <b>{partyUnits}</b> suất
              </div>
            </div>
            <div className="flex items-center gap-5">
              <div className="text-right">
                <div className="font-body text-xs text-charcoal/55">
                  Tạm tính {quoting ? '…' : formatPrice(quote?.totalAmount)}
                  {quote?.totalSurcharge > 0 && <span className="text-amber-700"> (gồm phụ phí {formatPrice(quote.totalSurcharge)})</span>}
                </div>
                <div className="font-display text-xl font-semibold text-gold">Cọc {quoting ? '…' : formatPrice(quote?.depositAmount)}</div>
              </div>
              <button
                onClick={openConfirm}
                disabled={!enoughAdults || selectedRooms < 1}
                className="rounded-sm bg-gold px-7 py-3 font-nav text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gold-hover disabled:opacity-50"
              >
                Tiếp tục →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Modal xác nhận đặt phòng ---------- */}
      {showConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={() => setShowConfirm(false)}>
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-modal" onClick={(e) => e.stopPropagation()}>
            <div className="px-8 pb-5 pt-8 text-center">
              <h3 className="font-display text-2xl font-semibold text-charcoal md:text-3xl">Xác nhận đặt {selectedRooms} phòng</h3>
              <div className="mx-auto mt-3 h-px w-12 bg-gold" />
            </div>

            <div className="px-8 pb-8">
              {/* Tóm tắt đơn */}
              <div className="rounded-md bg-cream p-6">
                <div className="font-body text-sm text-charcoal/75">
                  <div className="mb-1"><span className="text-charcoal/45">Chi nhánh:</span> <b>{branchName}</b></div>
                  <div className="mb-1"><span className="text-charcoal/45">Thời gian:</span> {new Date(checkIn).toLocaleDateString('vi-VN')} → {new Date(checkOut).toLocaleDateString('vi-VN')} ({quote?.nights || ''} đêm)</div>
                  <div className="mb-3"><span className="text-charcoal/45">Khách:</span> {displayAdults} người lớn{displayChildren ? ` + ${displayChildren} trẻ em` : ''}</div>
                  <div className="space-y-1 border-t border-gold/25 pt-3">
                    {displayRooms.filter((rt) => qtyOf(rt._id) > 0).map((rt) => (
                      <div key={rt._id} className="flex justify-between">
                        <span>{qtyOf(rt._id)}× {rt.name}</span>
                        <span>{formatPrice(qtyOf(rt._id) * (availByType[rt._id]?.total || 0))}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {quote?.totalSurcharge > 0 && (
                  <div className="mt-3 flex justify-between border-t border-gold/25 pt-3 font-body text-sm text-amber-700">
                    <span>Phụ phí giường phụ</span><span>+{formatPrice(quote.totalSurcharge)}</span>
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between border-t border-gold/25 pt-3">
                  <span className="font-nav text-xs font-bold uppercase tracking-wide text-charcoal/70">Tổng cộng</span>
                  <span className="font-display text-2xl font-semibold text-gold">{formatPrice(quote?.totalAmount)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between font-body text-sm text-charcoal/65">
                  <span>Cọc cần đặt</span><span className="font-semibold">{formatPrice(quote?.depositAmount)}</span>
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

              <p className="mt-3 font-body text-xs text-charcoal/50">Hệ thống tự sắp xếp khách vào các phòng để tối ưu chi phí. Bạn sẽ nhận 1 mã đặt phòng và thanh toán cọc gom 1 lần.</p>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button onClick={() => setShowConfirm(false)} className="rounded-sm border border-black/15 px-7 py-2.5 font-nav text-sm font-semibold uppercase tracking-wide text-charcoal/70 transition-colors hover:bg-cream">Huỷ</button>
                <button onClick={submitGroup} disabled={submitting} className="rounded-sm bg-gold px-8 py-2.5 font-nav text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gold-hover disabled:opacity-60">
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
