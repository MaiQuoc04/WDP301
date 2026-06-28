import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Reveal from '../components/common/Reveal';
import { Image } from 'antd';
import { customerService } from '../services';

/* Dữ liệu nhà hàng (gộp từ Á Đông / Phương Tây / Bar). Sau này có thể nạp từ DB. */
const restaurants = [
  {
    name: 'Golden Dragon',
    cuisine: 'Quảng Đông & Dim Sum',
    hours: '11:30 – 14:30 · 17:30 – 22:00',
    desc: 'Ẩm thực Trung Hoa thượng hạng với thực đơn Dim Sum trứ danh và các món Quảng Đông nguyên bản, trong không gian riêng tư sang trọng.',
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=900',
  },
  {
    name: 'Nhà hàng Phương Tây',
    cuisine: 'Buffet Quốc Tế & Àlacarte',
    hours: '06:00 – 22:30',
    desc: 'Sự giao thoa tinh tế giữa ẩm thực Âu và Á, nổi tiếng với thực đơn Buffet sáng quốc tế đa dạng và bò bít tết thượng hạng.',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=900',
  },
  {
    name: 'Lobby Bar & Lounge',
    cuisine: 'Cocktail · Trà chiều · Nhạc sống',
    hours: '08:00 – 00:00',
    desc: 'Không gian sang trọng lý tưởng để thưởng thức cocktail sáng tạo, set trà chiều kiểu Anh và âm nhạc piano du dương.',
    image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&q=80&w=900',
  },
];

/* Ảnh gallery món ăn (mẫu — dùng khi admin chưa upload ảnh ẩm thực nào) */
const FALLBACK_GALLERY = [
  'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&q=80&w=700',
  'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&q=80&w=700',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=700',
  'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=700',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=700',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80&w=700',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=700',
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=700',
];

const ClockIcon = () => (
  <svg className="h-4 w-4 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
const DishIcon = () => (
  <svg className="h-4 w-4 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5h18M5.25 13.5a6.75 6.75 0 0113.5 0M12 3v2.25M3.75 20.25h16.5" /></svg>
);

const scrollToReservation = () => {
  document.getElementById('dat-ban')?.scrollIntoView({ behavior: 'smooth' });
};

const Dining = () => {
  const [galleryImages, setGalleryImages] = useState(FALLBACK_GALLERY);

  useEffect(() => {
    window.scrollTo(0, 0);
    customerService.getGallery('dining')
      .then((r) => {
        const data = r?.data || [];
        if (data.length) setGalleryImages(data.map((i) => i.imageUrl));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="bg-white">
      <Navbar />

      {/* ---------- Hero Banner ---------- */}
      <section data-page-hero className="relative flex h-[58vh] min-h-[440px] items-center justify-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1920"
          alt="Ẩm thực Khách sạn Hà Nội"
          className="absolute inset-0 z-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 z-[1] bg-black/50" />
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/55 via-black/35 to-black/75" />
        <div className="container relative z-10 px-5 pt-16 text-center text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.6)]">
          <span className="font-nav text-xs font-semibold uppercase tracking-luxe text-gold-light opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>Ẩm thực</span>
          <h1 className="mt-4 font-display text-5xl font-medium leading-none opacity-0 animate-fade-in-up md:text-7xl" style={{ animationDelay: '0.25s' }}>Tinh hoa ẩm thực</h1>
          <p className="mx-auto mt-5 max-w-xl font-body text-sm text-white/85 opacity-0 animate-fade-in-up sm:text-base" style={{ animationDelay: '0.45s' }}>
            Hành trình vị giác giữa lòng Hà Nội.
          </p>
          <nav className="mt-6 font-nav text-[11px] uppercase tracking-wide text-white/60 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <a href="/" className="transition-colors hover:text-gold-light">Trang chủ</a>
            <span className="mx-2">/</span>
            <span className="text-white/90">Ẩm thực</span>
          </nav>
        </div>
      </section>

      {/* ---------- Intro ---------- */}
      <section className="bg-off-white py-16 md:py-24">
        <Reveal className="container mx-auto max-w-3xl px-5 text-center">
          <span className="font-nav text-xs font-semibold uppercase tracking-luxe text-gold">Trải nghiệm</span>
          <h2 className="mt-4 font-display text-4xl font-medium text-charcoal md:text-5xl">Nghệ thuật ẩm thực phương Đông</h2>
          <p className="mt-5 font-body text-[15px] leading-relaxed text-charcoal/65">
            Khám phá thế giới ẩm thực phong phú tại Khách sạn Hà Nội — nơi những nhà hàng phục vụ đa dạng món Quảng Đông,
            Hồng Kông và đặc biệt là những xửng Dimsum trứ danh, bên cạnh ẩm thực Âu tinh tế và quầy bar thư giãn.
          </p>
        </Reveal>
      </section>

      {/* ---------- Nhà hàng & Quầy bar ---------- */}
      <section className="bg-white pb-4">
        <div className="container mx-auto px-5 lg:px-10">
          <Reveal className="mb-12 text-center">
            <span className="font-nav text-xs font-semibold uppercase tracking-luxe text-gold">Khám phá</span>
            <h2 className="mt-4 font-display text-4xl font-medium text-charcoal md:text-5xl">Nhà hàng &amp; Quầy bar</h2>
          </Reveal>

          <div className="grid gap-7 md:grid-cols-3">
            {restaurants.map((r, i) => (
              <Reveal as="article" key={r.name} delay={i * 110} className="group flex flex-col overflow-hidden rounded-lg bg-white shadow-raised transition-all duration-500 hover:-translate-y-2 hover:shadow-elevated">
                <div className="h-56 overflow-hidden">
                  <img src={r.image} alt={r.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-display text-2xl font-semibold text-charcoal">{r.name}</h3>
                  <p className="mt-3 flex-1 font-body text-sm leading-relaxed text-charcoal/65">{r.desc}</p>
                  <ul className="mt-4 space-y-2 font-body text-xs text-charcoal/60">
                    <li className="flex items-center gap-2"><ClockIcon /> {r.hours}</li>
                    <li className="flex items-center gap-2"><DishIcon /> {r.cuisine}</li>
                  </ul>
                  <button onClick={scrollToReservation} className="mt-5 inline-flex w-full items-center justify-center rounded-sm border border-gold px-5 py-2.5 font-nav text-xs font-semibold uppercase tracking-wide text-gold transition-colors hover:bg-gold hover:text-white">
                    Đặt bàn
                  </button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Signature ---------- */}
      <section className="bg-off-white py-16 md:py-24">
        <div className="container mx-auto grid items-center gap-12 px-5 lg:grid-cols-2 lg:gap-16 lg:px-10">
          <Reveal className="relative">
            <div className="overflow-hidden rounded-lg shadow-elevated">
              <img src="https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&q=80&w=900" alt="Dim Sum Quảng Đông" className="h-[460px] w-full object-cover transition-transform duration-700 hover:scale-105" />
            </div>
            <div className="pointer-events-none absolute -bottom-5 -left-5 -z-10 h-40 w-40 rounded-lg border border-gold/40" />
          </Reveal>
          <Reveal delay={120}>
            <span className="font-nav text-xs font-semibold uppercase tracking-luxe text-gold">Món ăn đặc trưng</span>
            <h2 className="mt-4 font-display text-4xl font-medium leading-tight text-charcoal md:text-5xl">Hương vị Quảng Đông đích thực</h2>
            <p className="mt-6 font-body text-[15px] leading-relaxed text-charcoal/70">
              Được dẫn dắt bởi bếp trưởng giàu kinh nghiệm, thực đơn tại Golden Dragon là bản hòa ca của những nguyên liệu
              tươi ngon nhất. Từ món Vịt Quay Bắc Kinh da giòn tan đến hàng chục loại Dim Sum được làm thủ công mỗi ngày,
              mỗi món ăn đều là một kiệt tác nghệ thuật ẩm thực.
            </p>
            <button onClick={scrollToReservation} className="mt-8 inline-flex items-center gap-2 rounded-sm bg-gold px-8 py-3.5 font-nav text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gold-hover">
              Khám phá thực đơn
            </button>
          </Reveal>
        </div>
      </section>

      {/* ---------- Gallery món ăn ---------- */}
      <section className="bg-white py-16 md:py-20">
        <div className="container mx-auto px-5 lg:px-10">
          <Reveal className="mb-12 text-center">
            <span className="font-nav text-xs font-semibold uppercase tracking-luxe text-gold">Bộ sưu tập</span>
            <h2 className="mt-4 font-display text-4xl font-medium text-charcoal md:text-5xl">Khoảnh khắc ẩm thực</h2>
          </Reveal>
          <Image.PreviewGroup>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {galleryImages.map((src, i) => (
                <Reveal key={i} delay={(i % 4) * 80} className="group h-44 overflow-hidden rounded-lg shadow-subtle md:h-52">
                  <Image
                    src={src}
                    alt={`Món ăn ${i + 1}`}
                    rootClassName="h-full w-full [&_.ant-image]:h-full [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_img]:transition-transform [&_img]:duration-700 group-hover:[&_img]:scale-110"
                  />
                </Reveal>
              ))}
            </div>
          </Image.PreviewGroup>
        </div>
      </section>

      {/* ---------- CTA Đặt bàn ---------- */}
      <section id="dat-ban" className="bg-cream py-16">
        <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-5 text-center md:flex-row md:text-left lg:px-10">
          <div>
            <h2 className="font-display text-3xl font-medium text-charcoal md:text-4xl">Quý khách muốn đặt bàn?</h2>
            <p className="mt-2 font-body text-sm text-charcoal/60">Hãy để chúng tôi chuẩn bị cho bạn một trải nghiệm ẩm thực trọn vẹn.</p>
          </div>
          <div className="flex items-center gap-6">
            <a href="tel:+842438452270" className="flex items-center gap-2 font-display text-xl font-semibold text-gold">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.896-1.596-5.25-3.95-6.847-6.847l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
              (+84) 24 3845 2270
            </a>
            <a href="/contact" className="rounded-sm bg-gold px-7 py-3.5 font-nav text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gold-hover">
              Đặt bàn ngay
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Dining;
