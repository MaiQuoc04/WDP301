import React from 'react';
import { Row, Col, Image } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import './CommonComponents.css';

const MasonryGallery = ({ title = "Gallery", images }) => {
  if (!images || images.length === 0) return null;

  return (
    <div className="cc-gallery-wrapper">
      <h2 className="cc-gallery-title">{title}</h2>
      <Image.PreviewGroup>
        <Row gutter={[16, 16]}>
          {images.map((src, index) => (
            <Col xs={24} sm={12} md={6} key={index}>
              <div className="cc-gallery-item">
                <Image 
                  src={src} 
                  alt={`Gallery Image ${index}`} 
                  width="100%" 
                  height="100%"
                  preview={{
                    mask: (
                      <div className="cc-gallery-overlay">
                        <PlusOutlined />
                      </div>
                    )
                  }}
                />
              </div>
            </Col>
          ))}
        </Row>
      </Image.PreviewGroup>
    </div>
  );
};

export default MasonryGallery;
