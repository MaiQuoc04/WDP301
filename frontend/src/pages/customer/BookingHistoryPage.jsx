import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Reveal from '../../components/common/Reveal';
import { customerService } from '../../services';
import { socket, connectSocket } from '../../services/socketService';
import { fmtDate } from '../../utils/date';
import StarRating from '../../components/common/StarRating';
import ReviewModal from '../../components/common/ReviewModal';

const STATUS = {
  pending:     { label: 'Chờ thanh toán cọc', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  confirmed:   { label: 'Đã xác nhận',        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  checked_in:  { label: 'Đang lưu trú',       cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  checked_out: { label: 'Đã trả phòng',       cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  completed:   { label: 'Hoàn thành',         cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled:   { label: 'Đã huỷ',             cls: 'bg-red-50 text-red-600 border-red-200' },
  no_show:     { label: 'Không đến',          cls: 'bg-red-50 text-red-600 border-red-200' },
};

const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

const daysLeft = (iso) => Math.max(0, Math.ceil((new Date(iso) - Date.now()) / 86400000));

const BookingHistoryPage = () => {
  const [bookings, setBookings] = useState([]); // mỗi phần tử = 1 NHÓM đặt phòng
  const [reviewable, setReviewable] = useState({}); // groupId -> lần ở được đánh giá
  const [myReviews, setMyReviews] = useState({});   // groupId -> review đã gửi
  const [reviewing, setReviewing] = useState(null); // lần ở đang mở modal
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth || {});

  // Ai được đánh giá là do BACKEND quyết (online + đã ở xong + trong 14 ngày + chưa đánh giá).
  // FE chỉ hỏi rồi hiện nút — nhân bản luật ra client là kiểu gì cũng lệch.
  const fetchReviews = useCallback(async () => {
    try {
      const [able, mine] = await Promise.all([
        customerService.getReviewableStays(),
        customerService.getMyReviews(),
      ]);
      if (able.success) setReviewable(Object.fromEntries(able.data.map((s) => [String(s.groupId), s])));
      if (mine.success) setMyReviews(Object.fromEntries(mine.data.map((r) => [String(r.group?._id || r.group), r])));
    } catch { /* không có đánh giá thì thôi, đừng chặn cả trang lịch sử */ }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await customerService.getBookingGroupHistory();
      if (res.success) setBookings(res.data);
      await fetchReviews();
    } catch (err) {
      alert('Lỗi khi tải lịch sử đặt phòng: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [fetchReviews]);

  useEffect(() => {
    if (!token) { navigate('/login', { state: { from: '/customer/booking-history' } }); return; }
    fetchHistory();
  }, [token, navigate, fetchHistory]);

  // Admin khoá/mở chi nhánh -> cập nhật nhãn "chi nhánh tạm ngừng" ngay (không cần reload).
  useEffect(() => {
    if (!token) return undefined;
    connectSocket();
    const onBranch = () => fetchHistory();
    socket.on('branch_updated', onBranch);
    return () => socket.off('branch_updated', onBranch);
  }, [token, fetchHistory]);

  return (
    <div className="min-h-screen bg-off-white">
      <Navbar />

      <div className="mx-auto max-w-4xl px-5 py-12 lg:py-16">
        <Reveal className="mb-10 text-center">
          <span className="font-nav text-xs font-semibold uppercase tracking-luxe text-gold">Tài khoản</span>
          <h1 className="mt-3 font-display text-4xl font-medium text-charcoal md:text-5xl">Lịch sử đặt phòng</h1>
        </Reveal>

        {loading ? (
          <div className="py-20 text-center font-body text-charcoal/55">Đang tải lịch sử đặt phòng...</div>
        ) : bookings.length === 0 ? (
          <div className="rounded-lg border border-black/5 bg-white py-16 text-center shadow-subtle">
            <p className="font-display text-2xl text-charcoal">Bạn chưa có đơn đặt phòng nào</p>
            <button onClick={() => navigate('/booking')} className="mt-6 rounded-sm bg-gold px-8 py-3.5 font-nav text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gold-hover">
              Đặt phòng ngay
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((b, i) => {
              const st = STATUS[b.status] || { label: b.status, cls: 'bg-gray-100 text-gray-600 border-gray-200' };
              const canReview = reviewable[String(b._id)];   // backend nói được -> hiện nút
              const myReview = myReviews[String(b._id)];     // đã gửi rồi -> hiện lại sao mình chấm
              return (
                <Reveal as="article" key={b._id} delay={(i % 4) * 90} className="grid overflow-hidden rounded-lg bg-white shadow-raised transition-shadow duration-300 hover:shadow-elevated sm:grid-cols-[200px_1fr]">
                  <div className="h-44 overflow-hidden sm:h-auto">
                    {b.image ? (
                      <img src={b.image} alt={b.roomTypeNames?.[0] || 'Phòng'} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-cream text-sm text-charcoal/40">Chưa có ảnh</div>
                    )}
                  </div>

                  <div className="flex flex-col p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-2xl font-semibold text-charcoal">
                          {(b.roomTypeNames || []).join(', ') || 'Đặt phòng'}
                          {b.roomCount > 1 && <span className="ml-2 align-middle rounded-full bg-gold px-2 py-0.5 font-nav text-[11px] font-semibold text-white">{b.roomCount} phòng</span>}
                        </h3>
                        <p className="mt-0.5 font-body text-sm text-charcoal/55">Chi nhánh: {b.branchName}</p>
                        {b.branchActive === false && (
                          <p className="mt-1 inline-block rounded-sm bg-amber-50 px-2 py-0.5 font-body text-xs text-amber-700">⚠ Chi nhánh tạm ngừng hoạt động</p>
                        )}
                      </div>
                      <span className={`shrink-0 rounded-full border px-3 py-1 font-nav text-[11px] font-semibold ${st.cls}`}>{st.label}</span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-black/5 pt-4 font-body text-sm sm:grid-cols-4">
                      <div>
                        <div className="font-nav text-[10px] uppercase tracking-wide text-charcoal/45">Mã đặt phòng</div>
                        <div className="font-medium text-charcoal">{b.code}</div>
                      </div>
                      <div>
                        <div className="font-nav text-[10px] uppercase tracking-wide text-charcoal/45">Khách</div>
                        <div className="font-medium text-charcoal">{b.guestName}</div>
                      </div>
                      <div>
                        <div className="font-nav text-[10px] uppercase tracking-wide text-charcoal/45">Nhận phòng</div>
                        <div className="font-medium text-charcoal">{fmtDate(b.checkIn)}</div>
                      </div>
                      <div>
                        <div className="font-nav text-[10px] uppercase tracking-wide text-charcoal/45">Trả phòng</div>
                        <div className="font-medium text-charcoal">{fmtDate(b.checkOut)}</div>
                      </div>
                    </div>

                    {/* Đánh giá đã gửi -> hiện lại cho khách xem chính lời mình viết */}
                    {myReview && (
                      <div className="mt-4 rounded-sm bg-cream px-4 py-3">
                        <div className="flex items-center gap-2">
                          <StarRating value={myReview.rating} size="h-4 w-4" />
                          <span className="font-nav text-[11px] font-semibold uppercase tracking-wide text-charcoal/45">Bạn đã đánh giá</span>
                        </div>
                        {myReview.comment && <p className="mt-1.5 font-body text-sm italic text-charcoal/65">“{myReview.comment}”</p>}
                      </div>
                    )}

                    <div className="mt-auto flex flex-col gap-3 border-t border-black/5 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="font-body text-sm text-charcoal/60">
                        Tổng tiền: <span className="font-display text-lg font-semibold text-gold">{formatPrice(b.totalAmount)}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Hạn 14 ngày -> nói rõ còn mấy ngày, đừng để khách quay lại thì nút biến mất không hiểu vì sao */}
                        {canReview && (
                          <span className="font-body text-xs text-charcoal/45">
                            Còn {daysLeft(canReview.expiresAt)} ngày để đánh giá
                          </span>
                        )}
                        <button onClick={() => navigate(`/checkout/group/${b._id}`)} className="rounded-sm border border-gold px-5 py-2.5 font-nav text-xs font-semibold uppercase tracking-wide text-gold transition-colors hover:bg-gold hover:text-white">
                          Xem chi tiết
                        </button>
                        {b.status === 'pending' && (
                          <button onClick={() => navigate(`/checkout/group/${b._id}`)} className="rounded-sm bg-gold px-5 py-2.5 font-nav text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gold-hover">
                            Thanh toán tiếp
                          </button>
                        )}
                        {canReview && (
                          <button onClick={() => setReviewing(canReview)} className="rounded-sm bg-gold px-5 py-2.5 font-nav text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gold-hover">
                            Đánh giá
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>

      {reviewing && (
        <ReviewModal
          stay={reviewing}
          onClose={() => setReviewing(null)}
          onDone={() => { setReviewing(null); fetchReviews() }} // nạp lại -> nút rụng, hiện phần "Bạn đã đánh giá"
        />
      )}

      <Footer />
    </div>
  );
};

export default BookingHistoryPage;
