import './SpecialOffers.css'

const SpecialOffers = () => {
  return (
    <section className="section special-offers">
      <div className="container">
        <h2>Ưu đãi đặc biệt</h2>
        <h3 className="special-offers__subtitle">Bất ngờ gì đang chờ đợi bạn?</h3>
        <p className="special-offers__desc">
          Tọa lạc tại khu vực trung tâm thủ đô, Khách sạn Hà Nội mang đến không gian lưu trú tiện nghi và sang trọng bên hồ Giảng Võ yên bình với nhiều hạng phòng đa dạng, đáp ứng mọi nhu cầu của Quý khách, dù là trong kỳ nghỉ dưỡng hay chuyến công tác dài ngày. Hãy đến và trải nghiệm những dịch vụ hấp dẫn tại khách sạn Hà Nội!
        </p>

        <div className="special-offers__grid">
          <a href="#" className="offer-card">
            <img src="https://images.unsplash.com/photo-1543330091-27228394c7dc?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Children's Day Promotion" />
          </a>
          <a href="#" className="offer-card">
            <img src="https://images.unsplash.com/photo-1490818387583-1b5ba4098939?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Summer Unlocked Promotion" />
          </a>
          <a href="#" className="offer-card">
            <img src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Sturgeon Essence Promotion" />
          </a>
        </div>
      </div>
    </section>
  )
}

export default SpecialOffers
