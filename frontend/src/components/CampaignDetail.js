import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBackendURL } from '../utils/api';
import './CampaignDetail.css';

const CampaignDetail = () => {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCampaignDetail();
  }, [id]);

  const fetchCampaignDetail = async () => {
    try {
      console.log('🔍 Fetching campaign:', id);
      
      // View artırma
      await fetch(`${getBackendURL()}/api/campaigns/${id}/view`, {
        method: 'POST'
      }).catch(err => console.warn('View tracking failed:', err));

      // Kampanya detayını getir
      const response = await fetch(`${getBackendURL()}/api/campaigns/${id}`);
      console.log('📊 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Campaign not found');
      }
      
      const data = await response.json();
      console.log('📊 Campaign data:', data);
      
      if (data.success && data.campaign) {
        setCampaign(data.campaign);
        console.log('✅ Campaign loaded:', data.campaign.title);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ Error fetching campaign:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCtaClick = async () => {
    if (!campaign?.ctaLink) {
      console.warn('No CTA link available');
      return;
    }

    try {
      // Click artırma
      await fetch(`${getBackendURL()}/api/campaigns/${id}/click`, {
        method: 'POST'
      }).catch(err => console.warn('Click tracking failed:', err));

      // Link'i aç
      window.open(campaign.ctaLink, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error tracking click:', error);
      // Hata olsa bile linki aç
      window.open(campaign.ctaLink, '_blank', 'noopener,noreferrer');
    }
  };

  const getCampaignStatus = () => {
    if (!campaign) return null;
    
    const now = new Date();
    const endDate = new Date(campaign.endDate);
    
    if (endDate < now) {
      return { text: 'Campaign Ended', class: 'ended', icon: '⏹️' };
    }
    
    const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 3) {
      return { 
        text: `Ending Soon - ${daysLeft} days left`, 
        class: 'ending-soon', 
        icon: '⏰' 
      };
    }
    
    return { text: 'Active Campaign', class: 'active', icon: '✅' };
  };

  if (loading) {
    return (
      <div className="campaign-detail-page">
        <div className="campaign-detail-loading">
          <div className="loading-spinner"></div>
          <p>Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="campaign-detail-page">
        <div className="campaign-detail-error">
          <div className="error-icon">❌</div>
          <h2>Campaign Not Found</h2>
          <p>The campaign you're looking for doesn't exist or has been removed.</p>
          <Link to="/campaigns" className="back-to-campaigns-btn">
            ← Back to Campaigns
          </Link>
        </div>
      </div>
    );
  }

  const status = getCampaignStatus();

  return (
    <div className="campaign-detail-page">
      {/* Breadcrumb */}
      <div className="campaign-breadcrumb">
        <Link to="/">Home</Link>
        <span className="breadcrumb-separator">›</span>
        <Link to="/campaigns">Campaigns</Link>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">{campaign.title}</span>
      </div>

      {/* Hero Banner */}
      <div className="campaign-detail-hero">
        <div className="campaign-hero-banner">
          <img src={campaign.bannerUrl} alt={campaign.title} />
          <div className="campaign-hero-overlay">
            {campaign.featured && (
              <div className="campaign-detail-featured-badge">
                ⭐ Featured Campaign
              </div>
            )}
            <div className={`campaign-detail-status-badge ${status.class}`}>
              {status.icon} {status.text}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="campaign-detail-content">
        <div className="campaign-detail-container">
          {/* Main Content */}
          <div className="campaign-main-content">
            <div className="campaign-category-tag">
              {campaign.category}
            </div>
            
            <h1 className="campaign-detail-title">{campaign.title}</h1>
            
            <div className="campaign-detail-description">
              {campaign.description}
            </div>

            {/* Stats */}
            <div className="campaign-detail-stats">
              <div className="campaign-detail-stat">
                <div className="stat-icon">👁️</div>
                <div className="stat-content">
                  <div className="stat-value">{(campaign?.views || 0).toLocaleString()}</div>
                  <div className="stat-label">Total Views</div>
                </div>
              </div>
              
              <div className="campaign-detail-stat">
                <div className="stat-icon">🔗</div>
                <div className="stat-content">
                  <div className="stat-value">{(campaign?.clicks || 0).toLocaleString()}</div>
                  <div className="stat-label">Total Clicks</div>
                </div>
              </div>
              
              <div className="campaign-detail-stat">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <div className="stat-value">
                    {(campaign?.views || 0) > 0 
                      ? (((campaign?.clicks || 0) / campaign.views) * 100).toFixed(1) + '%'
                      : '0%'
                    }
                  </div>
                  <div className="stat-label">Click Rate</div>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            {status.class !== 'ended' && campaign?.ctaLink && (
              <div className="campaign-cta-section">
                <button 
                  onClick={handleCtaClick}
                  className="campaign-detail-cta-btn"
                >
                  {campaign.ctaText || 'Learn More'} →
                </button>
                <p className="campaign-cta-disclaimer">
                  You will be redirected to an external website
                </p>
              </div>
            )}

            {/* Campaign Info */}
            <div className="campaign-info-grid">
              <div className="campaign-info-card">
                <div className="info-card-icon">📅</div>
                <div className="info-card-content">
                  <div className="info-card-label">Start Date</div>
                  <div className="info-card-value">
                    {new Date(campaign.startDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>

              <div className="campaign-info-card">
                <div className="info-card-icon">⏰</div>
                <div className="info-card-content">
                  <div className="info-card-label">End Date</div>
                  <div className="info-card-value">
                    {new Date(campaign.endDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>

              <div className="campaign-info-card">
                <div className="info-card-icon">⏳</div>
                <div className="info-card-content">
                  <div className="info-card-label">Duration</div>
                  <div className="info-card-value">
                    {Math.ceil(
                      (new Date(campaign.endDate) - new Date(campaign.startDate)) / 
                      (1000 * 60 * 60 * 24)
                    )} days
                  </div>
                </div>
              </div>

              <div className="campaign-info-card">
                <div className="info-card-icon">🏷️</div>
                <div className="info-card-content">
                  <div className="info-card-label">Category</div>
                  <div className="info-card-value">{campaign.category}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="campaign-sidebar">
            <div className="campaign-sidebar-card">
              <h3 className="sidebar-card-title">Campaign Summary</h3>
              <div className="sidebar-summary-item">
                <span className="summary-label">Status:</span>
                <span className={`summary-value status-${status.class}`}>
                  {status.text}
                </span>
              </div>
              <div className="sidebar-summary-item">
                <span className="summary-label">Featured:</span>
                <span className="summary-value">
                  {campaign.featured ? 'Yes ⭐' : 'No'}
                </span>
              </div>
              <div className="sidebar-summary-item">
                <span className="summary-label">Active:</span>
                <span className="summary-value">
                  {campaign.isActive ? 'Yes ✅' : 'No ❌'}
                </span>
              </div>
            </div>

            <div className="campaign-sidebar-card">
              <h3 className="sidebar-card-title">Quick Actions</h3>
              <Link to="/campaigns" className="sidebar-action-btn">
                ← All Campaigns
              </Link>
              <Link to="/tokens" className="sidebar-action-btn">
                Browse Tokens
              </Link>
              <Link to="/create" className="sidebar-action-btn">
                Create Token
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetail;

