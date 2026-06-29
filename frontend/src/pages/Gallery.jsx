import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Reveal from '../components/common/Reveal';
import { Image } from 'antd';
import { customerService } from '../services';

/* Ảnh mẫu — dùng khi admin chưa upload ảnh nào */
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1542314831-c6a4d14d8c53?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1551882547-ff40c0d13c11?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800',
];

const Gallery = () => {
  const [images, setImages] = useState(FALLBACK_IMAGES);

  useEffect(() => {
    window.scrollTo(0, 0);
    customerService.getGallery('gallery')
      .then((r) => {
        const data = r?.data || [];
        if (data.length) setImages(data.map((i) => i.imageUrl));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="bg-white">
      <Navbar />

      {/* ---------- Hero ---------- */}
      <section data-page-hero className="relative flex h-[55vh] min-h-[420px] items-center justify-center overflow-hidden">
        <img src="https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&q=80&w=1920" alt="Thư viện Khách sạn Hà Nội" className="absolute inset-0 z-0 h-full w-full object-cover" />
        <div className="absolute inset-0 z-[1] bg-black/50" />
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/55 via-black/35 to-black/75" />
        <div className="container relative z-10 px-5 pt-16 text-center text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.6)]">
          <span className="font-nav text-xs font-semibold uppercase tracking-luxe text-gold-light opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>Thư viện</span>
          <h1 className="mt-4 font-display text-5xl font-medium leading-none opacity-0 animate-fade-in-up md:text-7xl" style={{ animationDelay: '0.25s' }}>Khoảnh khắc Hanoi Hotel</h1>
          <p className="mx-auto mt-5 max-w-xl font-body text-sm text-white/85 opacity-0 animate-fade-in-up sm:text-base" style={{ animationDelay: '0.45s' }}>
            Vẻ đẹp di sản phương Đông qua từng khung hình.
          </p>
          <nav className="mt-6 font-nav text-[11px] uppercase tracking-wide text-white/60 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <a href="/" className="transition-colors hover:text-gold-light">Trang chủ</a>
            <span className="mx-2">/</span>
            <span className="text-white/90">Thư viện</span>
          </nav>
        </div>
      </section>

      {/* ---------- Masonry Gallery ---------- */}
      <section className="bg-off-white py-16 md:py-24">
        <div className="container mx-auto px-5 lg:px-10">
          <Reveal className="mb-12 text-center">
            <span className="font-nav text-xs font-semibold uppercase tracking-luxe text-gold">Bộ sưu tập</span>
            <h2 className="mt-4 font-display text-4xl font-medium text-charcoal md:text-5xl">Hình ảnh khách sạn</h2>
            <p className="mx-auto mt-4 max-w-xl font-body text-[15px] leading-relaxed text-charcoal/60">
              Khám phá vẻ đẹp sang trọng tại Khách sạn Hà Nội — nhấp vào từng ảnh để xem ở chế độ phóng to.
            </p>
          </Reveal>

          <Image.PreviewGroup>
            <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 [&>a]:mb-4">
              {images.map((src, i) => (
                <Reveal key={i} delay={(i % 4) * 70} className="group block break-inside-avoid overflow-hidden rounded-lg shadow-subtle">
                  <Image
                    src={src}
                    alt={`Hanoi Hotel ${i + 1}`}
                    rootClassName="block w-full [&_img]:w-full [&_img]:transition-transform [&_img]:duration-700 group-hover:[&_img]:scale-110"
                  />
                </Reveal>
              ))}
            </div>
          </Image.PreviewGroup>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Gallery;
