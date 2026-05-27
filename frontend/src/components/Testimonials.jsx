import './Testimonials.css'

const reviews = [
  {
    id: 1,
    title: 'Trải nghiệm đáng nhớ',
    text: '"Cảnh hồ rất thư giãn, buffet sáng tuyệt vời và nhân viên thì rất chu đáo, sẵn sàng hỗ trợ để đảm bảo chúng tôi có đầy đủ mọi thứ mà chúng tôi cần."',
    author: 'Michael T',
    location: 'Singapore'
  },
  {
    id: 2,
    title: 'Khách sạn tuyệt vời giữa lòng thủ đô',
    text: '"Đây là khách sạn yêu thích của tôi mỗi lần đến Hà Nội. Phòng nghỉ lúc nào cũng sạch sẽ, dịch vụ tốt và nhân viên chu đáo. Bữa trưa và tối ở đây cũng rất ngon."',
    author: 'Satoshi K',
    location: 'Nhật Bản'
  },
  {
    id: 3,
    title: 'Cảnh đẹp và dịch vụ tốt',
    text: '"Khách sạn Hà Nội có cảnh hồ đẹp, đội ngũ nhân viên rất thân thiện và luôn hỗ trợ nhiệt tình. Chắc chắn tôi sẽ còn quay lại đây lần nữa!"',
    author: 'Linh N',
    location: 'Việt Nam'
  },
  {
    id: 4,
    title: 'Ẩm thực chuẩn vị Trung Hoa',
    text: '"Nhà hàng ẩm thực Trung Hoa của khách sạn thật sự rất tuyệt vời. Tôi đặc biệt ấn tượng với những món Dimsum ở đây, một trong những món Dimsum ngon nhất tôi từng thử!"',
    author: 'Ryan H',
    location: 'Singapore'
  }
]

const LotusWatermark = () => (
  <svg className="testimonial-card__watermark" viewBox="0 0 64 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 4C34 14 36 24 34 38C32 42 32 42 30 38C28 24 30 14 32 4Z" fill="#A18348" />
    <path d="M24 12C27 20 29 28 28 40C26 42 24 40 22 36C19 28 20 18 24 12Z" fill="#A18348" />
    <path d="M40 12C37 20 35 28 36 40C38 42 40 40 42 36C45 28 44 18 40 12Z" fill="#A18348" />
    <path d="M16 20C20 26 23 32 24 42C21 43 18 40 15 34C12 28 13 23 16 20Z" fill="#A18348" />
    <path d="M48 20C44 26 41 32 40 42C43 43 46 40 49 34C52 28 51 23 48 20Z" fill="#A18348" />
  </svg>
)

const Testimonials = () => {
  return (
    <section className="section testimonials">
      <div className="container" style={{ position: 'relative' }}>
        <h2 className="testimonials__heading">Phản hồi của khách hàng</h2>
        
        <div className="testimonials__slider">
          <button className="testimonials__nav-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          
          <div className="testimonials__grid">
            {reviews.map(review => (
              <div key={review.id} className="testimonial-card">
                <LotusWatermark />
                <h4 className="testimonial-card__title">{review.title}</h4>
                <div className="testimonial-card__stars">★★★★★</div>
                <p className="testimonial-card__text">{review.text}</p>
                
                <div className="testimonial-card__footer">
                  <div className="testimonial-card__avatar">
                    <span className="google-text">Google</span>
                    <span className="google-stars">★★★★★</span>
                  </div>
                  <div className="testimonial-card__author-info">
                    <span className="testimonial-card__author">— {review.author}</span>
                    <span className="testimonial-card__location">{review.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="testimonials__pagination">
            <span className="dot dot--active"></span>
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Testimonials
