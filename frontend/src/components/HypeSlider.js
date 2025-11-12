import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBackendURL } from '../utils/api';
import useAutoRefresh from '../hooks/useAutoRefresh';
import useVisibilityChange from '../hooks/useVisibilityChange';
import './HypeSlider.css';
import { Colors } from 'chart.js';

const HypeSlider = () => {
  const [hypes, setHypes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();

  const loadHypes = useCallback(async () => {
    try {
      const response = await fetch(process.env.REACT_APP_BACKEND_URL + '/api/hype/active');
      const data = await response.json();
      if (data.success) {
        setHypes(data.hypes);
      }
    } catch (error) {
      console.error('Load hypes error:', error);
    }
  }, []);

  // Auto-refresh: Poll every 10 seconds
  useAutoRefresh(loadHypes, 10000);
  
  // Auto-refresh: When tab becomes visible
  useVisibilityChange(loadHypes);

  const nextSlide = () => {
    if (isAnimating || hypes.length === 0) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % hypes.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const prevSlide = () => {
    if (isAnimating || hypes.length === 0) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + hypes.length) % hypes.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  useEffect(() => {
    if (hypes.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % hypes.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [hypes.length]);

  const handleClick = async (hype) => {
    try {
      await fetch(`${getBackendURL()}/api/hype/${hype.id}/click`, { method: 'POST' });
      navigate(`/token/${hype.tokenAddress}`);
    } catch (error) {
      console.error('Track click error:', error);
    }
  };

  useEffect(() => {
    if (hypes.length > 0 && hypes[currentIndex]) {
      fetch(`${getBackendURL()}/api/hype/${hypes[currentIndex].id}/view`, { method: 'POST' })
        .catch(err => console.error('Track view error:', err));
    }
  }, [currentIndex, hypes]);

  if (hypes.length === 0) return null;

  const currentHype = hypes[currentIndex];
  const token = currentHype?.token;

  const getTierConfig = (tier) => {
    const configs = {
      platinum: {
        gradient: 'linear-gradient(135deg, #E5E4E2 0%, #C0C0C0 50%, #E5E4E2 100%)',
        glow: 'rgba(229, 228, 226, 0.4)',
        badge: '💎 PLATINUM',
        fire: true,
        particles: true
      },
      gold: {
        gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
        glow: 'rgba(255, 215, 0, 0.4)',
        badge: '👑 GOLD',
        fire: true,
        particles: false
      },
      silver: {
        gradient: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 50%, #C0C0C0 100%)',
        glow: 'rgba(192, 192, 192, 0.3)',
        badge: '⭐ SILVER',
        fire: false,
        particles: false
      },
      bronze: {
        gradient: 'linear-gradient(135deg, #CD7F32 0%, #B5651D 50%, #CD7F32 100%)',
        glow: 'rgba(205, 127, 50, 0.3)',
        badge: '🔥 BRONZE',
        fire: false,
        particles: false
      }
    };
    return configs[tier] || configs.bronze;
  };

  const config = getTierConfig(currentHype.tier);

  return (
    <div className="hype-slider-container">
      <div className="hype-slider">
        {/* Partiküller (Platinum) */}
        {config.particles && (
          <div className="hype-particles">
            {[...Array(15)].map((_, i) => (
              <div key={i} className="particle" style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }} />
            ))}
          </div>
        )}

        {/* Ateş efekti */}
        {config.fire && (
          <div className="hype-flames">
            <div className="flame flame-1"></div>
            <div className="flame flame-2"></div>
            <div className="flame flame-3"></div>
          </div>
        )}

        {/* Card */}
        <div 
          className={`hype-card tier-${currentHype.tier} ${isAnimating ? 'animating' : ''}`}
          onClick={() => handleClick(currentHype)}
          style={{ '--tier-gradient': config.gradient, '--tier-glow': config.glow }}
        >
          {/* Badge */}
          <div className="hype-badge">{config.badge}</div>

          {/* Content */}
          <div className="hype-content">
            <div className="hype-logo">
              {token?.logoURL ? (
                <img src={token.logoURL} alt={token.name} />
              ) : (
                <div className="logo-placeholder">🚀</div>
              )}
            </div>

            <div className="hype-info">
              <h3 className="hype-name">{token?.name || 'Unknown'}</h3>
              <p className="hype-symbol">${token?.symbol || '???'}</p>
              <p className="hype-description">{token?.description?.substring(0, 100) || 'No description'}</p>
            </div>

            <div className="hype-stats">
              <div className="stat">
                <span className="stat-label">Views</span>
                <span className="stat-value">{currentHype.views}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Clicks</span>
                <span className="stat-value">{currentHype.clicks}</span>
              </div>
            </div>
          </div>

          {/* Corners */}
          <div className="hype-corners">
            <div className="corner corner-tl"></div>
            <div className="corner corner-tr"></div>
            <div className="corner corner-bl"></div>
            <div className="corner corner-br"></div>
          </div>
        </div>

        {/* Navigation */}
        {hypes.length > 1 && (
          <>
            <button className="slider-btn prev" onClick={prevSlide}>‹</button>
            <button className="slider-btn next" onClick={nextSlide}>›</button>
            
            <div className="slider-dots">
              {hypes.map((_, idx) => (
                <button
                  key={idx}
                  className={`dot ${idx === currentIndex ? 'active' : ''}`}
                  onClick={() => !isAnimating && setCurrentIndex(idx)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HypeSlider;

