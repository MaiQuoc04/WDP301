import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Reveal from '../components/common/Reveal';

const inputBase =
  'w-full rounded-sm border border-black/10 bg-white px-4 py-3 font-body text-sm text-charcoal outline-none transition-colors placeholder:text-charcoal/40 focus:border-gold focus:ring-1 focus:ring-gold/40';
const labelBase = 'mb-1.5 block font-nav text-[11px] font-semibold uppercase tracking-wide text-charcoal/55';

const contactBlocks = [
  {
    title: 'Địa chỉ',
    icon: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
    lines: ['D8 Giảng Võ, Phường Giảng Võ', 'Quận Ba Đình, Hà Nội, Việt Nam'],
  },
  {
    title: 'Điện thoại & Email',
    icon: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.896-1.596-5.25-3.95-6.847-6.847l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z',
    lines: ['Tel: +84 24 3845 2270', 'Fax: +84 24 3845 9209', 'info@hanoihotel.com.vn'],
  },
  {
    title: 'Theo dõi',
    icon: 'M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z',
    lines: ['Facebook: HanoiHotel', 'Instagram: @hanoihotel'],
  },
];

const Contact = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong thời gian sớm nhất.');
    e.target.reset();
  };

  return (
    <div className="bg-white">
      <Navbar />

      {/* ---------- Hero ---------- */}
      <section data-page-hero className="relative flex h-[52vh] min-h-[400px] items-center justify-center overflow-hidden">
        <img src="https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&q=80&w=1920" alt="Liên hệ Khách sạn Hà Nội" className="absolute inset-0 z-0 h-full w-full object-cover" />
        <div className="absolute inset-0 z-[1] bg-black/50" />
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/55 via-black/35 to-black/75" />
        <div className="container relative z-10 px-5 pt-16 text-center text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.6)]">
          <span className="font-nav text-xs font-semibold uppercase tracking-luxe text-gold-light opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>Liên hệ</span>
          <h1 className="mt-4 font-display text-5xl font-medium leading-none opacity-0 animate-fade-in-up md:text-7xl" style={{ animationDelay: '0.25s' }}>Liên hệ với chúng tôi</h1>
          <p className="mx-auto mt-5 max-w-xl font-body text-sm text-white/85 opacity-0 animate-fade-in-up sm:text-base" style={{ animationDelay: '0.45s' }}>
            Chúng tôi luôn sẵn sàng lắng nghe Quý khách.
          </p>
        </div>
      </section>

      {/* ---------- Info + Form ---------- */}
      <section className="bg-off-white py-16 md:py-24">
        <div className="container mx-auto grid gap-12 px-5 lg:grid-cols-2 lg:gap-16 lg:px-10">
          {/* Thông tin liên hệ */}
          <Reveal>
            <span className="font-nav text-xs font-semibold uppercase tracking-luxe text-gold">Thông tin</span>
            <h2 className="mt-4 font-display text-4xl font-medium leading-tight text-charcoal md:text-5xl">Kết nối với Khách sạn Hà Nội</h2>
            <p className="mt-5 max-w-md font-body text-[15px] leading-relaxed text-charcoal/65">
              Để đặt phòng, đặt bàn hoặc cần tư vấn về dịch vụ, vui lòng liên hệ với chúng tôi qua các kênh dưới đây hoặc gửi tin nhắn trực tiếp.
            </p>

            <div className="mt-8 space-y-6">
              {contactBlocks.map((b) => (
                <div key={b.title} className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-gold shadow-subtle">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={b.icon} /></svg>
                  </span>
                  <div>
                    <h3 className="font-nav text-xs font-semibold uppercase tracking-wide text-charcoal/45">{b.title}</h3>
                    {b.lines.map((l, i) => (
                      <p key={i} className="mt-0.5 font-body text-[15px] text-charcoal/80">{l}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Form */}
          <Reveal delay={120}>
            <form onSubmit={handleSubmit} className="rounded-lg bg-white p-7 shadow-raised sm:p-8">
              <h3 className="font-display text-2xl font-semibold text-charcoal">Gửi tin nhắn</h3>
              <div className="mt-2 h-px w-16 bg-gold" />
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelBase}>Họ và tên *</label>
                  <input type="text" required className={inputBase} placeholder="Nguyễn Văn A" />
                </div>
                <div>
                  <label className={labelBase}>Email *</label>
                  <input type="email" required className={inputBase} placeholder="email@example.com" />
                </div>
              </div>
              <div className="mt-4">
                <label className={labelBase}>Tiêu đề *</label>
                <input type="text" required className={inputBase} placeholder="Chủ đề liên hệ" />
              </div>
              <div className="mt-4">
                <label className={labelBase}>Nội dung *</label>
                <textarea required rows={5} className={`${inputBase} resize-y`} placeholder="Nội dung tin nhắn..." />
              </div>
              <button type="submit" className="mt-6 w-full rounded-sm bg-gold px-6 py-3.5 font-nav text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gold-hover">
                Gửi tin nhắn
              </button>
            </form>
          </Reveal>
        </div>
      </section>

      {/* ---------- Bản đồ ---------- */}
      <section className="bg-white">
        <iframe
          title="Bản đồ Khách sạn Hà Nội"
          src="https://www.google.com/maps?q=Giang+Vo+Ba+Dinh+Ha+Noi&output=embed"
          className="h-[420px] w-full border-0 grayscale-[0.2]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
