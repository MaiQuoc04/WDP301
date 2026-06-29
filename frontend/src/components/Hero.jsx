import BookingForm from './BookingForm'

const Hero = () => {
  return (
    <section className="hero relative flex min-h-screen flex-col justify-center overflow-hidden">
      {/* Background image + ken-burns */}
      <div className="absolute inset-0 -z-20">
        <img
          src="https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
          alt="Hanoi Hotel Luxury Room"
          className="h-full w-full object-cover animate-ken-burns"
        />
      </div>
      {/* Gradient overlay */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/65 via-black/45 to-black/80" />
      {/* Vignette hướng tâm: làm tối vùng sau chữ để tiêu đề nổi rõ trên mọi vùng ảnh */}
      <div
        className="absolute inset-0 -z-10"
        style={{ background: 'radial-gradient(ellipse 65% 55% at 50% 46%, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.25) 45%, transparent 75%)' }}
      />

      {/* Title block */}
      <div className="container relative flex flex-1 flex-col items-center justify-center px-5 pt-28 text-center text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.65)]">
        <span
          className="mb-5 inline-block font-nav text-xs font-medium uppercase tracking-luxe text-white/90 opacity-0 animate-fade-in-up"
          style={{ animationDelay: '0.1s' }}
        >
          Khách sạn Quốc tế bên Hồ Giảng Võ
        </span>
        <h1
          className="font-display text-6xl font-medium leading-none opacity-0 animate-fade-in-up [text-shadow:0_4px_30px_rgba(0,0,0,0.7)] sm:text-7xl md:text-8xl"
          style={{ animationDelay: '0.25s' }}
        >
          Hanoi Hotel
        </h1>
        <p
          className="mt-5 font-nav text-sm font-light uppercase tracking-luxe text-white opacity-0 animate-fade-in-up sm:text-base"
          style={{ animationDelay: '0.45s' }}
        >
          Live Oriental Heritage
        </p>
      </div>

      {/* Booking widget nổi */}
      <div
        className="container relative z-10 px-5 pb-14 opacity-0 animate-fade-in-up"
        style={{ animationDelay: '0.65s' }}
      >
        <BookingForm />
      </div>

      {/* Scroll cue */}
      <div className="pointer-events-none absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-white/70 md:flex">
        <span className="font-nav text-[10px] uppercase tracking-luxe">Cuộn xuống</span>
        <span className="h-10 w-px animate-pulse bg-white/50" />
      </div>
    </section>
  )
}

export default Hero
