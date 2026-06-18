import './SpecialOffers.css'

const SpecialOffers = ({ offers = [] }) => {
  if (!offers || offers.length === 0) return null

  return (
    <section className="section special-offers">
      <div className="container">
        <h2>Ưu đãi đặc biệt</h2>
        <h3 className="special-offers__subtitle">Bất ngờ gì đang chờ đợi bạn?</h3>
        <p className="special-offers__desc">
          Tọa lạc tại khu vực trung tâm thủ đô, Khách sạn Hà Nội mang đến không gian lưu trú tiện nghi và sang trọng bên hồ Giảng Võ yên bình với nhiều hạng phòng đa dạng, đáp ứng mọi nhu cầu của Quý khách, dù là trong kỳ nghỉ dưỡng hay chuyến công tác dài ngày. Hãy đến và trải nghiệm những dịch vụ hấp dẫn tại khách sạn Hà Nội!
        </p>

        <div className="special-offers__grid">
          {offers.map((offer, index) => (
            <a key={offer._id || index} href={offer.link || '#'} className="offer-card">
              <img src={offer.image} alt={offer.title} />
              <div style={{ position: 'absolute', bottom: '10px', left: '10px', color: 'white', backgroundColor: 'rgba(0,0,0,0.5)', padding: '5px 10px', borderRadius: '4px' }}>
                {offer.title}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

export default SpecialOffers
