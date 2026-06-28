import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
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
  const urgent = left < 60000;
  if (left <= 0) return (
    <span className="font-nav text-xs font-semibold text-red-600">⌛ Mã QR đã hết hạn — tạo lại để thanh toán</span>
  );
  return (
    <span className={`font-nav text-xs font-semibold ${urgent ? 'text-red-600' : 'text-charcoal/60'}`}>
      ⏱ Mã hết hạn sau {m}:{String(s).padStart(2, '0')}
    </span>
  );
}

/* ── Status badge style ─────────────────────────────────────────── */
const STATUS = {
  pending:     { label: '⏳ Chờ thanh toán cọc',         cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  confirmed:   { label: '✅ Đã xác nhận — chờ nhận phòng', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  checked_in:  { label: '🏠 Đang lưu trú',                cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  checked_out: { label: '✔ Đã trả phòng',                cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  completed:   { label: '🎉 Hoàn thành',                  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled:   { label: '❌ Đã huỷ',                      cls: 'bg-red-50 text-red-600 border-red-200' },
};

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 py-2 font-body text-sm">
    <span className="text-charcoal/55">{label}</span>
    <strong className="text-right font-medium text-charcoal">{value}</strong>
  </div>
);

/* ── Main ───────────────────────────────────────────────────────── */
const BookingCheckout = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const [booking, setBooking]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [paymentData, setPaymentData]   = useState(null);   // { qrCode, checkoutUrl, amount, orderCode }
  const [processingPay, setProcessingPay] = useState(false);
  const [paymentDone, setPaymentDone]   = useState(false);
  const expireAt = useRef(null);

  /* Fetch booking detail */
  const fetchBooking = useCallback(async () => {
    try {
      const res = await customerService.getBookingDetail(id);
      if (res.success) {
        setBooking(res.data);
        if (['confirmed', 'checked_in', 'checked_out', 'completed'].includes(res.data.status) || ['partial', 'paid'].includes(res.data.paymentStatus)) {
          setPaymentDone(true);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi tải chi tiết đơn');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchBooking(); }, [fetchBooking]);

  /* Phát hiện return từ PayOS (query ?payos=success) */
  useEffect(() => {
    if (searchParams.get('payos') === 'success') {
      setPaymentDone(true);
      fetchBooking();
    }
  }, [searchParams, fetchBooking]);

  /* Socket: tự cập nhật khi PayOS webhook confirm thành công */
  useEffect(() => {
    connectSocket();
    const onPaySuccess = (evt) => {
      if (!evt?.bookingId) return;
      const evtId = String(evt.bookingId?._id ?? evt.bookingId);
      if (evtId === String(id)) {
        setPaymentDone(true);
        fetchBooking();
      }
    };
    socket.on('payment_success', onPaySuccess);
    return () => socket.off('payment_success', onPaySuccess);
  }, [id, fetchBooking]);

  useEffect(() => {
    if (!paymentData || paymentDone) return undefined;
    const timer = setInterval(fetchBooking, 5000);
    return () => clearInterval(timer);
  }, [paymentData, paymentDone, fetchBooking]);

  const fmtPrice = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

  /* Tạo QR PayOS -------------------------------------------------- */
  const handlePayment = async (type) => {
    try {
      setProcessingPay(true);
      setPaymentData(null);
      const res = await customerService.createPaymentLink(id, type);
      if (res.success) {
        setPaymentData(res.data);
        expireAt.current = Date.now() + 15 * 60 * 1000; // 15 phút
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi tạo liên kết thanh toán');
    } finally {
      setProcessingPay(false);
    }
  };

  /* Huỷ QR -------------------------------------------------------- */
  const cancelQR = () => { setPaymentData(null); expireAt.current = null; };

  if (loading) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-off-white">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
      <p className="font-body text-charcoal/60">Đang tải thông tin đơn đặt phòng...</p>
    </div>
  );
  if (!booking) return (
    <div className="flex min-h-screen items-center justify-center bg-off-white font-body text-charcoal/60">Không tìm thấy đơn đặt phòng.</div>
  );

  const isPending   = booking.status === 'pending';
  const isConfirmed = ['confirmed', 'checked_in', 'checked_out', 'completed'].includes(booking.status);
  const statusInfo  = STATUS[booking.status];
  const nights      = Math.max(1, Math.round((new Date(booking.checkOut) - new Date(booking.checkIn)) / 86400000));
  const depositPct  = booking.totalAmount ? Math.round((booking.depositAmount / booking.totalAmount) * 100) : 0;

  return (
    <div className="min-h-screen bg-off-white">
      <Navbar />

      <div className="mx-auto max-w-5xl px-5 py-12 lg:py-16">
        {/* Header */}
        <div className="mb-10 text-center">
          <span className="font-nav text-xs font-semibold uppercase tracking-luxe text-gold">Hoàn tất đặt phòng</span>
          <h1 className="mt-3 font-display text-4xl font-medium text-charcoal md:text-5xl">Xác nhận &amp; Thanh toán</h1>
          <p className="mt-3 font-body text-sm text-charcoal/60">Mã đặt phòng: <strong className="text-charcoal">{booking.code}</strong></p>
        </div>

        <div className="grid gap-7 lg:grid-cols-2">
          {/* ── Cột trái: Thông tin lưu trú ── */}
          <div className="rounded-lg border border-black/5 bg-white p-7 shadow-raised">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 font-display text-2xl font-semibold text-charcoal">
                <span className="text-gold">🏨</span> Thông tin lưu trú
              </div>
              {statusInfo && (
                <span className={`shrink-0 rounded-full border px-3 py-1 font-nav text-[11px] font-semibold ${statusInfo.cls}`}>
                  {statusInfo.label}
                </span>
              )}
            </div>
            <div className="mt-2 h-px w-16 bg-gold" />

            <div className="mt-5 divide-y divide-black/5">
              <InfoRow label="Khách hàng" value={booking.guestName} />
              {booking.guestPhone && <InfoRow label="Số điện thoại" value={booking.guestPhone} />}
              <InfoRow label="Chi nhánh" value={booking.branch?.name} />
              <InfoRow label="Hạng phòng" value={booking.roomType?.name} />
              <InfoRow label="Số khách" value={`${booking.adults} người lớn${booking.children > 0 ? `, ${booking.children} trẻ em` : ''}`} />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-black/5 pt-5">
              <div>
                <div className="font-nav text-[10px] font-semibold uppercase tracking-wide text-charcoal/45">Ngày nhận phòng</div>
                <div className="mt-1 font-body text-sm font-medium text-charcoal">{new Date(booking.checkIn).toLocaleDateString('vi-VN')}</div>
                <div className="font-body text-xs text-charcoal/50">14:00</div>
              </div>
              <div>
                <div className="font-nav text-[10px] font-semibold uppercase tracking-wide text-charcoal/45">Ngày trả phòng</div>
                <div className="mt-1 font-body text-sm font-medium text-charcoal">{new Date(booking.checkOut).toLocaleDateString('vi-VN')}</div>
                <div className="font-body text-xs text-charcoal/50">12:00</div>
              </div>
            </div>
          </div>

          {/* ── Cột phải: Chi phí & Thanh toán ── */}
          <div className="rounded-lg border border-black/5 bg-white p-7 shadow-raised">
            <div className="flex items-center gap-2 font-display text-2xl font-semibold text-charcoal">
              <span className="text-gold">💳</span> Thanh toán
            </div>
            <div className="mt-2 h-px w-16 bg-gold" />

            {/* Tổng quan chi phí */}
            <div className="mt-5 space-y-1">
              <div className="flex justify-between py-1.5 font-body text-sm text-charcoal/75">
                <span>Tiền phòng ({nights} đêm)</span><span>{fmtPrice(booking.roomCharge)}</span>
              </div>
              {booking.extraServicesTotal > 0 && (
                <div className="flex justify-between py-1.5 font-body text-sm text-charcoal/75">
                  <span>Dịch vụ thêm</span><span>{fmtPrice(booking.extraServicesTotal)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-black/10 pt-3 font-nav text-sm font-bold uppercase tracking-wide text-charcoal">
                <span>Tổng tiền</span><span>{fmtPrice(booking.totalAmount)}</span>
              </div>
              {booking.paidAmount > 0 && (
                <div className="flex justify-between py-1.5 font-body text-sm text-emerald-600">
                  <span>Đã thanh toán</span><span>{fmtPrice(booking.paidAmount)}</span>
                </div>
              )}
            </div>

            {/* Tiền cọc nổi bật */}
            <div className="mt-4 flex items-center justify-between rounded-md bg-cream px-5 py-4">
              <span className="font-nav text-xs font-semibold uppercase tracking-wide text-charcoal/70">Tiền cọc cần đặt{depositPct ? ` (${depositPct}%)` : ''}</span>
              <span className="font-display text-2xl font-semibold text-gold">{fmtPrice(booking.depositAmount)}</span>
            </div>

            {/* ── Trạng thái đã thanh toán ── */}
            {(isConfirmed || paymentDone) && (
              <div className="mt-6 flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4">
                <div className="text-2xl">✅</div>
                <div>
                  <strong className="block text-emerald-800">Đặt phòng đã được xác nhận!</strong>
                  <p className="font-body text-sm text-emerald-700">Chúng tôi đã ghi nhận thanh toán của bạn.</p>
                </div>
              </div>
            )}

            {/* ── Chưa thanh toán: nút chọn hình thức ── */}
            {isPending && !paymentDone && !paymentData && (
              <div className="mt-6">
                <p className="mb-3 font-body text-sm text-charcoal/60">Chọn hình thức thanh toán cọc:</p>
                <button
                  onClick={() => handlePayment('deposit')}
                  disabled={processingPay}
                  id="btn-pay-deposit"
                  className="flex w-full items-center gap-3 rounded-md border border-gold bg-gold px-5 py-4 text-left text-white transition-colors hover:bg-gold-hover disabled:opacity-60"
                >
                  {processingPay ? (
                    <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Đang tạo QR...</>
                  ) : (
                    <>
                      <span className="text-2xl">📱</span>
                      <span className="flex flex-col">
                        <strong className="font-nav text-sm font-semibold uppercase tracking-wide">Thanh toán cọc qua QR</strong>
                        <small className="font-body text-sm opacity-90">{fmtPrice(booking.depositAmount)}</small>
                      </span>
                    </>
                  )}
                </button>

                <div className="my-4 flex items-center gap-3 font-nav text-xs uppercase tracking-wide text-charcoal/40">
                  <span className="h-px flex-1 bg-black/10" /> hoặc <span className="h-px flex-1 bg-black/10" />
                </div>

                <button
                  onClick={() => handlePayment('full')}
                  disabled={processingPay}
                  id="btn-pay-full"
                  className="flex w-full items-center gap-3 rounded-md border border-gold px-5 py-4 text-left text-charcoal transition-colors hover:bg-cream disabled:opacity-60"
                >
                  {processingPay ? (
                    <><span className="h-4 w-4 animate-spin rounded-full border-2 border-gold/40 border-t-gold" /> Đang tạo QR...</>
                  ) : (
                    <>
                      <span className="text-2xl">💎</span>
                      <span className="flex flex-col">
                        <strong className="font-nav text-sm font-semibold uppercase tracking-wide text-gold">Thanh toán toàn bộ qua QR</strong>
                        <small className="font-body text-sm text-charcoal/60">{fmtPrice(booking.totalAmount)}</small>
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* ── Đã tạo QR: nhắc quét bên dưới ── */}
            {isPending && !paymentDone && paymentData && (
              <div className="mt-6 rounded-md bg-cream/70 px-5 py-4 text-center font-body text-sm text-charcoal/70">
                Mã QR đã sẵn sàng — vui lòng quét mã <strong>bên dưới</strong> để hoàn tất.
              </div>
            )}
          </div>
        </div>

        {/* ── QR thanh toán (card riêng, nổi bật) ── */}
        {isPending && !paymentDone && paymentData && (
          <div className="mx-auto mt-7 max-w-xl rounded-lg border border-black/5 bg-white p-8 text-center shadow-raised">
            <h2 className="font-display text-2xl font-semibold text-charcoal">Quét mã để thanh toán</h2>
            <p className="mt-2 font-body text-sm text-charcoal/55">Vui lòng dùng ứng dụng ngân hàng để quét mã QR bên dưới</p>

            <div className="mx-auto mt-6 w-fit rounded-lg bg-white p-4 shadow-subtle ring-1 ring-black/5">
              <PayOSQRCode
                value={paymentData.qrCode}
                size={220}
                imageClassName="h-[220px] w-[220px] object-contain"
                qrClassName="flex items-center justify-center"
                placeholderClassName="flex h-[220px] w-[220px] items-center justify-center text-sm text-charcoal/40"
                alt="QR thanh toan PayOS"
              />
            </div>

            <div className="mt-5 font-display text-3xl font-semibold text-gold">{fmtPrice(paymentData.amount)}</div>
            {expireAt.current && <div className="mt-1"><QRCountdown expireMs={expireAt.current} /></div>}

            {/* Các bước */}
            <div className="mx-auto mt-6 max-w-sm space-y-3 rounded-md bg-cream p-5 text-left">
              {['Mở App ngân hàng bất kỳ có hỗ trợ VietQR', 'Quét mã QR hiển thị ở trên', 'Xác nhận giao dịch và hoàn tất thanh toán'].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/15 font-nav text-xs font-semibold text-gold">{i + 1}</span>
                  <span className="font-body text-sm text-charcoal/75">{step}</span>
                </div>
              ))}
            </div>

            {paymentData.checkoutUrl && paymentData.checkoutUrl !== '#' && (
              <a
                href={paymentData.checkoutUrl}
                target="_blank"
                rel="noreferrer"
                id="btn-open-payos"
                className="mt-5 inline-block font-nav text-xs font-semibold uppercase tracking-wide text-gold transition-colors hover:text-gold-hover"
              >
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

export default BookingCheckout;
