import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PayOSQRCode from '../components/PayOSQRCode';
import { customerService } from '../services';
import { socket, connectSocket } from '../services/socketService';

/* ── Countdown timer cho QR ─────────────────────────────────────── */
function QRCountdown({ expireMs }) {
  const [left, setLeft] = useState(Math.max(0, expireMs - Date.now()));
  useEffect(() => {
    const t = setInterval(() => setLeft(Math.max(0, expireMs - Date.now())), 1000);
    return () => clearInterval(t);
  }, [expireMs]);
  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  if (left <= 0) return <span className="font-nav text-xs font-semibold text-red-600">⌛ Mã QR đã hết hạn — tạo lại để thanh toán</span>;
  return (
    <span className={`font-nav text-xs font-semibold ${left < 60000 ? 'text-red-600' : 'text-charcoal/60'}`}>
      ⏱ Mã hết hạn sau {m}:{String(s).padStart(2, '0')}
    </span>
  );
}

/* ── Countdown giữ chỗ (hạn thanh toán cọc của cả nhóm) ──────────── */
function HoldCountdown({ expireMs, onExpire }) {
  const [left, setLeft] = useState(Math.max(0, expireMs - Date.now()));
  const fired = useRef(false);
  useEffect(() => {
    fired.current = false;
    setLeft(Math.max(0, expireMs - Date.now()));
    const t = setInterval(() => {
      const l = Math.max(0, expireMs - Date.now());
      setLeft(l);
      if (l <= 0 && !fired.current) { fired.current = true; onExpire && onExpire(); }
    }, 1000);
    return () => clearInterval(t);
  }, [expireMs, onExpire]);
  if (left <= 0) return <strong className="text-red-600">đã hết hạn</strong>;
  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return <strong className={left < 120000 ? 'text-red-600' : 'text-amber-800'}>{m}:{String(s).padStart(2, '0')}</strong>;
}

const STATUS = {
  pending:     { label: '⏳ Chờ thanh toán cọc',          cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  confirmed:   { label: '✅ Đã xác nhận — chờ nhận phòng', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  checked_in:  { label: '🏠 Đang lưu trú',                 cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  checked_out: { label: '✔ Đã trả phòng',                 cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  completed:   { label: '🎉 Hoàn thành',                   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled:   { label: '❌ Đã huỷ',                       cls: 'bg-red-50 text-red-600 border-red-200' },
};

const fmtPrice = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

/* ── Main ───────────────────────────────────────────────────────── */
const BookingGroupCheckout = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);          // { group, members, payments, rollup }
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [processingPay, setProcessingPay] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [expired, setExpired] = useState(false);   // hết hạn giữ chỗ (server báo qua socket, hoặc đồng hồ về 0)
  const expireAt = useRef(null);

  const fetchGroup = useCallback(async () => {
    try {
      const res = await customerService.getBookingGroup(id);
      if (res.success) {
        setData(res.data);
        const r = res.data.rollup || {};
        if (['confirmed', 'checked_in', 'checked_out', 'completed'].includes(r.status) || ['partial', 'paid'].includes(r.paymentStatus)) {
          setPaymentDone(true);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi tải nhóm đặt phòng');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchGroup(); }, [fetchGroup]);

  // Return từ PayOS
  useEffect(() => {
    if (searchParams.get('payos') === 'success') { setPaymentDone(true); fetchGroup(); }
  }, [searchParams, fetchGroup]);

  // Socket: payment_success cho group
  useEffect(() => {
    connectSocket();
    const onPaySuccess = (evt) => {
      if (!evt?.groupId) return;
      if (String(evt.groupId?._id ?? evt.groupId) === String(id)) { setPaymentDone(true); fetchGroup(); }
    };
    socket.on('payment_success', onPaySuccess);
    return () => socket.off('payment_success', onPaySuccess);
  }, [id, fetchGroup]);

  // Một đồng hồ duy nhất (group.expiresAt): dưới 1 phút -> cảnh báo đỏ; về 0 -> QR cũng chết theo, coi như hết hạn.
  const [urgent, setUrgent] = useState(false);
  useEffect(() => {
    const exp = data?.group?.expiresAt ? new Date(data.group.expiresAt).getTime() : null;
    if (!exp) { setUrgent(false); return undefined; }
    const tick = () => {
      const left = exp - Date.now();
      setUrgent(left > 0 && left <= 60 * 1000);
      if (left <= 0) setExpired(true);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [data]);

  // Polling khi đang hiển thị QR (GET group tự sync PayOS ở backend)
  useEffect(() => {
    if (!paymentData || paymentDone) return undefined;
    const timer = setInterval(fetchGroup, 5000);
    return () => clearInterval(timer);
  }, [paymentData, paymentDone, fetchGroup]);

  // Realtime: 1 phòng trong nhóm đổi (vd job tự huỷ khi quá hạn giữ chỗ) -> cập nhật trạng thái ngay.
  const memberIdsRef = useRef([]);
  const branchIdRef = useRef(null);
  useEffect(() => {
    memberIdsRef.current = (data?.members || []).map((m) => String(m._id));
    branchIdRef.current = data?.group?.branch?._id ? String(data.group.branch._id) : null;
  }, [data]);
  useEffect(() => {
    connectSocket();
    const onUpd = (evt) => { if (evt?.bookingId && memberIdsRef.current.includes(String(evt.bookingId))) fetchGroup(); };
    // Admin khoá/mở chi nhánh của đơn này -> cập nhật ngay để hiện/ẩn cảnh báo (không cần reload).
    const onBranch = (evt) => { if (evt?.branchId && branchIdRef.current && String(evt.branchId) === branchIdRef.current) fetchGroup(); };
    // Hết hạn giữ chỗ: server đã huỷ thật -> báo ngay, không để khách ngồi quét QR đã chết.
    const onExpired = (evt) => {
      const hit = (evt?.groupId && String(evt.groupId) === String(id))
        || (evt?.bookingId && memberIdsRef.current.includes(String(evt.bookingId)));
      if (hit) { setExpired(true); setPaymentData(null); fetchGroup(); }
    };
    socket.on('booking_updated', onUpd);
    socket.on('branch_updated', onBranch);
    socket.on('booking_expired', onExpired);
    return () => { socket.off('booking_updated', onUpd); socket.off('branch_updated', onBranch); socket.off('booking_expired', onExpired); };
  }, [fetchGroup, id]);

  // Rời trang khi CHƯA cọc -> nhả giữ chỗ NGAY (không đợi timeout). Chỉ đúng khi còn phòng pending & chưa thanh toán.
  const releaseRef = useRef(false);
  useEffect(() => {
    const pending = (data?.members || []).some((m) => m.status === 'pending');
    releaseRef.current = pending && !paymentDone;
  }, [data, paymentDone]);
  useEffect(() => () => {
    if (releaseRef.current) customerService.cancelBookingGroup(id).catch(() => {});
  }, [id]);

  const handlePayment = async (type) => {
    try {
      setProcessingPay(true); setPaymentData(null);
      const res = await customerService.createGroupPaymentLink(id, type);
      if (res.success) { setPaymentData(res.data); expireAt.current = new Date(res.data.expiresAt).getTime(); } // mốc backend kẹp (<= hạn giữ chỗ)
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi tạo liên kết thanh toán');
    } finally { setProcessingPay(false); }
  };
  const cancelQR = () => { setPaymentData(null); expireAt.current = null; };
  // Quay lại chọn phòng: nếu chưa cọc thì HUỶ GIỮ CHỖ ngay rồi mới điều hướng.
  const handleBackToList = async () => {
    releaseRef.current = false; // tránh cleanup gọi lại lần 2
    const pending = (data?.members || []).some((m) => m.status === 'pending');
    if (pending && !paymentDone) { try { await customerService.cancelBookingGroup(id); } catch { /* ignore */ } }
    navigate('/booking');
  };

  if (loading) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-off-white">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
      <p className="font-body text-charcoal/60">Đang tải nhóm đặt phòng...</p>
    </div>
  );
  if (!data) return (
    <div className="flex min-h-screen items-center justify-center bg-off-white font-body text-charcoal/60">Không tìm thấy nhóm đặt phòng.</div>
  );

  const { group, members, rollup } = data;
  const statusInfo = STATUS[rollup.status];
  const nights = Math.max(1, Math.round((new Date(group.checkOut) - new Date(group.checkIn)) / 86400000));
  const depositPct = rollup.totalAmount ? Math.round((rollup.depositAmount / rollup.totalAmount) * 100) : 0;
  const isPending = members.some((m) => m.status === 'pending');
  const isConfirmed = ['confirmed', 'checked_in', 'checked_out', 'completed'].includes(rollup.status);

  return (
    <div className="min-h-screen bg-off-white">
      <Navbar />
      <div className="mx-auto max-w-5xl px-5 py-12 lg:py-16">
        <button onClick={handleBackToList} className="mb-6 font-nav text-xs font-semibold uppercase tracking-wide text-charcoal/55 transition-colors hover:text-gold">
          ← {isPending && !paymentDone ? 'Quay lại chọn phòng (huỷ giữ chỗ)' : 'Về trang đặt phòng'}
        </button>
        <div className="mb-10 text-center">
          <span className="font-nav text-xs font-semibold uppercase tracking-luxe text-gold">Hoàn tất đặt phòng</span>
          <h1 className="mt-3 font-display text-4xl font-medium text-charcoal md:text-5xl">Xác nhận &amp; Thanh toán</h1>
          <p className="mt-3 font-body text-sm text-charcoal/60">Mã nhóm: <strong className="text-charcoal">{group.code}</strong> · {rollup.roomCount} phòng</p>
        </div>

        {group.branch && group.branch.isActive === false && (
          <div className="mb-8 rounded-md border border-amber-300 bg-amber-50 px-5 py-4 text-center font-body text-sm text-amber-800">
            ⚠ Chi nhánh <strong>{group.branch.name}</strong> đang tạm ngừng hoạt động. Đơn của bạn có thể bị ảnh hưởng — vui lòng liên hệ khách sạn để được hỗ trợ.
          </div>
        )}

        {/* Đếm ngược HẠN GIỮ CHỖ — cũng chính là hạn của mã QR (một đồng hồ duy nhất).
            Còn dưới 1 phút: cả khung chuyển đỏ để khách thấy ngay là sắp hết giờ. */}
        {isPending && !paymentDone && !expired && group.expiresAt && (
          <div className={`mb-8 rounded-md border px-5 py-4 text-center font-body text-sm ${
            urgent ? 'border-red-400 bg-red-50 text-red-700' : 'border-amber-300 bg-amber-50 text-amber-800'}`}>
            {urgent ? '⚠️ Sắp hết giờ! Giữ chỗ còn ' : '⏳ Giữ chỗ còn '}
            <HoldCountdown expireMs={new Date(group.expiresAt).getTime()} onExpire={() => { setExpired(true); fetchGroup(); }} />
            {urgent
              ? ' — thanh toán ngay, hết giờ là đơn bị huỷ.'
              : <> — quá hạn hệ thống sẽ <strong>tự huỷ</strong> đặt phòng. Vui lòng thanh toán cọc để giữ phòng.</>}
          </div>
        )}

        {/* Hết hạn: QR (nếu có) cũng đã chết theo -> không cho quét tiếp, mời khách chọn phòng lại. */}
        {expired && !paymentDone && rollup.status !== 'confirmed' && (
          <div className="mb-8 rounded-md border border-red-300 bg-red-50 px-5 py-6 text-center font-body text-sm text-red-700">
            <p className="mb-3 text-base font-semibold">⌛ Đã hết thời gian giữ chỗ</p>
            <p className="mb-4">Đơn đặt phòng đã được huỷ và các phòng đã mở lại cho khách khác. Bạn không bị trừ tiền.</p>
            <button onClick={() => navigate('/booking')} className="rounded-sm bg-red-600 px-5 py-2.5 font-nav text-xs font-semibold uppercase tracking-wide text-white hover:bg-red-700">
              ← Chọn phòng lại
            </button>
          </div>
        )}

        {/* Nhóm đã bị huỷ (quá hạn giữ chỗ) */}
        {rollup.status === 'cancelled' && (
          <div className="mb-8 rounded-md border border-red-300 bg-red-50 px-5 py-4 text-center font-body text-sm text-red-700">
            ⌛ Đơn đã hết hạn giữ chỗ và bị huỷ. Vui lòng <a href="/booking" className="font-semibold underline">đặt phòng lại</a>.
          </div>
        )}

        <div className="grid gap-7 lg:grid-cols-2">
          {/* ── Cột trái: Thông tin ── */}
          <div className="rounded-lg border border-black/5 bg-white p-7 shadow-raised">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 font-display text-2xl font-semibold text-charcoal">
                <span className="text-gold">🏨</span> Thông tin lưu trú
              </div>
              {statusInfo && <span className={`shrink-0 rounded-full border px-3 py-1 font-nav text-[11px] font-semibold ${statusInfo.cls}`}>{statusInfo.label}</span>}
            </div>
            <div className="mt-2 h-px w-16 bg-gold" />

            <div className="mt-5 divide-y divide-black/5 font-body text-sm">
              <div className="flex justify-between py-2"><span className="text-charcoal/55">Khách hàng</span><strong>{group.guestName}</strong></div>
              {group.guestPhone && <div className="flex justify-between py-2"><span className="text-charcoal/55">Số điện thoại</span><strong>{group.guestPhone}</strong></div>}
              <div className="flex justify-between py-2"><span className="text-charcoal/55">Số khách</span><strong>{group.adultsTotal} người lớn{group.childrenTotal > 0 ? `, ${group.childrenTotal} trẻ em` : ''}</strong></div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-black/5 pt-5">
              <div>
                <div className="font-nav text-[10px] font-semibold uppercase tracking-wide text-charcoal/45">Ngày nhận phòng</div>
                <div className="mt-1 font-body text-sm font-medium text-charcoal">{new Date(group.checkIn).toLocaleDateString('vi-VN')}</div>
                <div className="font-body text-xs text-charcoal/50">14:00</div>
              </div>
              <div>
                <div className="font-nav text-[10px] font-semibold uppercase tracking-wide text-charcoal/45">Ngày trả phòng</div>
                <div className="mt-1 font-body text-sm font-medium text-charcoal">{new Date(group.checkOut).toLocaleDateString('vi-VN')}</div>
                <div className="font-body text-xs text-charcoal/50">12:00</div>
              </div>
            </div>

            {/* Danh sách phòng */}
            <div className="mt-5 border-t border-black/5 pt-5">
              <div className="mb-2 font-nav text-[11px] font-semibold uppercase tracking-wide text-charcoal/50">Các phòng ({nights} đêm)</div>
              <div className="space-y-1.5">
                {members.map((m) => (
                  <div key={m._id} className="flex items-center justify-between font-body text-sm">
                    <span className="text-charcoal/75">
                      {m.roomType?.name}{m.room?.roomNumber ? ` · phòng ${m.room.roomNumber}` : ''}
                      <span className="text-charcoal/45"> · {m.adults}NL{m.children > 0 ? `+${m.children}TE` : ''}</span>
                    </span>
                    <span className="font-medium text-charcoal">{fmtPrice(m.totalAmount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Cột phải: Thanh toán ── */}
          <div className="rounded-lg border border-black/5 bg-white p-7 shadow-raised">
            <div className="flex items-center gap-2 font-display text-2xl font-semibold text-charcoal">
              <span className="text-gold">💳</span> Thanh toán
            </div>
            <div className="mt-2 h-px w-16 bg-gold" />

            <div className="mt-5 space-y-1">
              <div className="flex justify-between border-t border-black/10 pt-3 font-nav text-sm font-bold uppercase tracking-wide text-charcoal">
                <span>Tổng nhóm ({rollup.roomCount} phòng)</span><span>{fmtPrice(rollup.totalAmount)}</span>
              </div>
              {rollup.paidAmount > 0 && (
                <div className="flex justify-between py-1.5 font-body text-sm text-emerald-600"><span>Đã thanh toán</span><span>{fmtPrice(rollup.paidAmount)}</span></div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-md bg-cream px-5 py-4">
              <span className="font-nav text-xs font-semibold uppercase tracking-wide text-charcoal/70">Tiền cọc cần đặt{depositPct ? ` (${depositPct}%)` : ''}</span>
              <span className="font-display text-2xl font-semibold text-gold">{fmtPrice(rollup.depositAmount)}</span>
            </div>

            {(isConfirmed || paymentDone) && (
              <div className="mt-6 flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4">
                <div className="text-2xl">✅</div>
                <div>
                  <strong className="block text-emerald-800">Nhóm đặt phòng đã được xác nhận!</strong>
                  <p className="font-body text-sm text-emerald-700">Chúng tôi đã ghi nhận thanh toán của bạn.</p>
                </div>
              </div>
            )}

            {isPending && !paymentDone && !expired && !paymentData && (
              <div className="mt-6">
                <p className="mb-3 font-body text-sm text-charcoal/60">Chọn hình thức thanh toán cọc gom:</p>
                <button onClick={() => handlePayment('deposit')} disabled={processingPay}
                  className="flex w-full items-center gap-3 rounded-md border border-gold bg-gold px-5 py-4 text-left text-white transition-colors hover:bg-gold-hover disabled:opacity-60">
                  {processingPay ? (
                    <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Đang tạo QR...</>
                  ) : (
                    <><span className="text-2xl">📱</span><span className="flex flex-col">
                      <strong className="font-nav text-sm font-semibold uppercase tracking-wide">Thanh toán cọc qua QR</strong>
                      <small className="font-body text-sm opacity-90">{fmtPrice(rollup.depositAmount)}</small>
                    </span></>
                  )}
                </button>

                <div className="my-4 flex items-center gap-3 font-nav text-xs uppercase tracking-wide text-charcoal/40">
                  <span className="h-px flex-1 bg-black/10" /> hoặc <span className="h-px flex-1 bg-black/10" />
                </div>

                <button onClick={() => handlePayment('full')} disabled={processingPay}
                  className="flex w-full items-center gap-3 rounded-md border border-gold px-5 py-4 text-left text-charcoal transition-colors hover:bg-cream disabled:opacity-60">
                  {processingPay ? (
                    <><span className="h-4 w-4 animate-spin rounded-full border-2 border-gold/40 border-t-gold" /> Đang tạo QR...</>
                  ) : (
                    <><span className="text-2xl">💎</span><span className="flex flex-col">
                      <strong className="font-nav text-sm font-semibold uppercase tracking-wide text-gold">Thanh toán toàn bộ qua QR</strong>
                      <small className="font-body text-sm text-charcoal/60">{fmtPrice(rollup.totalAmount)}</small>
                    </span></>
                  )}
                </button>
              </div>
            )}

            {isPending && !paymentDone && !expired && paymentData && (
              <div className="mt-6 rounded-md bg-cream/70 px-5 py-4 text-center font-body text-sm text-charcoal/70">
                Mã QR đã sẵn sàng — vui lòng quét mã <strong>bên dưới</strong> để hoàn tất.
              </div>
            )}
          </div>
        </div>

        {/* QR */}
        {isPending && !paymentDone && !expired && paymentData && (
          <div className="mx-auto mt-7 max-w-xl rounded-lg border border-black/5 bg-white p-8 text-center shadow-raised">
            <h2 className="font-display text-2xl font-semibold text-charcoal">Quét mã để thanh toán</h2>
            <p className="mt-2 font-body text-sm text-charcoal/55">Dùng ứng dụng ngân hàng để quét mã QR bên dưới</p>
            <div className="mx-auto mt-6 w-fit rounded-lg bg-white p-4 shadow-subtle ring-1 ring-black/5">
              <PayOSQRCode value={paymentData.qrCode} size={220}
                imageClassName="h-[220px] w-[220px] object-contain"
                qrClassName="flex items-center justify-center"
                placeholderClassName="flex h-[220px] w-[220px] items-center justify-center text-sm text-charcoal/40"
                alt="QR thanh toan PayOS" />
            </div>
            <div className="mt-5 font-display text-3xl font-semibold text-gold">{fmtPrice(paymentData.amount)}</div>
            {expireAt.current && <div className="mt-1"><QRCountdown expireMs={expireAt.current} /></div>}
            {paymentData.checkoutUrl && paymentData.checkoutUrl !== '#' && (
              <a href={paymentData.checkoutUrl} target="_blank" rel="noreferrer"
                className="mt-5 inline-block font-nav text-xs font-semibold uppercase tracking-wide text-gold transition-colors hover:text-gold-hover">
                Hoặc mở trang thanh toán PayOS ↗
              </a>
            )}
            <div className="mt-5 flex items-center justify-center gap-2 font-body text-sm text-charcoal/55">
              <span className="h-2 w-2 animate-pulse rounded-full bg-gold" /> Đang chờ xác nhận thanh toán...
            </div>
            <button onClick={cancelQR} className="mt-4 font-nav text-xs font-semibold uppercase tracking-wide text-charcoal/50 transition-colors hover:text-charcoal">
              ← Chọn hình thức khác
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default BookingGroupCheckout;
