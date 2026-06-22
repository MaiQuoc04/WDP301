import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerService } from '../services';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button, Row, Col, Image } from 'antd';
import { 
  CheckOutlined, LeftOutlined, RightOutlined, 
  ExpandOutlined, TeamOutlined, EyeOutlined, 
  StarOutlined, LayoutOutlined 
} from '@ant-design/icons';
import './RoomDetail.css';

const RoomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [allRooms, setAllRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await customerService.getPublicRooms();
        if (res.success && res.data) {
          const roomsData = Array.isArray(res.data) ? res.data : (res.data.rooms || []);
          setAllRooms(roomsData);
          const found = roomsData.find(r => r._id === id);
          setRoom(found);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [id]);

  if (loading) return <div className="loading-state" style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', color: '#1a1a1a' }}>Đang tải thông tin phòng...</div>;
  if (!room) return <div className="error-state" style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', color: '#d32f2f' }}>Không tìm thấy hạng phòng này.</div>;

  const relatedRooms = allRooms.filter(r => r._id !== room._id).slice(0, 3);
  const heroImage = room.images && room.images.length > 0 ? room.images[0] : 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6';
  
  // Guarantee we have an array of images to slide through
  const galleryImages = room.images && room.images.length > 0 ? room.images : [
    'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd'
  ];

  const nextSlide = () => {
    setSlideIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevSlide = () => {
    setSlideIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  // Get current and next image for 2-image view
  const img1 = galleryImages[slideIndex];
  const img2 = galleryImages[(slideIndex + 1) % galleryImages.length];

  const dummyAmenities = [
    "Complimentary WIFI everywhere", "Dreamy pillow-topped mattress", 
    "Two types of heavenly pillows", "Rain shower & Hand shower",
    "Air conditioning", "42\" flat screen TV", 
    "Bathrobe & Slippers", "Luxurious bathroom amenities",
    "Hairdryer 1600W", "Electronic safe",
    "Iron & Ironing board", "Smoke detectors",
    "Non-smoking rooms", "Private Outdoor Jacuzzi"
  ];

  const getBedText = (type) => {
    switch(type) {
      case 'king': return 'King Bed';
      case 'double': return 'Double Bed';
      case 'twin': return 'Twin Beds';
      default: return 'Single Bed';
    }
  };

  return (
    <div className="rd-page">
      <Navbar />
      
      {/* Hero Banner Section */}
      <div className="rd-hero" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="rd-hero-overlay">
          <h1>{room.name}</h1>
        </div>
      </div>

      {/* Dark Description Banner */}
      <div className="rd-dark-banner">
        <div className="rd-dark-banner-container">
          <p style={{ textAlign: 'center' }}>
            Experience luxury and comfort at the {room.name}. This stunning suite boasts a refined interior, high-quality sanitary facilities, and wooden flooring. Enjoy natural light and breathtaking views of the city through panoramic windows. Take in the vibrant city atmosphere from your spacious balcony, perfect for watching the sunset.
          </p>
        </div>
      </div>

      {/* The Pleasure of Luxury Section */}
      <div className="rd-pleasure-section">
        <h2>The Pleasure of Luxury</h2>
        <p className="rd-pleasure-desc">
          Experience luxury and comfort at the {room.name}. This stunning suite boasts a refined interior, high-quality sanitary facilities, and wooden flooring. Enjoy natural light and breathtaking views of the city through panoramic windows. Take in the vibrant city atmosphere from your spacious balcony, perfect for watching the sunset.
        </p>
        
        <div className="rd-slider-container">
          <button className="rd-slider-arrow rd-arrow-left" onClick={prevSlide}>
            <LeftOutlined />
          </button>
          
          <Image.PreviewGroup>
            <div className="rd-slider-images">
              <div className="rd-slider-img-wrap">
                <Image 
                  src={img1} 
                  alt="Room View 1" 
                  width="100%" 
                  height="100%" 
                  style={{ objectFit: 'cover' }} 
                  className="rd-image-zoom"
                />
              </div>
              {galleryImages.length > 1 && (
                <div className="rd-slider-img-wrap">
                  <Image 
                    src={img2} 
                    alt="Room View 2" 
                    width="100%" 
                    height="100%" 
                    style={{ objectFit: 'cover' }}
                    className="rd-image-zoom" 
                  />
                </div>
              )}
            </div>
          </Image.PreviewGroup>
          
          <button className="rd-slider-arrow rd-arrow-right" onClick={nextSlide}>
            <RightOutlined />
          </button>
        </div>
      </div>

      {/* Content Section with Ant Design Grid */}
      <div className="rd-main-content">
        <Row className="rd-content-box">
          <Col xs={24} md={10} className="rd-infobox">
            <h3>Info Box</h3>
            <div className="rd-specs">
              <div className="rd-spec-item">
                <span className="rd-spec-icon"><ExpandOutlined /></span>
                <span>SIZE: {room.area}m2</span>
              </div>
              <div className="rd-spec-item">
                <span className="rd-spec-icon"><LayoutOutlined /></span>
                <span>BED(S): {getBedText(room.bedType)}</span>
              </div>
              <div className="rd-spec-item">
                <span className="rd-spec-icon"><StarOutlined /></span>
                <span>BATHROOM: Bathtub & Shower</span>
              </div>
              <div className="rd-spec-item">
                <span className="rd-spec-icon"><TeamOutlined /></span>
                <span>MAX: 0{room.capacity}</span>
              </div>
              <div className="rd-spec-item">
                <span className="rd-spec-icon"><EyeOutlined /></span>
                <span>VIEW: terrace, city view</span>
              </div>
            </div>
          </Col>

          <Col xs={24} md={14} className="rd-amenities">
            <h3>Amenities & Services</h3>
            <Row gutter={[16, 16]} className="rd-amenities-list">
              {dummyAmenities.map((am, i) => (
                <Col xs={24} sm={12} key={i}>
                  <div className="rd-amenity-item">
                    <CheckOutlined className="rd-check" />
                    <span>{am}</span>
                  </div>
                </Col>
              ))}
            </Row>
            <div className="rd-action">
              <Button type="primary" className="rd-btn" onClick={() => navigate(`/booking?roomType=${room._id}`)}>
                ĐẶT PHÒNG
              </Button>
            </div>
          </Col>
        </Row>
      </div>

      {/* Related Rooms */}
      {relatedRooms.length > 0 && (
        <div className="rd-related">
          <h2>YOU MIGHT BE INTERESTED</h2>
          <Row gutter={[32, 32]} className="rd-related-grid">
            {relatedRooms.map(rel => (
              <Col xs={24} md={8} key={rel._id}>
                <div className="rd-related-card">
                  <div className="rd-related-card-imgwrap">
                    <img src={rel.images && rel.images.length > 0 ? rel.images[0] : 'https://images.unsplash.com/photo-1566665797739-1674de7a421a'} alt={rel.name} />
                  </div>
                  <div className="rd-related-card-content">
                    <h4>{rel.name}</h4>
                    <p>{rel.description}</p>
                    <div className="rd-related-features">
                      <span><ExpandOutlined /> Room Size: {rel.area}m2</span>
                      <span><LayoutOutlined /> Bed Type: {getBedText(rel.bedType)}</span>
                      <span><TeamOutlined /> Max: 0{rel.capacity}</span>
                      <span><EyeOutlined /> View: Opened window, street view</span>
                    </div>
                    <div className="rd-related-actions">
                      <Button className="rd-btn-sm" onClick={() => navigate(`/booking?roomType=${rel._id}`)}>Đặt Phòng</Button>
                      <Button className="rd-btn-outline" onClick={() => {navigate(`/rooms/${rel._id}`); window.scrollTo(0,0);}}>Chi Tiết &rarr;</Button>
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* Floating Customer Support Button */}
      <button className="rd-floating-btn" onClick={() => alert('Customer support clicked')}>
        Hỗ Trợ Khách Hàng
      </button>

      <Footer />
    </div>
  );
};

export default RoomDetail;
