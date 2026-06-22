import React from 'react';
import './CommonComponents.css';

const HeroBanner = ({ title, subtitle, backgroundImage }) => {
  return (
    <div 
      className="cc-hero" 
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="cc-hero-overlay"></div>
      <div className="cc-hero-content">
        {subtitle && <p>{subtitle}</p>}
        <h1>{title}</h1>
      </div>
    </div>
  );
};

export default HeroBanner;
