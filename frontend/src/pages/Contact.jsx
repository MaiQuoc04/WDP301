import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import HeroBanner from '../components/common/HeroBanner';
import InfoGrid from '../components/common/InfoGrid';
import { Form, Input, Button, Row, Col } from 'antd';
import '../components/common/CommonComponents.css';

const { TextArea } = Input;

const Contact = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const contactInfo = [
    {
      title: "Địa Chỉ",
      details: [
        { text: "D8 Giảng Võ, Phường Giảng Võ" },
        { text: "Quận Ba Đình, Hà Nội, Việt Nam" }
      ]
    },
    {
      title: "Điện Thoại & Email",
      details: [
        { text: "Tel: +84 24 3845 2270" },
        { text: "Fax: +84 24 3845 9209" },
        { text: "Email: info@hanoihotel.com.vn" }
      ]
    },
    {
      title: "Theo Dõi",
      details: [
        { text: "Facebook: HanoiHotel" },
        { text: "Instagram: @hanoihotel" }
      ]
    }
  ];

  const onFinish = (values) => {
    console.log('Success:', values);
    alert('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong thời gian sớm nhất.');
  };

  return (
    <div className="cc-page-wrapper">
      <Navbar />

      <HeroBanner 
        title="Liên Hệ" 
        subtitle="CONTACT US" 
        backgroundImage="https://images.unsplash.com/photo-1509822929063-6b6cfc9b42f2?auto=format&fit=crop&q=80" 
      />

      <InfoGrid items={contactInfo} />

      <div style={{ maxWidth: '800px', margin: '80px auto', padding: '0 20px' }}>
        <h2 className="cc-intro-title" style={{ textAlign: 'center' }}>Gửi Tin Nhắn</h2>
        <div className="cc-intro-divider"></div>
        
        <Form layout="vertical" onFinish={onFinish} style={{ marginTop: '40px' }}>
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item label="Họ và Tên" name="name" rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}>
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email', message: 'Vui lòng nhập email hợp lệ!' }]}>
                <Input size="large" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Tiêu Đề" name="subject" rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item label="Nội Dung" name="message" rules={[{ required: true }]}>
            <TextArea rows={5} size="large" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'center', marginTop: '30px' }}>
            <Button type="primary" htmlType="submit" size="large" style={{ backgroundColor: '#a18348', borderColor: '#a18348', width: '200px' }}>
              Gửi Tin Nhắn
            </Button>
          </Form.Item>
        </Form>
      </div>

      <Footer />
    </div>
  );
};

export default Contact;
