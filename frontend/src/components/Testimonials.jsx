import Reveal from './common/Reveal'

const Stars = ({ rating = 0 }) => (
  <div className="flex gap-0.5 text-gold" aria-label={`${rating} sao`}>
    {Array.from({ length: 5 }).map((_, i) => (
      <svg key={i} className={`h-4 w-4 ${i < rating ? 'text-gold' : 'text-black/15'}`} viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.79L10 14.77l-5.2 2.74.99-5.79L1.58 7.62l5.82-.85L10 1.5z" />
      </svg>
    ))}
  </div>
)

const initialsOf = (name) =>
  name ? name.trim().split(' ').slice(-2).map((w) => w[0]).join('').toUpperCase() : 'KH'

const Testimonials = ({ reviews = [] }) => {
  if (!reviews || reviews.length === 0) return null

  const shown = reviews.slice(0, 6)

  return (
    <section className="bg-white py-20 md:py-28">
      <div className="container mx-auto px-5 lg:px-10">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <span className="font-nav text-xs font-semibold uppercase tracking-luxe text-gold">Cảm nhận</span>
          <h2 className="mt-4 font-display text-4xl font-medium text-charcoal md:text-5xl">Khách hàng nói về chúng tôi</h2>
        </Reveal>

        <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {shown.map((review, i) => (
            <Reveal
              as="figure"
              key={review._id}
              delay={i * 100}
              className="relative flex h-full flex-col rounded-lg border border-black/5 bg-off-white p-7 shadow-subtle transition-shadow duration-300 hover:shadow-raised"
            >
              <span className="pointer-events-none absolute right-6 top-4 font-display text-6xl leading-none text-gold/15">”</span>
              <Stars rating={review.rating} />
              <blockquote className="mt-4 flex-1 font-body text-[15px] italic leading-relaxed text-charcoal/75">
                “{review.comment}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-black/5 pt-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold/15 font-nav text-sm font-semibold text-gold">
                  {initialsOf(review.customer?.fullName)}
                </span>
                <div>
                  <p className="font-nav text-sm font-semibold text-charcoal">{review.customer?.fullName || 'Khách hàng'}</p>
                  {/* Đánh giá là đánh giá CHI NHÁNH -> phải nói rõ chi nhánh nào, không thì
                      khách đọc lời khen mà chẳng biết đang khen nơi nào. */}
                  <p className="font-body text-xs text-charcoal/50">
                    {review.branch?.name ? `Khách lưu trú · ${review.branch.name}` : 'Khách lưu trú'}
                  </p>
                </div>
              </figcaption>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Testimonials
