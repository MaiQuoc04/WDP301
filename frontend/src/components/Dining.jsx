import './Dining.css'

const diningItems = [
  {
    id: 1,
    title: 'Nhà hàng Kim Long',
    image: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    link: '/dining/kim-long'
  },
  {
    id: 2,
    title: 'Lobby Bar',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    link: '/dining/lobby-bar'
  },
  {
    id: 3,
    title: 'Nhà hàng Hoàng Triều',
    image: 'https://images.unsplash.com/photo-1555126634-323283e090fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    link: '/dining/hoang-trieu'
  }
]

const Dining = () => {
  return (
    <section className="section dining">
      <div className="container">
        <h2>Ẩm thực</h2>
        <p className="dining__desc">
          Khám phá thế giới ẩm thực phong phú tại khách sạn Hà Nội, nơi những nhà hàng của chúng tôi phục vụ đa dạng các món ăn Quảng Đông, Hồng Kông và đặc biệt là những xửng Dimsum trứ danh. Hãy cùng thưởng thức hương vị độc đáo của những tinh hoa ẩm thực trong không gian tinh tế giữa lòng thủ đô.
        </p>

        <div className="dining__grid">
          {diningItems.map((item) => (
            <a href={item.link} className="dining-card" key={item.id}>
              <div className="dining-card__inner">
                <div className="dining-card__front">
                  <img src={item.image} alt={item.title} />
                  <div className="dining-card__overlay">
                    <h3 className="dining-card__title">{item.title}</h3>
                  </div>
                </div>
                <div className="dining-card__back">
                  <img src={item.image} alt={item.title} />
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
