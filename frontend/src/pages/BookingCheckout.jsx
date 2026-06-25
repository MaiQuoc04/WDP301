import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PayOSQRCode from '../components/PayOSQRCode';
import { customerService } from '../services';
import { socket, connectSocket } from '../services/socketService';
import './BookingCheckout.css';

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
    <span className="bkco-expire expired">⌛ Mã QR đã hết hạn — tạo lại để thanh toán</span>
  );
  return (
    <span className={`bkco-expire ${urgent ? 'urgent' : ''}`}>
      ⏱ Mã hết hạn sau {m}:{String(s).padStart(2, '0')}
    </span>
  );
}

/* ── Main ───────────────────────────────────────────────────────── */
const BookingCheckout = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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
    <div className="bkco-loading">
      <div className="bkco-spinner" />
      <p>Đang tải thông tin đơn đặt phòng...</p>
    </div>
  );
  if (!booking) return (
    <div className="bkco-loading"><p>Không tìm thấy đơn đặt phòng.</p></div>
  );

  const isPending   = booking.status === 'pending';
  const isConfirmed = ['confirmed', 'checked_in', 'checked_out', 'completed'].includes(booking.status);

  return (
    <div className="bkco-page">
      <Navbar />

      <div className="bkco-container">
        <div className="bkco-header">
          <h1>Xác nhận &amp; Thanh toán</h1>
          <p className="bkco-sub">Mã đặt phòng: <strong>{booking.code}</strong></p>
        </div>

        <div className="bkco-grid">

          {/* ── Cột trái: Thông tin ── */}
          <div className="bkco-card bkco-info-card">
            <div className="bkco-card-title">
              <span className="bkco-card-icon">🏨</span>
              Thông tin lưu trú
            </div>

            <div className="bkco-info-row">
              <span>Khách hàng</span>
              <strong>{booking.guestName}</strong>
            </div>
            {booking.guestPhone && (
              <div className="bkco-info-row">
                <span>Số điện thoại</span>
                <strong>{booking.guestPhone}</strong>
              </div>
            )}
            <div className="bkco-divider" />
            <div className="bkco-info-row">
              <span>Chi nhánh</span>
              <strong>{booking.branch?.name}</strong>
            </div>
            <div className="bkco-info-row">
              <span>Hạng phòng</span>
              <strong>{booking.roomType?.name}</strong>
            </div>
            <div className="bkco-info-row">
              <span>Ngày nhận phòng</span>
              <strong>{new Date(booking.checkIn).toLocaleDateString('vi-VN')}</strong>
            </div>
            <div className="bkco-info-row">
              <span>Ngày trả phòng</span>
              <strong>{new Date(booking.checkOut).toLocaleDateString('vi-VN')}</strong>
            </div>
            <div className="bkco-info-row">
              <span>Số khách</span>
              <strong>{booking.adults} người lớn{booking.children > 0 ? `, ${booking.children} trẻ em` : ''}</strong>
            </div>
            <div className="bkco-divider" />
            <div className="bkco-status-badge" data-status={booking.status}>
              {booking.status === 'pending'    && '⏳ Chờ thanh toán cọc'}
              {booking.status === 'confirmed'  && '✅ Đã xác nhận — chờ nhận phòng'}
              {booking.status === 'checked_in' && '🏠 Đang lưu trú'}
              {booking.status === 'checked_out'&& '✔ Đã trả phòng'}
              {booking.status === 'completed'  && '🎉 Hoàn thành'}
              {booking.status === 'cancelled'  && '❌ Đã huỷ'}
            </div>
          </div>

          {/* ── Cột phải: Chi phí & Thanh toán ── */}
          <div className="bkco-card bkco-pay-card">
            <div className="bkco-card-title">
              <span className="bkco-card-icon">💳</span>
              Thanh toán
            </div>

            {/* Tổng quan chi phí */}
            <div className="bkco-cost-rows">
              <div className="bkco-cost-row">
                <span>Tiền phòng</span>
                <span>{fmtPrice(booking.roomCharge)}</span>
              </div>
              {booking.extraServicesTotal > 0 && (
                <div className="bkco-cost-row">
                  <span>Dịch vụ thêm</span>
                  <span>{fmtPrice(booking.extraServicesTotal)}</span>
                </div>
              )}
              <div className="bkco-cost-row total">
                <span>TỔNG TIỀN</span>
                <span>{fmtPrice(booking.totalAmount)}</span>
              </div>
              <div className="bkco-cost-row deposit">
                <span>Tiền cọc cần đặt</span>
                <span>{fmtPrice(booking.depositAmount)}</span>
              </div>
              {booking.paidAmount > 0 && (
                <div className="bkco-cost-row paid">
                  <span>Đã thanh toán</span>
                  <span>{fmtPrice(booking.paidAmount)}</span>
                </div>
              )}
            </div>

            {/* ── Trạng thái đã thanh toán ── */}
            {(isConfirmed || paymentDone) && (
              <div className="bkco-done-banner">
                <div className="bkco-done-icon">✅</div>
                <div>
                  <strong>Đặt phòng đã được xác nhận!</strong>
                  <p>Chúng tôi đã ghi nhận thanh toán của bạn.</p>
                </div>
              </div>
            )}

            {/* ── Chưa thanh toán: hiện nút/QR ── */}
            {isPending && !paymentDone && (
              <div className="bkco-pay-section">
                {!paymentData ? (
                  /* Chọn kiểu thanh toán */
                  <div className="bkco-btn-group">
                    <p className="bkco-pay-hint">Chọn hình thức thanh toán cọc:</p>
                    <button
                      className="bkco-btn-qr"
                      onClick={() => handlePayment('deposit')}
                      disabled={processingPay}
                      id="btn-pay-deposit"
                    >
                      {processingPay ? (
                        <><span className="bkco-btn-spinner" /> Đang tạo QR...</>
                      ) : (
                        <>
                          <span className="bkco-btn-icon">📱</span>
                          <span>
                            <strong>Thanh toán cọc qua QR</strong>
                            <small>{fmtPrice(booking.depositAmount)}</small>
                          </span>
                        </>
                      )}
                    </button>

                    <div className="bkco-or-divider"><span>hoặc</span></div>

                    <button
                      className="bkco-btn-full"
                      onClick={() => handlePayment('full')}
                      disabled={processingPay}
                      id="btn-pay-full"
                    >
                      {processingPay ? (
                        <><span className="bkco-btn-spinner" /> Đang tạo QR...</>
                      ) : (
                        <>
                          <span className="bkco-btn-icon">💎</span>
                          <span>
                            <strong>Thanh toán toàn bộ qua QR</strong>
                            <small>{fmtPrice(booking.totalAmount)}</small>
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  /* Hiển thị QR */
                  <div className="bkco-qr-box">
                    <div className="bkco-qr-top">
                      <div className="bkco-qr-amount">{fmtPrice(paymentData.amount)}</div>
                      {expireAt.current && <QRCountdown expireMs={expireAt.current} />}
                    </div>

                    <div className="bkco-qr-frame">
                      <PayOSQRCode
                        value={paymentData.qrCode}
                        size={220}
                        imageClassName="bkco-qr-img"
                        qrClassName="bkco-qr-img"
                        placeholderClassName="bkco-qr-noimg"
                        alt="QR thanh toan PayOS"
                      />
                    </div>

                    <p className="bkco-qr-guide">
                      Mở <strong>App ngân hàng</strong> → Quét mã QR → Xác nhận thanh toán
                    </p>

                    {paymentData.checkoutUrl && paymentData.checkoutUrl !== '#' && (
                      <a
                        href={paymentData.checkoutUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bkco-link-btn"
                        id="btn-open-payos"
                      >
                        Hoặc mở trang thanh toán PayOS ↗
                      </a>
                    )}

                    <div className="bkco-qr-polling">
                      <span className="bkco-polling-dot" /> Đang chờ xác nhận thanh toán...
                    </div>

                    <button className="bkco-cancel-btn" onClick={cancelQR}>
                      ← Chọn hình thức khác
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BookingCheckout;
