import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBackendURL } from '../utils/api';
import useAutoRefresh from '../hooks/useAutoRefresh';
import useVisibilityChange from '../hooks/useVisibilityChange';
import './CampaignSlider.css';

const CampaignSlider = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();

  const loadCampaigns = useCallback(async () => {
    try {
      console.log('🔍 Loading campaigns from API...');
      const response = await fetch(process.env.REACT_APP_BACKEND_URL + '/api/campaigns/active');
      const data = await response.json();
      console.log('📊 Campaign response:', data);
      if (data.success) {
        console.log('✅ Campaigns loaded:', data.campaigns.length);
        setCampaigns(data.campaigns);
      } else {
        console.log('⚠️ No campaigns or failed:', data);
      }
    } catch (error) {
      console.error('❌ Load campaigns error:', error);
    }
  }, []);

  // Auto-refresh: Poll every 10 seconds
  useAutoRefresh(loadCampaigns, 10000);
  
  // Auto-refresh: When tab becomes visible
  useVisibilityChange(loadCampaigns);

  useEffect(() => {
    if (campaigns.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % campaigns.length);
      }, 6000); // 6 seconds
      return () => clearInterval(interval);
    }
  }, [campaigns.length]);

  const nextSlide = () => {
    if (isAnimating || campaigns.length === 0) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % campaigns.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const prevSlide = () => {
    if (isAnimating || campaigns.length === 0) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + campaigns.length) % campaigns.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handleClick = async (campaign) => {
    try {
      await fetch(`${getBackendURL()}/api/campaigns/${campaign.id}/click`, { method: 'POST' });
      navigate(`/campaign/${campaign.id}`);
    } catch (error) {
      console.error('Track click error:', error);
      // Navigate anyway even if tracking fails
      navigate(`/campaign/${campaign.id}`);
    }
  };

  // Debug: Show if no campaigns
  if (campaigns.length === 0) {
    console.log('⚠️ No campaigns to display');
    return (
      <div className="campaign-slider-container" style={{ 
        padding: '20px', 
        textAlign: 'center',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '12px',
        margin: '20px auto',
        maxWidth: '1400px'
      }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0 }}>
          📢 No active campaigns at the moment
        </p>
      </div>
    );
  }

  const currentCampaign = campaigns[currentIndex];

  return (
    <div className="campaign-slider-container">
      <div className="campaign-slider-header">
        <a href="/campaigns" className="campaign-view-all">
          📋 View All
        </a>
      </div>

      <div className="campaign-slider">
        <div 
          className={`campaign-card ${isAnimating ? 'animating' : ''}`}
          onClick={() => handleClick(currentCampaign)}
        >
          {/* Banner Image */}
          {currentCampaign.bannerUrl && (
            <div className="campaign-banner">
              <img src={currentCampaign.bannerUrl} alt={currentCampaign.title} />
              {currentCampaign.featured && (
                <div className="campaign-featured-badge">⭐ FEATURED</div>
              )}
            </div>
          )}

          {/* Single Line Content */}
          <div className="campaign-content-single-line">
            {/* Category Badge */}
            <div className="campaign-category">
              {currentCampaign.category?.toUpperCase() || 'GENERAL'}
            </div>
            
            {/* Title */}
            <h3 className="campaign-title">{currentCampaign.title}</h3>
            
            {/* Stats */}
            <div className="campaign-stats-inline">
              <div className="campaign-stat">
                <span className="campaign-stat-value">{currentCampaign.views || 0}</span>
                <span className="campaign-stat-label">Views</span>
              </div>
              <div className="campaign-stat">
                <span className="campaign-stat-value">{currentCampaign.clicks || 0}</span>
                <span className="campaign-stat-label">Clicks</span>
              </div>
            </div>

            {/* CTA Button */}
            <button className="campaign-cta">
              {currentCampaign.buttonText || 'Learn More'} →
            </button>
          </div>
        </div>

        {/* Navigation */}
        {campaigns.length > 1 && (
          <>
            <button className="campaign-nav-btn prev" onClick={prevSlide}>‹</button>
            <button className="campaign-nav-btn next" onClick={nextSlide}>›</button>
            
            <div className="campaign-dots">
              {campaigns.map((_, idx) => (
                <button
                  key={idx}
                  className={`campaign-dot ${idx === currentIndex ? 'active' : ''}`}
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

export default CampaignSlider;

