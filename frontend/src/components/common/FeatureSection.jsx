import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CommonComponents.css';

const FeatureSection = ({ title, description, image, reversed = false, altBg = false, buttonText, buttonLink, bulletPoints }) => {
  const navigate = useNavigate();

  return (
    <div className={`cc-feature ${altBg ? 'alt-bg' : ''}`} style={{ flexDirection: reversed ? 'row-reverse' : 'row' }}>
      <div 
        className="cc-feature-img" 
        style={{ backgroundImage: `url(${image})` }}
      ></div>
      <div className="cc-feature-content">
        <h3>{title}</h3>
        {Array.isArray(description) ? (
          description.map((p, idx) => <p key={idx}>{p}</p>)
        ) : (
          <p>{description}</p>
        )}
        
        {bulletPoints && bulletPoints.length > 0 && (
          <ul className="cc-feature-list">
            {bulletPoints.map((point, idx) => (
              <li key={idx}>
                {point.label && <strong>{point.label}: </strong>}
                {point.text}
              </li>
            ))}
          </ul>
        )}

        {buttonText && (
          <button 
            className="cc-btn" 
            onClick={() => buttonLink ? navigate(buttonLink) : navigate('/contact')}
          >
            {buttonText}
          </button>
        )}
      </div>
    </div>
  );
};

export default FeatureSection;
