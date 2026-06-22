import React, { useState, useEffect } from 'react'
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
import { customerService } from '../services'

const HomePage = () => {
  const [homeData, setHomeData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const res = await customerService.getHomeData()
        if (res.success) {
          setHomeData(res.data)
        }
      } catch (err) {
        console.error('Lỗi tải dữ liệu trang chủ:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchHomeData()
  }, [])

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Đang tải dữ liệu...</div>
  }

  return (
    <div className="page-wrapper">
      <Navbar />
      <SocialBar />
      <main>
        <Hero />
        <Welcome />
        <FeaturedRoom rooms={homeData?.featuredRooms || []} />
        <RoomCards rooms={homeData?.featuredRooms || []} />
        <SpecialOffers offers={homeData?.offers || []} />
        <Dining dining={homeData?.dining || []} />
        <Amenities />
        <Testimonials reviews={homeData?.reviews || []} />
        <ContactForm />
      </main>
      <Footer />
    </div>
  )
}

export default HomePage
