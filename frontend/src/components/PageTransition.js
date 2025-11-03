import React from 'react';
import './PageTransition.css';

const PageTransition = ({ isLoading, message = "Yükleniyor" }) => {
  if (!isLoading) return null;

  return (
    <div className="page-transition-overlay">
      <div className="loading-particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>
      
      <div className="loading-content">
        <div className="loading-text">
          {message}
          <span className="dot">.</span>
          <span className="dot">.</span>
          <span className="dot">.</span>
        </div>
        
        <div className="loading-progress">
          <div className="loading-progress-bar"></div>
        </div>
        
        <div className="loading-subtext">
          Lütfen bekleyin...
        </div>
      </div>
    </div>
  );
};

export default PageTransition;

