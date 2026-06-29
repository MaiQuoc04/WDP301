import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Reveal from '../../components/common/Reveal';
import { customerService } from '../../services';

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

const BookingHistoryPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth || {});

  useEffect(() => {
    if (!token) {
      navigate('/login', { state: { from: '/customer/booking-history' } });
      return;
    }
    const fetchHistory = async () => {
      try {
        const res = await customerService.getBookingHistory();
        if (res.success) setBookings(res.data);
      } catch (err) {
        alert('Lỗi khi tải lịch sử đặt phòng: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [token, navigate]);

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
              return (
                <Reveal as="article" key={b._id} delay={(i % 4) * 90} className="grid overflow-hidden rounded-lg bg-white shadow-raised transition-shadow duration-300 hover:shadow-elevated sm:grid-cols-[200px_1fr]">
                  <div className="h-44 overflow-hidden sm:h-auto">
                    {b.roomType?.images?.length ? (
                      <img src={b.roomType.images[0]} alt={b.roomType?.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-cream text-sm text-charcoal/40">Chưa có ảnh</div>
                    )}
                  </div>

                  <div className="flex flex-col p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-2xl font-semibold text-charcoal">{b.roomType?.name}</h3>
                        <p className="mt-0.5 font-body text-sm text-charcoal/55">Chi nhánh: {b.branch?.name}</p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-3 py-1 font-nav text-[11px] font-semibold ${st.cls}`}>{st.label}</span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-black/5 pt-4 font-body text-sm sm:grid-cols-4">
                      <div>
                        <div className="font-nav text-[10px] uppercase tracking-wide text-charcoal/45">Mã booking</div>
                        <div className="font-medium text-charcoal">{b.code}</div>
                      </div>
                      <div>
                        <div className="font-nav text-[10px] uppercase tracking-wide text-charcoal/45">Khách</div>
                        <div className="font-medium text-charcoal">{b.guestName}</div>
                      </div>
                      <div>
                        <div className="font-nav text-[10px] uppercase tracking-wide text-charcoal/45">Nhận phòng</div>
                        <div className="font-medium text-charcoal">{new Date(b.checkIn).toLocaleDateString('vi-VN')}</div>
                      </div>
                      <div>
                        <div className="font-nav text-[10px] uppercase tracking-wide text-charcoal/45">Trả phòng</div>
                        <div className="font-medium text-charcoal">{new Date(b.checkOut).toLocaleDateString('vi-VN')}</div>
                      </div>
                    </div>

                    <div className="mt-auto flex flex-col gap-3 border-t border-black/5 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="font-body text-sm text-charcoal/60">
                        Tổng tiền: <span className="font-display text-lg font-semibold text-gold">{formatPrice(b.totalAmount)}</span>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => navigate(`/checkout/${b._id}`)} className="rounded-sm border border-gold px-5 py-2.5 font-nav text-xs font-semibold uppercase tracking-wide text-gold transition-colors hover:bg-gold hover:text-white">
                          Xem chi tiết
                        </button>
                        {b.status === 'pending' && (
                          <button onClick={() => navigate(`/checkout/${b._id}`)} className="rounded-sm bg-gold px-5 py-2.5 font-nav text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gold-hover">
                            Thanh toán tiếp
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

      <Footer />
    </div>
  );
};

export default BookingHistoryPage;
