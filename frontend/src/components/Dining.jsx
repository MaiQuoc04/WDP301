import './Dining.css'

const Dining = ({ dining = [] }) => {
  if (!dining || dining.length === 0) return null

  return (
    <section className="section dining">
      <div className="container">
        <h2>Ẩm thực</h2>
        <p className="dining__desc">
          Khám phá thế giới ẩm thực phong phú tại khách sạn Hà Nội, nơi những nhà hàng của chúng tôi phục vụ đa dạng các món ăn Quảng Đông, Hồng Kông và đặc biệt là những xửng Dimsum trứ danh. Hãy cùng thưởng thức hương vị độc đáo của những tinh hoa ẩm thực trong không gian tinh tế giữa lòng thủ đô.
        </p>

        <div className="dining__grid">
          {dining.map((item) => (
            <a href={`/dining/${item._id}`} className="dining-card" key={item._id}>
              <div className="dining-card__inner">
                <div className="dining-card__front">
                  <img src={item.image} alt={item.name} />
                  <div className="dining-card__overlay">
                    <h3 className="dining-card__title">{item.name}</h3>
                  </div>
                </div>
                <div className="dining-card__back">
                  <img src={item.image} alt={item.name} />
                  <div className="dining-card__btn">Xem thêm</div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Dining
