import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerService } from '../services';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Reveal from '../components/common/Reveal';
import { Image } from 'antd';

const bedLabel = (t) =>
  t === 'king' ? 'Giường King' : t === 'double' ? 'Giường Đôi' : t === 'twin' ? '2 Giường Đơn' : 'Giường Đơn';

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

// Việt hóa tên tiện ích lấy từ DB (fallback giữ nguyên tên gốc nếu chưa có trong map)
const AMENITY_VI = {
  'balcony': 'Ban công',
  'bathtub': 'Bồn tắm',
  'mini bar': 'Minibar',
  'minibar': 'Minibar',
  'safe box': 'Két sắt an toàn',
  'safebox': 'Két sắt an toàn',
  'wifi': 'Wi-Fi miễn phí',
  'wi-fi': 'Wi-Fi miễn phí',
  'free wifi': 'Wi-Fi miễn phí',
  'air conditioner': 'Điều hòa nhiệt độ',
  'air conditioning': 'Điều hòa nhiệt độ',
  'tv': 'TV màn hình phẳng',
  'television': 'TV màn hình phẳng',
  'hairdryer': 'Máy sấy tóc',
  'hair dryer': 'Máy sấy tóc',
  'rain shower': 'Vòi sen mưa',
  'shower': 'Vòi sen',
  'bathrobe': 'Áo choàng & dép',
  'slippers': 'Dép đi trong phòng',
  'desk': 'Bàn làm việc',
  'iron': 'Bàn ủi & cầu là',
  'non-smoking': 'Phòng không hút thuốc',
};
const localizeAmenity = (name = '') => AMENITY_VI[name.trim().toLowerCase()] || name;
// Fallback khi phòng chưa khai báo tiện ích trong DB
const FALLBACK_AMENITIES = ['Wi-Fi miễn phí', 'Điều hòa nhiệt độ', 'TV màn hình phẳng', 'Minibar'];

/* ---- Spec icons ---- */
const Ico = {
  area: 'M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M20.25 20.25v-4.5m0 4.5h-4.5m4.5 0L15 15',
  bed: 'M20.25 10.5v-1.5a3 3 0 00-3-3h-10.5a3 3 0 00-3 3v1.5M3.75 18v-3a3 3 0 013-3h10.5a3 3 0 013 3v3m-16.5-6h16.5',
  bath: 'M4.5 12V6.75a2.25 2.25 0 014.5 0M3 12h18M4.5 12v4.5a3 3 0 003 3h9a3 3 0 003-3V12',
  guest: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.1a7.5 7.5 0 0115 0A17.9 17.9 0 0112 21.75c-2.68 0-5.22-.584-7.5-1.632z',
  view: 'M2.036 12.322a1 1 0 010-.644C3.42 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178a1 1 0 010 .644C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
};

const SpecRow = ({ icon, label, value }) => (
  <div className="flex items-center gap-4">
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-cream text-gold">
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>
    </span>
    <div>
      <div className="font-nav text-[11px] uppercase tracking-wide text-charcoal/45">{label}</div>
      <div className="font-body text-[15px] font-medium text-charcoal">{value}</div>
    </div>
  </div>
);

const RoomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [allRooms, setAllRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await customerService.getPublicRooms();
        if (res.success && res.data) {
          const roomsData = Array.isArray(res.data) ? res.data : (res.data.rooms || []);
          setAllRooms(roomsData);
          setRoom(roomsData.find((r) => r._id === id));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
    setSlideIndex(0);
  }, [id]);

  if (loading)
    return <div className="flex min-h-screen items-center justify-center bg-white font-body text-charcoal/60">Đang tải thông tin phòng...</div>;
  if (!room)
    return <div className="flex min-h-screen items-center justify-center bg-white font-body text-red-600">Không tìm thấy hạng phòng này.</div>;

  const relatedRooms = allRooms.filter((r) => r._id !== room._id).slice(0, 3);
  const heroImage = room.images?.length ? room.images[0] : 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1920&q=80';
  const galleryImages = room.images?.length ? room.images : [
    'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
  ];

  const nextSlide = () => setSlideIndex((p) => (p + 1) % galleryImages.length);
  const prevSlide = () => setSlideIndex((p) => (p - 1 + galleryImages.length) % galleryImages.length);
  const img1 = galleryImages[slideIndex];
  const img2 = galleryImages[(slideIndex + 1) % galleryImages.length];

  return (
    <div className="bg-white">
      <Navbar />

      {/* ---------- Hero Banner ---------- */}
      <section data-page-hero className="relative flex h-[60vh] min-h-[440px] items-center justify-center overflow-hidden">
        <img src={heroImage} alt={room.name} className="absolute inset-0 z-0 h-full w-full object-cover" />
        <div className="absolute inset-0 z-[1] bg-black/45" />
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/55 via-black/30 to-black/70" />
        <div className="container relative z-10 px-5 pt-16 text-center text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.6)]">
          <span className="font-nav text-xs font-semibold uppercase tracking-luxe text-gold-light opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>Hạng phòng</span>
          <h1 className="mt-4 font-display text-5xl font-medium leading-none opacity-0 animate-fade-in-up md:text-7xl" style={{ animationDelay: '0.25s' }}>{room.name}</h1>
          <nav className="mt-6 font-nav text-[11px] uppercase tracking-wide text-white/60 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.45s' }}>
            <a href="/" className="transition-colors hover:text-gold-light">Trang chủ</a>
            <span className="mx-2">/</span>
            <a href="/rooms" className="transition-colors hover:text-gold-light">Hạng phòng</a>
            <span className="mx-2">/</span>
            <span className="text-white/90">{room.name}</span>
          </nav>
        </div>
      </section>

      {/* ---------- Intro + Gallery ---------- */}
      <section className="bg-off-white py-16 md:py-24">
        <div className="container mx-auto px-5 lg:px-10">
          <Reveal className="mx-auto max-w-3xl text-center">
            <span className="font-nav text-xs font-semibold uppercase tracking-luxe text-gold">Không gian</span>
            <h2 className="mt-4 font-display text-4xl font-medium text-charcoal md:text-5xl">Tận hưởng sự sang trọng</h2>
            <p className="mt-5 font-body text-[15px] leading-relaxed text-charcoal/65">
              {room.description ||
                `Trải nghiệm sự sang trọng và tiện nghi tại ${room.name}. Không gian nội thất tinh tế, sàn gỗ ấm áp cùng ánh sáng tự nhiên và tầm nhìn tuyệt đẹp ra thành phố qua khung cửa sổ panorama.`}
            </p>
          </Reveal>

          <Reveal delay={120} className="relative mt-12">
            <Image.PreviewGroup>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="h-72 overflow-hidden rounded-lg shadow-raised md:h-96">
                  <Image src={img1} alt={`${room.name} 1`} width="100%" height="100%" style={{ objectFit: 'cover' }} rootClassName="h-full w-full [&_.ant-image]:h-full [&_img]:h-full [&_img]:object-cover" />
                </div>
                {galleryImages.length > 1 && (
                  <div className="h-72 overflow-hidden rounded-lg shadow-raised md:h-96">
                    <Image src={img2} alt={`${room.name} 2`} width="100%" height="100%" style={{ objectFit: 'cover' }} rootClassName="h-full w-full [&_.ant-image]:h-full [&_img]:h-full [&_img]:object-cover" />
                  </div>
                )}
              </div>
            </Image.PreviewGroup>

            {galleryImages.length > 1 && (
              <>
                <button onClick={prevSlide} aria-label="Ảnh trước" className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-charcoal shadow-elevated transition-colors hover:bg-gold hover:text-white">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <button onClick={nextSlide} aria-label="Ảnh sau" className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-charcoal shadow-elevated transition-colors hover:bg-gold hover:text-white">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </>
            )}
          </Reveal>
        </div>
      </section>

      {/* ---------- Details: Info + Amenities ---------- */}
      <section className="bg-white py-16 md:py-20">
        <div className="container mx-auto grid gap-8 px-5 lg:grid-cols-[1fr_1.3fr] lg:px-10">
          {/* Thông tin phòng */}
          <Reveal as="div" className="rounded-lg border border-black/5 bg-white p-8 shadow-subtle">
            <h3 className="font-display text-2xl font-semibold text-charcoal">Thông tin phòng</h3>
            <div className="mt-2 h-px w-16 bg-gold" />
            <div className="mt-7 space-y-6">
              <SpecRow icon={Ico.area} label="Diện tích" value={`${room.area} m²`} />
              <SpecRow icon={Ico.bed} label="Giường" value={bedLabel(room.bedType)} />
              <SpecRow icon={Ico.bath} label="Phòng tắm" value="Bồn tắm & Vòi sen" />
              <SpecRow icon={Ico.guest} label="Sức chứa" value={`Tối đa ${room.capacity} người`} />
              <SpecRow icon={Ico.view} label="Hướng nhìn" value="Thành phố / Hồ" />
            </div>
          </Reveal>

          {/* Tiện nghi & dịch vụ */}
          <Reveal as="div" delay={120} className="flex flex-col rounded-lg border border-black/5 bg-white p-8 shadow-subtle">
            <h3 className="font-display text-2xl font-semibold text-charcoal">Tiện nghi &amp; Dịch vụ</h3>
            <div className="mt-2 h-px w-16 bg-gold" />
            <ul className="mt-7 grid grid-cols-1 gap-x-6 gap-y-3.5 sm:grid-cols-2">
              {(room.amenities?.length ? room.amenities.map((a) => localizeAmenity(a.name)) : FALLBACK_AMENITIES).map((am, i) => (
                <li key={i} className="flex items-center gap-2.5 font-body text-sm text-charcoal/75">
                  <svg className="h-5 w-5 shrink-0 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  {am}
                </li>
              ))}
            </ul>

            <div className="mt-auto flex flex-col gap-5 border-t border-black/5 pt-7 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="block font-nav text-[10px] uppercase tracking-wide text-charcoal/45">Giá phòng</span>
                <span className="font-display text-2xl font-semibold text-gold">
                  {room.basePrice != null ? `từ ${formatPrice(room.basePrice)}` : 'Liên hệ'}
                  {room.basePrice != null && <span className="text-base font-normal text-charcoal/50"> / đêm</span>}
                </span>
              </div>
              <button onClick={() => navigate('/')} className="rounded-sm bg-gold px-9 py-3.5 font-nav text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gold-hover">
                Đặt phòng
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Related rooms ---------- */}
      {relatedRooms.length > 0 && (
        <section className="bg-off-white py-16 md:py-20">
          <div className="container mx-auto px-5 lg:px-10">
            <Reveal className="mb-12 text-center">
              <span className="font-nav text-xs font-semibold uppercase tracking-luxe text-gold">Gợi ý</span>
              <h2 className="mt-4 font-display text-4xl font-medium text-charcoal md:text-5xl">Có thể bạn quan tâm</h2>
            </Reveal>
            <div className="grid gap-7 md:grid-cols-3">
              {relatedRooms.map((rel, i) => (
                <Reveal as="article" key={rel._id} delay={i * 110} className="group flex flex-col overflow-hidden rounded-lg bg-white shadow-raised transition-all duration-500 hover:-translate-y-2 hover:shadow-elevated">
                  <div className="h-56 overflow-hidden">
                    <img src={rel.images?.length ? rel.images[0] : 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80'} alt={rel.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h4 className="font-display text-xl font-semibold text-charcoal">{rel.name}</h4>
                    {rel.description && <p className="mt-2 line-clamp-2 font-body text-sm leading-relaxed text-charcoal/65">{rel.description}</p>}
                    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-body text-xs text-charcoal/55">
                      {rel.area != null && <li>{rel.area} m²</li>}
                      {rel.bedType && <li>· {bedLabel(rel.bedType)}</li>}
                      {rel.capacity != null && <li>· {rel.capacity} khách</li>}
                    </ul>
                    <div className="mt-auto flex items-center gap-3 pt-6">
                      <button onClick={() => navigate('/')} className="flex-1 rounded-sm bg-gold px-4 py-2.5 font-nav text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gold-hover">Đặt phòng</button>
                      <button onClick={() => { navigate(`/rooms/${rel._id}`); window.scrollTo(0, 0); }} className="inline-flex items-center gap-1.5 rounded-sm border border-gold px-4 py-2.5 font-nav text-xs font-semibold uppercase tracking-wide text-gold transition-colors hover:bg-gold hover:text-white">Chi tiết</button>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Floating support */}
      <button
        onClick={() => alert('Customer support clicked')}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-gold px-5 py-3 font-nav text-xs font-semibold uppercase tracking-wide text-white shadow-elevated transition-colors hover:bg-gold-hover"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 10h.01M12 10h.01M16 10h.01M21 12a9 9 0 11-4.5-7.79L21 3l-1.21 4.5A8.96 8.96 0 0121 12z" strokeLinecap="round" strokeLinejoin="round" /></svg>
        Hỗ trợ khách hàng
      </button>

      <Footer />
    </div>
  );
};

export default RoomDetail;
