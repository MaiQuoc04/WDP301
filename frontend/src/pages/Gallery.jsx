import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import HeroBanner from '../components/common/HeroBanner';
import MasonryGallery from '../components/common/MasonryGallery';
import '../components/common/CommonComponents.css';

const Gallery = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const galleryImages = [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1542314831-c6a4d14d8c53?auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1551882547-ff40c0d13c11?auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80"
  ];

  return (
    <div className="cc-page-wrapper">
      <Navbar />

      <HeroBanner 
        title="Thư Viện Ảnh" 
        subtitle="GALLERY" 
        backgroundImage="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80" 
      />

      <div className="cc-intro">
        <h2 className="cc-intro-title">Trải Nghiệm Khách Sạn Qua Ống Kính</h2>
        <div className="cc-intro-divider"></div>
        <p className="cc-intro-text">
          Khám phá vẻ đẹp sang trọng, đẳng cấp và những khoảnh khắc tuyệt vời tại Hanoi Hotel trước khi bạn bắt đầu hành trình của mình cùng chúng tôi.
        </p>
      </div>

      <MasonryGallery title="Tất Cả Hình Ảnh" images={galleryImages} />

      <Footer />
    </div>
  );
};

export default Gallery;
