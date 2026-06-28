import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerService } from '../../services';
import Reveal from '../../components/common/Reveal';

const bedLabel = (t) =>
  t === 'king' ? 'Giường King' : t === 'double' ? 'Giường Đôi' : t === 'twin' ? '2 Giường Đơn' : 'Giường Đơn';

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

// Rút gọn tên chi nhánh: "Hanoi Hotel - Chi nhánh Hoàn Kiếm" -> "Hoàn Kiếm"
const shortBranch = (b) => {
  if (!b) return '';
  if (b.name?.includes('Chi nhánh')) return b.name.split('Chi nhánh').pop().trim();
  return (b.location?.split(',')[0] || b.name || '').trim();
};

const MapPin = ({ className = 'h-4 w-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
);

/* ---- Icons ---- */
const IconArea = () => (
  <svg className="h-4 w-4 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M20.25 20.25v-4.5m0 4.5h-4.5m4.5 0L15 15" /></svg>
);
const IconBed = () => (
  <svg className="h-4 w-4 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.25 10.5v-1.5a3 3 0 00-3-3h-10.5a3 3 0 00-3 3v1.5M3.75 18v-3a3 3 0 013-3h10.5a3 3 0 013 3v3m-16.5-6h16.5" /></svg>
);
const IconGuest = () => (
  <svg className="h-4 w-4 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.1a7.5 7.5 0 0115 0A17.9 17.9 0 0112 21.75c-2.68 0-5.22-.584-7.5-1.632z" /></svg>
);

const RoomList = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(''); // '' = Tất cả chi nhánh
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ROOMS');

  useEffect(() => {
    fetchRooms();
    customerService.getBranches().then((r) => setBranches(r.data || [])).catch(() => {});
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

  // Lọc phòng theo chi nhánh + hạng phòng (tier do manager set; phòng cũ chưa set coi là 'standard')
  const displayRooms = rooms.filter((room) => {
    const matchBranch = !selectedBranch || room.branch?._id === selectedBranch;
    const tier = room.tier || 'standard';
    const matchTab = activeTab === 'SUITES' ? tier === 'premium' : tier === 'standard';
    return matchBranch && matchTab;
  });

  const tabs = [
    { key: 'ROOMS', label: 'Phòng Tiêu Chuẩn' },
    { key: 'SUITES', label: 'Phòng Cao Cấp' },
  ];

  return (
    <div>
      {/* ---------- Hero Banner ---------- */}
      <section
        data-page-hero
        className="relative flex h-[58vh] min-h-[420px] items-center justify-center overflow-hidden"
      >
        <img
          src="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1920&q=80"
          alt="Hạng phòng Khách sạn Hà Nội"
          className="absolute inset-0 z-0 h-full w-full object-cover"
        />
        {/* Overlay tối & đều để tiêu đề trắng luôn nổi trên mọi vùng ảnh (z dương, không dùng z âm) */}
        <div className="absolute inset-0 z-[1] bg-black/45" />
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/55 via-black/30 to-black/70" />
        <div className="container relative z-10 px-5 pt-16 text-center text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.6)]">
          <span className="font-nav text-xs font-semibold uppercase tracking-luxe text-gold-light opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Lưu trú
          </span>
          <h1 className="mt-4 font-display text-5xl font-medium leading-none opacity-0 animate-fade-in-up md:text-7xl" style={{ animationDelay: '0.25s' }}>
            Hạng Phòng &amp; Suite
          </h1>
          <p className="mx-auto mt-5 max-w-xl font-body text-sm text-white/85 opacity-0 animate-fade-in-up sm:text-base" style={{ animationDelay: '0.45s' }}>
            218 phòng nghỉ tiện nghi, hiện đại bên Hồ Giảng Võ thanh bình.
          </p>
          <nav className="mt-6 font-nav text-[11px] uppercase tracking-wide text-white/60 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <a href="/" className="transition-colors hover:text-gold-light">Trang chủ</a>
            <span className="mx-2">/</span>
            <span className="text-white/90">Hạng phòng</span>
          </nav>
        </div>
      </section>

      {/* ---------- Branch Selector ---------- */}
      <div className="bg-white pt-12">
        <div className="container mx-auto px-5 text-center">
          <span className="font-nav text-xs font-semibold uppercase tracking-luxe text-gold">Chọn chi nhánh</span>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setSelectedBranch('')}
              className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 font-nav text-[13px] font-semibold tracking-wide transition-colors ${
                selectedBranch === ''
                  ? 'border-gold bg-gold text-white'
                  : 'border-gold/40 text-charcoal/70 hover:border-gold hover:text-gold'
              }`}
            >
              <MapPin className="h-4 w-4" />
              Tất cả chi nhánh
            </button>
            {branches.map((b) => (
              <button
                key={b._id}
                onClick={() => setSelectedBranch(b._id)}
                className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 font-nav text-[13px] font-semibold tracking-wide transition-colors ${
                  selectedBranch === b._id
                    ? 'border-gold bg-gold text-white'
                    : 'border-gold/40 text-charcoal/70 hover:border-gold hover:text-gold'
                }`}
              >
                <MapPin className="h-4 w-4" />
                Chi nhánh {shortBranch(b)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- Tabs ---------- */}
      <div className="border-b border-black/5 bg-white pt-8">
        <div className="container flex justify-center gap-2 px-5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`relative px-6 py-5 font-nav text-sm font-semibold uppercase tracking-wide transition-colors ${
                activeTab === t.key ? 'text-gold' : 'text-charcoal/50 hover:text-charcoal'
              }`}
            >
              {t.label}
              <span
                className={`absolute inset-x-4 bottom-0 h-0.5 origin-center bg-gold transition-transform duration-300 ${
                  activeTab === t.key ? 'scale-x-100' : 'scale-x-0'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* ---------- Room Grid ---------- */}
      <section className="bg-off-white py-16 md:py-20">
        <div className="container mx-auto px-5 lg:px-10">
          {loading && (
            <div className="py-24 text-center font-body text-charcoal/50">Đang tải danh sách phòng...</div>
          )}
          {error && (
            <div className="py-24 text-center font-body text-red-600">{error}</div>
          )}

          {!loading && !error && (
            displayRooms.length > 0 ? (
              <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
                {displayRooms.map((room, i) => (
                  <Reveal
                    as="article"
                    key={room._id}
                    delay={(i % 3) * 110}
                    className="group flex flex-col overflow-hidden rounded-lg bg-white shadow-raised transition-all duration-500 hover:-translate-y-2 hover:shadow-elevated"
                  >
                    <div className="relative h-60 overflow-hidden">
                      <img
                        src={room.images?.length ? room.images[0] : 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80&w=1000'}
                        alt={room.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                      {room.branch && (
                        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 font-nav text-[11px] font-semibold text-gold shadow-subtle backdrop-blur-sm">
                          <MapPin className="h-3.5 w-3.5" />
                          {shortBranch(room.branch)}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="font-display text-2xl font-semibold text-charcoal">{room.name}</h3>
                      {room.description && (
                        <p className="mt-2 line-clamp-2 font-body text-sm leading-relaxed text-charcoal/65">{room.description}</p>
                      )}

                      <ul className="mt-4 space-y-2 font-body text-sm text-charcoal/70">
                        {room.area != null && (
                          <li className="flex items-center gap-2"><IconArea /> Diện tích: {room.area} m²</li>
                        )}
                        {room.bedType && (
                          <li className="flex items-center gap-2"><IconBed /> {bedLabel(room.bedType)}</li>
                        )}
                        {room.capacity != null && (
                          <li className="flex items-center gap-2"><IconGuest /> Tối đa: {room.capacity} người lớn</li>
                        )}
                      </ul>

                      <div className="mt-5 border-t border-black/5 pt-5">
                        <span className="block font-nav text-[10px] uppercase tracking-wide text-charcoal/45">Giá phòng</span>
                        <span className="font-display text-xl font-semibold text-gold">
                          {room.basePrice != null ? `từ ${formatPrice(room.basePrice)}` : 'Liên hệ'}
                          {room.basePrice != null && <span className="text-sm font-normal text-charcoal/50"> / đêm</span>}
                        </span>
                      </div>

                      <div className="mt-5 flex items-center gap-3">
                        <button
                          onClick={() => navigate('/')}
                          className="flex-1 rounded-sm bg-gold px-5 py-3 font-nav text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gold-hover"
                        >
                          Đặt phòng
                        </button>
                        <button
                          onClick={() => navigate(`/rooms/${room._id}`)}
                          className="group/link inline-flex items-center gap-1.5 rounded-sm border border-gold px-5 py-3 font-nav text-xs font-semibold uppercase tracking-wide text-gold transition-colors hover:bg-gold hover:text-white"
                        >
                          Chi tiết
                          <svg className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </button>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center font-body text-charcoal/50">
                Hiện tại chưa có phòng nào trong danh mục này.
              </div>
            )
          )}
        </div>
      </section>

      {/* ---------- CTA dài hạn ---------- */}
      <section className="bg-charcoal py-16 text-center text-white">
        <div className="container mx-auto px-5">
          <Reveal>
            <h2 className="font-display text-3xl font-medium md:text-4xl">Bạn có kế hoạch lưu trú dài hạn?</h2>
            <p className="mx-auto mt-4 max-w-xl font-body text-[15px] text-white/65">
              Liên hệ với chúng tôi để nhận các ưu đãi đặc quyền dành cho kỳ nghỉ dài ngày.
            </p>
            <a
              href="/contact"
              className="mt-8 inline-flex items-center gap-2 rounded-sm border border-gold px-8 py-3.5 font-nav text-sm font-semibold uppercase tracking-wide text-gold-light transition-colors hover:bg-gold hover:text-white"
            >
              Liên hệ với chúng tôi
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </a>
          </Reveal>
        </div>
      </section>
    </div>
  );
};

export default RoomList;
