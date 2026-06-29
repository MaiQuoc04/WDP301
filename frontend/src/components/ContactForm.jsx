import Reveal from './common/Reveal'

const inputBase =
  'w-full rounded-sm border border-black/10 bg-white px-4 py-3 font-body text-sm text-charcoal outline-none transition-colors placeholder:text-charcoal/40 focus:border-gold focus:ring-1 focus:ring-gold/40'

const ContactForm = () => {
  return (
    <section className="relative overflow-hidden bg-gold py-20 md:py-24">
      {/* Lớp hoạ tiết */}
      <div className="pointer-events-none absolute inset-0 opacity-10">
        <div className="absolute -left-10 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-white blur-3xl" />
      </div>

      <div className="container relative mx-auto grid items-center gap-12 px-5 lg:grid-cols-2 lg:gap-20 lg:px-10">
        <Reveal className="text-white">
          <span className="font-nav text-xs font-semibold uppercase tracking-luxe text-white/80">Liên hệ</span>
          <h2 className="mt-4 font-display text-4xl font-medium leading-tight md:text-5xl">Bạn cần tư vấn?</h2>
          <p className="mt-5 max-w-md font-body text-[15px] leading-relaxed text-white/85">
            Hãy chia sẻ ý kiến của bạn với chúng tôi. Đừng quên để lại thông tin liên lạc ở biểu mẫu bên cạnh,
            đội ngũ Khách sạn Hà Nội sẽ phản hồi Quý khách trong thời gian sớm nhất.
          </p>
          <div className="mt-8 space-y-3 font-body text-sm text-white/90">
            <p className="flex items-center gap-3">
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.896-1.596-5.25-3.95-6.847-6.847l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
              (+84) 24 3845 2270
            </p>
            <p className="flex items-center gap-3">
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0l-9.75 6-9.75-6" /></svg>
              sales@hanoihotel.com.vn
            </p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <form onSubmit={(e) => e.preventDefault()} className="rounded-lg bg-white p-7 shadow-modal sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <input type="text" className={inputBase} placeholder="Họ và tên" required />
              <input type="tel" className={inputBase} placeholder="Số điện thoại" required />
            </div>
            <input type="email" className={`${inputBase} mt-4`} placeholder="Email" />
            <textarea className={`${inputBase} mt-4 min-h-[120px] resize-y`} placeholder="Lời nhắn" required />
            <button
              type="submit"
              className="mt-5 w-full rounded-sm bg-gold px-6 py-3.5 font-nav text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gold-hover"
            >
              Gửi yêu cầu
            </button>
          </form>
        </Reveal>
      </div>
    </section>
  )
}

export default ContactForm
