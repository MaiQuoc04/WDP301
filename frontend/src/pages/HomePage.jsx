import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Welcome from '../components/Welcome'
import FeaturedRoom from '../components/FeaturedRoom'
import SpecialOffers from '../components/SpecialOffers'
import Dining from '../components/Dining'
import Amenities from '../components/Amenities'
import RoomCards from '../components/RoomCards'
import SocialBar from '../components/SocialBar'
import Testimonials from '../components/Testimonials'
import ContactForm from '../components/ContactForm'
import Footer from '../components/Footer'

const HomePage = () => {
  return (
    <div className="page-wrapper">
      <Navbar />
      <SocialBar />
      <main>
        <Hero />
        <Welcome />
        <FeaturedRoom />
        {/* Keeping RoomCards here as part of the homepage flow, since it was previously created. We can put it after FeaturedRoom */}
        <RoomCards />
        <SpecialOffers />
        <Dining />
        <Amenities />
        <Testimonials />
        <ContactForm />
      </main>
      <Footer />
    </div>
  )
}

export default HomePage
