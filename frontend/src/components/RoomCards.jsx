import './RoomCards.css'

const RoomCards = ({ rooms = [] }) => {
  if (!rooms || rooms.length === 0) return null

  return (
    <section className="section section--alt room-cards">
      <div className="container">
        <div className="room-cards__header">
          <h2 className="room-cards__title">Hạng Phòng Cao Cấp</h2>
          <p className="room-cards__subtitle">Tận hưởng không gian nghỉ dưỡng đẳng cấp mang đậm dấu ấn di sản</p>
        </div>

        <div className="room-cards__grid">
          {rooms.map(room => (
            <div key={room._id} className="premium-card">
              <div className="premium-card__image-wrap">
                <img src={room.images && room.images.length > 0 ? room.images[0] : 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80'} alt={room.name} className="premium-card__img" />
              </div>
              <div className="premium-card__content">
                <h3 className="premium-card__title">{room.name}</h3>
                <p className="premium-card__desc">{room.description}</p>
                <div className="premium-card__footer">
                  <span className="premium-card__price">Từ {room.basePrice.toLocaleString('vi-VN')} ₫ / đêm</span>
                  <a href={`/rooms/${room._id}`} className="btn btn--tertiary">CHI TIẾT</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default RoomCards
