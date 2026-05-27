import './RoomCards.css'

const rooms = [
  {
    id: 1,
    title: 'Phòng Deluxe',
    description: 'Trải nghiệm không gian nghỉ dưỡng thanh lịch với tầm nhìn bao quát thành phố, mang đậm dấu ấn Á Đông đương đại.',
    image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    price: '2.500.000 VNĐ',
  },
  {
    id: 2,
    title: 'Executive Suite',
    description: 'Tận hưởng sự xa hoa với không gian phòng khách riêng biệt và ban công hướng hồ Hoàn Kiếm tĩnh lặng.',
    image: 'https://images.unsplash.com/photo-1582719478250-c89402bb6a0f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    price: '5.200.000 VNĐ',
  },
  {
    id: 3,
    title: 'Presidential Suite',
    description: 'Đỉnh cao của sự sang trọng với nội thất độc bản, mang đến trải nghiệm hoàng gia giữa lòng thủ đô Hà Nội.',
    image: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    price: '15.000.000 VNĐ',
  }
]

const RoomCards = () => {
  return (
    <section className="section section--alt room-cards">
      <div className="container">
        <div className="room-cards__header">
          <h2 className="room-cards__title">Hạng Phòng Cao Cấp</h2>
          <p className="room-cards__subtitle">Tận hưởng không gian nghỉ dưỡng đẳng cấp mang đậm dấu ấn di sản</p>
        </div>

        <div className="room-cards__grid">
          {rooms.map(room => (
            <div key={room.id} className="premium-card">
              <div className="premium-card__image-wrap">
                <img src={room.image} alt={room.title} className="premium-card__img" />
              </div>
              <div className="premium-card__content">
                <h3 className="premium-card__title">{room.title}</h3>
                <p className="premium-card__desc">{room.description}</p>
                <div className="premium-card__footer">
                  <span className="premium-card__price">Từ {room.price} / đêm</span>
                  <button className="btn btn--tertiary">CHI TIẾT</button>
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
