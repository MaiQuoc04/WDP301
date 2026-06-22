import React from 'react';
import { Row, Col } from 'antd';
import './CommonComponents.css';

const InfoGrid = ({ items }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="cc-info-grid-wrapper">
      <div className="cc-info-grid-inner">
        <Row gutter={[40, 40]}>
          {items.map((item, index) => {
            const isMiddle = index > 0 && index < items.length - 1;
            return (
              <Col xs={24} md={24 / items.length} key={index}>
                <div className={`cc-info-item ${isMiddle ? 'cc-info-item-bordered' : ''}`}>
                  <h4>{item.title}</h4>
                  {item.details.map((detail, idx) => (
                    <p key={idx} style={detail.style || {}}>{detail.text}</p>
                  ))}
                </div>
              </Col>
            );
          })}
        </Row>
      </div>
    </div>
  );
};

export default InfoGrid;
