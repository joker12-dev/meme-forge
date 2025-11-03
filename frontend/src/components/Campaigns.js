import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import useAutoRefresh from '../hooks/useAutoRefresh';
import useVisibilityChange from '../hooks/useVisibilityChange';
import './Campaigns.css';

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, ended
  const [sortBy, setSortBy] = useState('latest'); // latest, views, clicks

  const fetchCampaigns = useCallback(async () => {
    try {
      const backendURL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(backendURL + '/api/campaigns');
      
      const data = await response.json();
      
      if (data.success && data.campaigns) {
        setCampaigns(data.campaigns);
      } else if (Array.isArray(data)) {
        setCampaigns(data);
      } else {
        setCampaigns([]);
      }
    } catch (error) {
      console.error('Campaign fetch error:', error);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh: Poll every 10 seconds
  useAutoRefresh(fetchCampaigns, 10000);
  
  // Auto-refresh: When tab becomes visible
  useVisibilityChange(fetchCampaigns);

  const getFilteredAndSortedCampaigns = () => {
    let filtered = [...campaigns];

    // Filter
    if (filter === 'active') {
      filtered = filtered.filter(c => new Date(c.endDate) > new Date());
    } else if (filter === 'ended') {
      filtered = filtered.filter(c => new Date(c.endDate) <= new Date());
    }

    // Sort
    switch (sortBy) {
      case 'views':
        filtered.sort((a, b) => b.views - a.views);
        break;
      case 'clicks':
        filtered.sort((a, b) => b.clicks - a.clicks);
        break;
      case 'latest':
      default:
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    return filtered;
  };

  const getCampaignStatus = (campaign) => {
    const now = new Date();
    const endDate = new Date(campaign.endDate);
    
    if (endDate < now) {
      return { text: 'Ended', class: 'ended' };
    }
    
    const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 3) {
      return { text: `${daysLeft} days left`, class: 'ending-soon' };
    }
    
    return { text: 'Active', class: 'active' };
  };

  const displayedCampaigns = getFilteredAndSortedCampaigns();

  if (loading) {
    return (
      <div className="campaigns-page">
        <div className="campaigns-loading">
          <div className="loading-spinner"></div>
          <p>Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="campaigns-page">
      {/* Hero Section */}
      <div className="campaigns-hero">
        <div className="campaigns-hero-content">
          <h1 className="campaigns-hero-title">
            Marketing Campaigns
          </h1>
          <p className="campaigns-hero-subtitle">
            Discover active token marketing campaigns and promotional offers
          </p>
          <div className="campaigns-stats">
            <div className="campaigns-stat-box">
              <div className="stat-value">{campaigns.length}</div>
              <div className="stat-label">Total Campaigns</div>
            </div>
            <div className="campaigns-stat-box">
              <div className="stat-value">
                {campaigns.filter(c => new Date(c.endDate) > new Date()).length}
              </div>
              <div className="stat-label">Active Now</div>
            </div>
            <div className="campaigns-stat-box">
              <div className="stat-value">
                {campaigns.reduce((sum, c) => sum + c.views, 0).toLocaleString()}
              </div>
              <div className="stat-label">Total Views</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Sorting */}
      <div className="campaigns-controls">
        <div className="campaigns-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Campaigns
          </button>
          <button 
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button 
            className={`filter-btn ${filter === 'ended' ? 'active' : ''}`}
            onClick={() => setFilter('ended')}
          >
            Ended
          </button>
        </div>
        
        <div className="campaigns-sort">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="latest">Latest</option>
            <option value="views">Most Views</option>
            <option value="clicks">Most Clicks</option>
          </select>
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="campaigns-grid">
        {displayedCampaigns.length === 0 ? (
          <div className="no-campaigns">
            <div className="no-campaigns-icon">📢</div>
            <h3>No campaigns found</h3>
            <p>There are no {filter !== 'all' ? filter : ''} campaigns at the moment.</p>
          </div>
        ) : (
          displayedCampaigns.map(campaign => {
            const status = getCampaignStatus(campaign);
            
            return (
              <Link 
                to={`/campaign/${campaign.id}`} 
                key={campaign.id}
                className="campaign-card-link"
              >
                <div className="campaign-card-full">
                  {campaign.featured && (
                    <div className="campaign-featured-badge">⭐ Featured</div>
                  )}
                  
                  <div className={`campaign-status-badge ${status.class}`}>
                    {status.text}
                  </div>

                  <div className="campaign-banner-full">
                    <img src={campaign.bannerUrl} alt={campaign.title} />
                  </div>

                  <div className="campaign-card-body">
                    <div className="campaign-category-badge">
                      {campaign.category}
                    </div>
                    
                    <h3 className="campaign-card-title">{campaign.title}</h3>
                    <p className="campaign-card-description">{campaign.description}</p>
                    
                    <div className="campaign-card-meta">
                      <div className="campaign-meta-item">
                        <span className="meta-icon">👁️</span>
                        <span>{campaign.views.toLocaleString()} views</span>
                      </div>
                      <div className="campaign-meta-item">
                        <span className="meta-icon">🔗</span>
                        <span>{campaign.clicks.toLocaleString()} clicks</span>
                      </div>
                      <div className="campaign-meta-item">
                        <span className="meta-icon">📅</span>
                        <span>
                          Ends {new Date(campaign.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <button className="campaign-view-btn">
                      View Campaign →
                    </button>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Campaigns;

