import './Hero.css'
import BookingForm from './BookingForm'

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero__bg">
        {/* Using a high-quality luxury hotel image from Unsplash as fallback since image generation quota was reached */}
        <img 
          src="https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" 
          alt="Hanoi Hotel Luxury Room" 
          className="hero__img" 
        />
      </div>
      <div className="hero__overlay"></div>
      
      <div className="hero__content container">
        <h1 className="hero__title">Hanoi Hotel</h1>
        <p className="hero__subtitle">LIVE ORIENTAL HERITAGE</p>
      </div>

      <div className="hero__booking-wrapper container">
         <BookingForm />
      </div>
    </section>
  )
}

export default Hero
