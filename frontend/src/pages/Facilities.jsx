import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Reveal from '../components/common/Reveal';

/* Lưới tiện nghi tổng quan */
const amenities = [
  { label: 'Hồ bơi', icon: 'M3 12c1.5 0 1.5 1 3 1s1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1M3 17c1.5 0 1.5 1 3 1s1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1M8 9V4l8 3' },
  { label: 'Spa & Massage', icon: 'M12 2a7 7 0 00-7 7c0 3 2 5 4 6m3-13a7 7 0 017 7c0 3-2 5-4 6M12 8v13' },
  { label: 'Phòng Gym', icon: 'M6.5 6.5L17.5 17.5M3 9v6M21 9v6M6 7v10M18 7v10' },
  { label: 'Night Club', icon: 'M9 18V5l12-2v13M9 13l12-2M6 18a3 3 0 11-6 0 3 3 0 016 0zM21 16a3 3 0 11-6 0 3 3 0 016 0z' },
  { label: 'Nhà hàng', icon: 'M3 3v7a3 3 0 003 3v8M6 3v7m3-7v7M16 3c-1 2-1 5-1 7a2 2 0 002 2v9' },
  { label: 'Wi-Fi miễn phí', icon: 'M5 12.55a11 11 0 0114 0M1.5 9a16 16 0 0121 0M8.5 16.1a6 6 0 017 0M12 20h.01' },
  { label: 'Lễ tân 24/7', icon: 'M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z' },
  { label: 'Đưa đón sân bay', icon: 'M3 12l18-7-7 18-2-7-7-2-2-2z' },
];

/* Khu tiện nghi nổi bật */
const features = [
  {
    eyebrow: 'Giải trí',
    title: 'Hanoi Night Club',
    desc: 'Tọa lạc tại tầng trệt của Khách sạn Hà Nội, Hanoi Night Club là điểm đến giải trí đẳng cấp bậc nhất thủ đô. Hệ thống âm thanh ánh sáng tối tân cùng các phòng Karaoke VIP xa hoa mang đậm phong cách hoàng gia hứa hẹn những đêm tiệc bùng nổ.',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=1000',
    points: ['Giờ hoạt động: 19:30 – 02:00 sáng', 'Hơn 30 phòng Karaoke VIP', 'Gói đồ uống thượng hạng & trái cây tươi'],
    button: 'Đặt phòng VIP',
    reversed: false,
    bg: 'bg-charcoal',
    dark: true,
  },
  {
    eyebrow: 'Thư giãn',
    title: 'Spa & Wellness',
    desc: 'Tạm lánh khỏi sự nhộn nhịp của thành phố và bước vào ốc đảo bình yên. Các chuyên viên trị liệu giàu kinh nghiệm giúp bạn phục hồi năng lượng thể chất và tinh thần với những tinh chất thiên nhiên cao cấp, đánh thức mọi giác quan.',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=1000',
    points: ['Massage trị liệu chuyên sâu', 'Xông hơi khô (Sauna)', 'Hồ bơi thư giãn', 'Tinh chất thiên nhiên cao cấp'],
    button: null,
    reversed: true,
    bg: 'bg-off-white',
    dark: false,
  },
  {
    eyebrow: 'Sức khỏe',
    title: 'Trung tâm Thể hình',
    desc: 'Duy trì vóc dáng và thói quen rèn luyện ngay cả trong những chuyến công tác hay kỳ nghỉ dưỡng. Trung tâm thể hình được trang bị đầy đủ máy móc hiện đại từ các thương hiệu hàng đầu thế giới.',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1000',
    points: ['Giờ hoạt động: 06:00 – 22:00 mỗi ngày', 'Máy chạy bộ, xe đạp tập', 'Khu vực tạ tự do', 'Miễn phí cho khách lưu trú'],
    button: null,
    reversed: false,
    bg: 'bg-white',
    dark: false,
  },
];

const Facilities = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="bg-white">
      <Navbar />

      {/* ---------- Hero ---------- */}
      <section data-page-hero className="relative flex h-[58vh] min-h-[440px] items-center justify-center overflow-hidden">
        <img src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=1920" alt="Tiện nghi Khách sạn Hà Nội" className="absolute inset-0 z-0 h-full w-full object-cover" />
        <div className="absolute inset-0 z-[1] bg-black/50" />
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/55 via-black/35 to-black/75" />
        <div className="container relative z-10 px-5 pt-16 text-center text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.6)]">
          <span className="font-nav text-xs font-semibold uppercase tracking-luxe text-gold-light opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>Tiện nghi</span>
          <h1 className="mt-4 font-display text-5xl font-medium leading-none opacity-0 animate-fade-in-up md:text-7xl" style={{ animationDelay: '0.25s' }}>Tiện nghi &amp; Dịch vụ</h1>
          <p className="mx-auto mt-5 max-w-xl font-body text-sm text-white/85 opacity-0 animate-fade-in-up sm:text-base" style={{ animationDelay: '0.45s' }}>
            Trải nghiệm đẳng cấp cho kỳ nghỉ trọn vẹn.
          </p>
          <nav className="mt-6 font-nav text-[11px] uppercase tracking-wide text-white/60 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <a href="/" className="transition-colors hover:text-gold-light">Trang chủ</a>
            <span className="mx-2">/</span>
            <span className="text-white/90">Tiện nghi</span>
          </nav>
        </div>
      </section>

      {/* ---------- Lưới tiện nghi ---------- */}
      <section className="bg-off-white py-16 md:py-24">
        <div className="container mx-auto px-5 lg:px-10">
          <Reveal className="mb-12 text-center">
            <span className="font-nav text-xs font-semibold uppercase tracking-luxe text-gold">Đầy đủ tiện ích</span>
            <h2 className="mt-4 font-display text-4xl font-medium text-charcoal md:text-5xl">Tất cả tiện nghi</h2>
          </Reveal>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {amenities.map((a, i) => (
              <Reveal key={a.label} delay={(i % 4) * 80} className="group flex flex-col items-center gap-3 rounded-lg bg-white p-7 text-center shadow-subtle transition-all duration-300 hover:-translate-y-1 hover:shadow-raised">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-cream text-gold transition-colors duration-300 group-hover:bg-gold group-hover:text-white">
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={a.icon} /></svg>
                </span>
                <span className="font-nav text-xs font-medium text-charcoal/75">{a.label}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Khu tiện nghi nổi bật ---------- */}
      {features.map((f) => (
        <section key={f.title} className={`${f.bg} py-16 md:py-24 ${f.dark ? 'text-white' : ''}`}>
          <div className={`container mx-auto grid items-center gap-12 px-5 lg:grid-cols-2 lg:gap-16 lg:px-10`}>
            <Reveal className={`relative ${f.reversed ? 'lg:order-2' : ''}`}>
              <div className="overflow-hidden rounded-lg shadow-elevated">
                <img src={f.image} alt={f.title} className="h-[460px] w-full object-cover transition-transform duration-700 hover:scale-105" />
              </div>
              <div className={`pointer-events-none absolute -z-10 h-40 w-40 rounded-lg border border-gold/40 ${f.reversed ? '-right-5 -top-5' : '-bottom-5 -left-5'}`} />
            </Reveal>
            <Reveal delay={120} className={f.reversed ? 'lg:order-1' : ''}>
              <span className="font-nav text-xs font-semibold uppercase tracking-luxe text-gold">{f.eyebrow}</span>
              <h2 className={`mt-4 font-display text-4xl font-medium leading-tight md:text-5xl ${f.dark ? 'text-white' : 'text-charcoal'}`}>{f.title}</h2>
              <p className={`mt-6 font-body text-[15px] leading-relaxed ${f.dark ? 'text-white/70' : 'text-charcoal/70'}`}>{f.desc}</p>
              <ul className="mt-6 space-y-3">
                {f.points.map((p, i) => (
                  <li key={i} className={`flex items-center gap-3 font-body text-sm ${f.dark ? 'text-white/80' : 'text-charcoal/75'}`}>
                    <svg className="h-5 w-5 shrink-0 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    {p}
                  </li>
                ))}
              </ul>
              {f.button && (
                <a href="/contact" className="mt-8 inline-flex items-center gap-2 rounded-sm bg-gold px-8 py-3.5 font-nav text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gold-hover">
                  {f.button}
                </a>
              )}
            </Reveal>
          </div>
        </section>
      ))}

      {/* ---------- CTA ---------- */}
      <section className="bg-cream py-16 text-center">
        <Reveal className="container mx-auto px-5">
          <h2 className="font-display text-3xl font-medium text-charcoal md:text-4xl">Khám phá kỳ nghỉ đẳng cấp</h2>
          <p className="mx-auto mt-3 max-w-xl font-body text-sm text-charcoal/60">Tận hưởng trọn vẹn hệ thống tiện nghi 5 sao tại Khách sạn Hà Nội.</p>
          <a href="/booking" className="mt-8 inline-flex items-center gap-2 rounded-sm bg-gold px-8 py-3.5 font-nav text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gold-hover">
            Đặt phòng ngay
          </a>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
};

export default Facilities;
