import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaGlobe, FaTelegramPlane, FaTwitter, FaStar, FaChartLine, FaDollarSign, FaFire, FaEye, FaUsers, FaArrowUp, FaArrowDown, FaSearch, FaTrendingUp, FaFilter } from 'react-icons/fa';
import HypeSlider from './HypeSlider';
import CampaignSlider from './CampaignSlider';
import useAutoRefresh from '../hooks/useAutoRefresh';
import './TokenListPro.css';

const TokenListPro = () => {
  // State Management
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('marketCap');
  const [filterMarketCapMin, setFilterMarketCapMin] = useState(0);
  const [filterMarketCapMax, setFilterMarketCapMax] = useState(Infinity);
  const [filterLiquidityMin, setFilterLiquidityMin] = useState(0);
  const [favorites, setFavorites] = useState(new Set());
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all'); // all, trending, volume, new

  // Enhanced Mock Data (DEX-like data)
  const getEnhancedTokens = () => [
    {
      id: 1,
      name: 'BSC Doge',
      symbol: 'BDOGE',
      address: '0x742d35Cc6634C0532925a3b8D4B9991a1f4D8E5F',
      logo: 'https://via.placeholder.com/100?text=BDOGE',
      creator: '0x8932d5b5e1b6f5e8a7a3c8d4e5f6a7b8c9d0e1f2',
      price: 0.0000025,
      priceChange24h: 15.5,
      marketCap: 2500000,
      marketCapRank: 1,
      volume24h: 125000,
      volumeChange24h: 8.2,
      liquidity: 500000,
      liquidityChange24h: 2.1,
      holders: 1250,
      holdersChange24h: 45,
      totalSupply: '1000000000',
      circulatingSupply: '800000000',
      fdv: 2500000,
      ath: 0.00001,
      atl: 0.000001,
      allTimeChangePercent: 150,
      sentiment: 'bullish', // bullish, neutral, bearish
      riskScore: 'low', // low, medium, high
      website: 'https://bscdoge.com',
      telegram: 'https://t.me/bscdoge',
      twitter: 'https://twitter.com/bscdoge',
      discord: 'https://discord.gg/bscdoge',
      description: 'The original Doge token on BSC Network with the strongest community. Built on trust and memes.',
      tags: ['meme', 'trending', 'community-driven'],
      featured: true,
      liveOnDex: true,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      chartData: [0.000001, 0.0000015, 0.000002, 0.0000018, 0.000002, 0.0000025], // 6 points
    },
    {
      id: 2,
      name: 'Moon Token',
      symbol: 'MOON',
      address: '0x842d35Cc6634C0532925a3b8D4B9991a1f4D8E5F',
      logo: 'https://via.placeholder.com/100?text=MOON',
      creator: '0x9932d5b5e1b6f5e8a7a3c8d4e5f6a7b8c9d0e1f2',
      price: 0.000003,
      priceChange24h: -3.2,
      marketCap: 1500000,
      marketCapRank: 2,
      volume24h: 85000,
      volumeChange24h: -5.1,
      liquidity: 350000,
      liquidityChange24h: 1.5,
      holders: 850,
      holdersChange24h: -12,
      totalSupply: '500000000',
      circulatingSupply: '450000000',
      fdv: 1500000,
      ath: 0.000005,
      atl: 0.0000005,
      allTimeChangePercent: 500,
      sentiment: 'neutral',
      riskScore: 'medium',
      website: 'https://moontoken.io',
      telegram: 'https://t.me/moontoken',
      twitter: 'https://twitter.com/moontoken',
      description: 'To the moon and beyond! Community-driven moon mission with sustainable tokenomics.',
      tags: ['defi', 'community', 'sustainable'],
      liveOnDex: true,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      chartData: [0.000002, 0.0000028, 0.000003, 0.0000032, 0.000003, 0.000003],
    },
    {
      id: 3,
      name: 'BSC Diamond',
      symbol: 'DIAMOND',
      address: '0x942d35Cc6634C0532925a3b8D4B9991a1f4D8E5F',
      logo: 'https://via.placeholder.com/100?text=DIAMOND',
      creator: '0x8932d5b5e1b6f5e8a7a3c8d4e5f6a7b8c9d0e1f2',
      price: 0.075,
      priceChange24h: 8.7,
      marketCap: 750000,
      marketCapRank: 3,
      volume24h: 45000,
      volumeChange24h: 12.3,
      liquidity: 200000,
      liquidityChange24h: 0.8,
      holders: 420,
      holdersChange24h: 25,
      totalSupply: '10000000',
      circulatingSupply: '10000000',
      fdv: 750000,
      ath: 0.1,
      atl: 0.01,
      allTimeChangePercent: 650,
      sentiment: 'bullish',
      riskScore: 'high',
      website: 'https://bscdiamond.com',
      telegram: 'https://t.me/bscdiamond',
      twitter: 'https://twitter.com/bscdiamond',
      description: 'Rare and valuable like diamond. Limited supply premium token with exclusive perks.',
      tags: ['premium', 'limited-supply', 'exclusive'],
      featured: true,
      liveOnDex: false,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      chartData: [0.05, 0.058, 0.065, 0.07, 0.072, 0.075],
    },
    {
      id: 4,
      name: 'Rocket Finance',
      symbol: 'ROCKET',
      address: '0xa42d35Cc6634C0532925a3b8D4B9991a1f4D8E5F',
      logo: 'https://via.placeholder.com/100?text=ROCKET',
      creator: '0x7932d5b5e1b6f5e8a7a3c8d4e5f6a7b8c9d0e1f2',
      price: 0.00012,
      priceChange24h: 22.5,
      marketCap: 3200000,
      marketCapRank: 1,
      volume24h: 280000,
      volumeChange24h: 45.2,
      liquidity: 680000,
      liquidityChange24h: 5.3,
      holders: 2340,
      holdersChange24h: 178,
      totalSupply: '25000000000',
      circulatingSupply: '26666666667',
      fdv: 3200000,
      ath: 0.00015,
      atl: 0.00001,
      allTimeChangePercent: 1100,
      sentiment: 'bullish',
      riskScore: 'low',
      website: 'https://rocketfinance.io',
      telegram: 'https://t.me/rocketfinance',
      twitter: 'https://twitter.com/rocketfinance',
      description: 'Launch your portfolio to the moon! DeFi protocol with innovative yield farming.',
      tags: ['defi', 'yield-farming', 'trending'],
      liveOnDex: true,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      chartData: [0.00005, 0.00008, 0.0001, 0.00011, 0.00011, 0.00012],
    },
    {
      id: 5,
      name: 'Pixel Art',
      symbol: 'PIXEL',
      address: '0xb42d35Cc6634C0532925a3b8D4B9991a1f4D8E5F',
      logo: 'https://via.placeholder.com/100?text=PIXEL',
      creator: '0x6932d5b5e1b6f5e8a7a3c8d4e5f6a7b8c9d0e1f2',
      price: 0.0085,
      priceChange24h: -1.2,
      marketCap: 425000,
      marketCapRank: 5,
      volume24h: 62000,
      volumeChange24h: 3.8,
      liquidity: 180000,
      liquidityChange24h: -0.5,
      holders: 580,
      holdersChange24h: 18,
      totalSupply: '50000000',
      circulatingSupply: '50000000',
      fdv: 425000,
      ath: 0.012,
      atl: 0.002,
      allTimeChangePercent: 325,
      sentiment: 'neutral',
      riskScore: 'medium',
      website: 'https://pixelart.io',
      telegram: 'https://t.me/pixelart',
      twitter: 'https://twitter.com/pixelart',
      description: 'NFT-backed token for pixel art community. Supporting creators worldwide.',
      tags: ['nft', 'art', 'community'],
      liveOnDex: true,
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      chartData: [0.008, 0.0085, 0.009, 0.0088, 0.0086, 0.0085],
    },
  ];

  // Load tokens
  useEffect(() => {
    const loadTokens = async () => {
      setLoading(true);
      try {
        // Simulating API call
        const mockTokens = getEnhancedTokens();
        setTokens(mockTokens);
        
        // Load favorites from localStorage
        const savedFavorites = localStorage.getItem('tokenFavorites');
        if (savedFavorites) {
          setFavorites(new Set(JSON.parse(savedFavorites)));
        }
      } catch (error) {
        console.error('Error loading tokens:', error);
      }
      setLoading(false);
    };

    loadTokens();
  }, []);

  // Auto-refresh
  useAutoRefresh(() => {
    // Refresh token data every 10 seconds
    console.log('Auto-refreshing token data...');
  }, 10000);

  // Filter & Sort Logic
  const filteredTokens = useMemo(() => {
    let result = [...tokens];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        token =>
          token.name.toLowerCase().includes(search) ||
          token.symbol.toLowerCase().includes(search) ||
          token.address.toLowerCase().includes(search)
      );
    }

    // Market cap filter
    result = result.filter(
      token =>
        token.marketCap >= filterMarketCapMin &&
        token.marketCap <= filterMarketCapMax
    );

    // Liquidity filter
    result = result.filter(token => token.liquidity >= filterLiquidityMin);

    // Category filter
    if (selectedCategory === 'trending') {
      result = result.filter(t => t.priceChange24h > 5);
    } else if (selectedCategory === 'volume') {
      result = result.sort((a, b) => b.volume24h - a.volume24h).slice(0, 5);
    } else if (selectedCategory === 'new') {
      result = result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'marketCap':
          return b.marketCap - a.marketCap;
        case 'volume':
          return b.volume24h - a.volume24h;
        case 'price':
          return b.price - a.price;
        case 'trending':
          return b.priceChange24h - a.priceChange24h;
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        default:
          return 0;
      }
    });

    return result;
  }, [tokens, searchTerm, sortBy, filterMarketCapMin, filterMarketCapMax, filterLiquidityMin, selectedCategory]);

  // Format number
  const formatNumber = (num) => {
    if (!num) return '$0';
    if (num >= 1000000) return '$' + (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return '$' + (num / 1000).toFixed(1) + 'K';
    return '$' + num.toFixed(2);
  };

  // Format percentage
  const formatPercent = (num) => {
    if (!num) return '0%';
    return (num > 0 ? '+' : '') + num.toFixed(2) + '%';
  };

  // Toggle favorite
  const toggleFavorite = (address) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(address)) {
      newFavorites.delete(address);
    } else {
      newFavorites.add(address);
    }
    setFavorites(newFavorites);
    localStorage.setItem('tokenFavorites', JSON.stringify([...newFavorites]));
  };

  // Get sentiment badge
  const getSentimentBadge = (sentiment) => {
    switch (sentiment) {
      case 'bullish':
        return <span className="sentiment bullish">📈 Bullish</span>;
      case 'bearish':
        return <span className="sentiment bearish">📉 Bearish</span>;
      default:
        return <span className="sentiment neutral">➡️ Neutral</span>;
    }
  };

  // Get risk badge
  const getRiskBadge = (risk) => {
    switch (risk) {
      case 'low':
        return <span className="risk-badge low">🟢 Low Risk</span>;
      case 'high':
        return <span className="risk-badge high">🔴 High Risk</span>;
      default:
        return <span className="risk-badge medium">🟡 Medium Risk</span>;
    }
  };

  return (
    <div className="tokenlist-pro">
      {/* Header */}
      <div className="pro-header">
        <div className="header-content">
          <h1>🎯 Advanced Token Discovery</h1>
          <p>Explore, analyze, and invest in the best DeFi tokens on BSC</p>
        </div>

        {/* Search Bar */}
        <div className="search-section">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, symbol or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button 
            className={`filter-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter /> Filters
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="filters-panel">
            <div className="filter-group">
              <label>Market Cap Range</label>
              <div className="filter-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={filterMarketCapMin}
                  onChange={(e) => setFilterMarketCapMin(Number(e.target.value))}
                  className="filter-input"
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filterMarketCapMax === Infinity ? '' : filterMarketCapMax}
                  onChange={(e) => setFilterMarketCapMax(e.target.value ? Number(e.target.value) : Infinity)}
                  className="filter-input"
                />
              </div>
            </div>

            <div className="filter-group">
              <label>Min Liquidity</label>
              <input
                type="number"
                placeholder="Minimum liquidity"
                value={filterLiquidityMin}
                onChange={(e) => setFilterLiquidityMin(Number(e.target.value))}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label>Category</label>
              <div className="category-buttons">
                {['all', 'trending', 'volume', 'new'].map(cat => (
                  <button
                    key={cat}
                    className={`cat-btn ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sort & View Options */}
        <div className="sort-section">
          <div className="sort-buttons">
            {[
              { value: 'marketCap', label: '📊 Market Cap' },
              { value: 'trending', label: '🔥 Trending' },
              { value: 'volume', label: '💰 Volume' },
              { value: 'newest', label: '✨ Newest' },
            ].map(option => (
              <button
                key={option.value}
                className={`sort-btn ${sortBy === option.value ? 'active' : ''}`}
                onClick={() => setSortBy(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hype Section */}
      <div className="hype-section">
        <h2>🎉 Hyped Right Now</h2>
        <HypeSlider />
      </div>

      {/* Campaign Section */}
      <div className="campaign-section">
        <h2>🚀 Active Campaigns</h2>
        <CampaignSlider />
      </div>

      {/* Tokens Grid/List */}
      <div className="tokens-container">
        <div className="container-header">
          <h2>
            {selectedCategory === 'all' 
              ? `📈 All Tokens` 
              : `${selectedCategory === 'trending' ? '🔥 Trending' : selectedCategory === 'volume' ? '💰 Top Volume' : '✨ New'} Tokens`}
          </h2>
          <span className="token-count">{filteredTokens.length} tokens</span>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading tokens...</p>
          </div>
        ) : filteredTokens.length > 0 ? (
          <div className="tokens-grid">
            {filteredTokens.map(token => (
              <div key={token.address} className={`token-card-pro ${token.featured ? 'featured' : ''} ${token.sentiment}`}>
                {/* Card Header with Logo */}
                <div className="card-header-pro">
                  <div className="logo-section">
                    <img 
                      src={token.logo} 
                      alt={token.symbol}
                      className="token-logo-pro"
                      onError={(e) => {
                        e.target.src = `https://via.placeholder.com/80?text=${token.symbol.slice(0, 2)}`;
                      }}
                    />
                    <div className="token-badge">
                      {token.featured && <span className="badge-featured">⭐ Featured</span>}
                      {token.liveOnDex && <span className="badge-live">🟢 Live</span>}
                    </div>
                  </div>

                  <div className="token-header-info">
                    <div className="token-title">
                      <h3>{token.name}</h3>
                      <span className="token-symbol">{token.symbol}</span>
                    </div>
                    <div className="sentiment-risk">
                      {getSentimentBadge(token.sentiment)}
                      {getRiskBadge(token.riskScore)}
                    </div>
                  </div>

                  <button 
                    className={`favorite-btn-pro ${favorites.has(token.address) ? 'active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleFavorite(token.address);
                    }}
                  >
                    <FaStar />
                  </button>
                </div>

                {/* Price Section */}
                <div className="price-section-pro">
                  <div className="price-main">
                    <span className="price">${Number(token.price).toFixed(8)}</span>
                    <span className={`price-change ${token.priceChange24h >= 0 ? 'positive' : 'negative'}`}>
                      {token.priceChange24h >= 0 ? <FaArrowUp /> : <FaArrowDown />}
                      {Math.abs(token.priceChange24h).toFixed(2)}%
                    </span>
                  </div>
                  
                  {/* Sparkline Chart */}
                  <svg className="sparkline" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <polyline
                      points={token.chartData
                        .map((val, i) => {
                          const x = (i / (token.chartData.length - 1)) * 100;
                          const maxVal = Math.max(...token.chartData);
                          const minVal = Math.min(...token.chartData);
                          const range = maxVal - minVal || 1;
                          const y = 30 - ((val - minVal) / range) * 30;
                          return `${x},${y}`;
                        })
                        .join(' ')}
                      fill="none"
                      stroke={token.priceChange24h >= 0 ? '#10b981' : '#ef4444'}
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>

                {/* Stats Grid */}
                <div className="stats-grid-pro">
                  <div className="stat-item-pro">
                    <div className="stat-label-pro">
                      <FaDollarSign className="stat-icon" /> Market Cap
                    </div>
                    <div className="stat-value-pro">{formatNumber(token.marketCap)}</div>
                    <div className={`stat-change ${token.marketCap >= 0 ? 'positive' : 'negative'}`}>
                      Rank #{token.marketCapRank}
                    </div>
                  </div>

                  <div className="stat-item-pro">
                    <div className="stat-label-pro">
                      <FaChartLine className="stat-icon" /> Volume 24h
                    </div>
                    <div className="stat-value-pro">{formatNumber(token.volume24h)}</div>
                    <div className={`stat-change ${token.volumeChange24h >= 0 ? 'positive' : 'negative'}`}>
                      {formatPercent(token.volumeChange24h)}
                    </div>
                  </div>

                  <div className="stat-item-pro">
                    <div className="stat-label-pro">
                      <FaFire className="stat-icon" /> Liquidity
                    </div>
                    <div className="stat-value-pro">{formatNumber(token.liquidity)}</div>
                    <div className={`stat-change ${token.liquidityChange24h >= 0 ? 'positive' : 'negative'}`}>
                      {formatPercent(token.liquidityChange24h)}
                    </div>
                  </div>

                  <div className="stat-item-pro">
                    <div className="stat-label-pro">
                      <FaUsers className="stat-icon" /> Holders
                    </div>
                    <div className="stat-value-pro">{token.holders.toLocaleString()}</div>
                    <div className={`stat-change ${token.holdersChange24h >= 0 ? 'positive' : 'negative'}`}>
                      {token.holdersChange24h >= 0 ? '+' : ''}{token.holdersChange24h} today
                    </div>
                  </div>
                </div>

                {/* ATH/ATL */}
                <div className="performance-section">
                  <div className="perf-item">
                    <span className="perf-label">ATH:</span>
                    <span className="perf-value">${token.ath.toFixed(8)}</span>
                  </div>
                  <div className="perf-item">
                    <span className="perf-label">ATL:</span>
                    <span className="perf-value">${token.atl.toFixed(8)}</span>
                  </div>
                  <div className="perf-item">
                    <span className="perf-label">All-Time:</span>
                    <span className={`perf-value ${token.allTimeChangePercent >= 0 ? 'positive' : 'negative'}`}>
                      {token.allTimeChangePercent >= 0 ? '+' : ''}{token.allTimeChangePercent}%
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="token-description">{token.description}</p>

                {/* Tags */}
                <div className="tags-section">
                  {token.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>

                {/* Social Links */}
                <div className="social-links-pro">
                  {token.website && (
                    <a href={token.website} target="_blank" rel="noopener noreferrer" className="social-link" title="Website">
                      <FaGlobe />
                    </a>
                  )}
                  {token.telegram && (
                    <a href={token.telegram} target="_blank" rel="noopener noreferrer" className="social-link" title="Telegram">
                      <FaTelegramPlane />
                    </a>
                  )}
                  {token.twitter && (
                    <a href={token.twitter} target="_blank" rel="noopener noreferrer" className="social-link" title="Twitter">
                      <FaTwitter />
                    </a>
                  )}
                </div>

                {/* Action Button */}
                <Link 
                  to={`/token/${token.address}`}
                  className="view-details-btn"
                >
                  View Details →
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FaSearch className="empty-icon" />
            <h3>No tokens found</h3>
            <p>Try adjusting your filters or search term</p>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="footer-stats-pro">
        <div className="footer-stat">
          <span className="stat-number">{tokens.length}</span>
          <span className="stat-name">Total Tokens</span>
        </div>
        <div className="footer-stat">
          <span className="stat-number">{formatNumber(tokens.reduce((sum, t) => sum + t.marketCap, 0))}</span>
          <span className="stat-name">Total Market Cap</span>
        </div>
        <div className="footer-stat">
          <span className="stat-number">{formatNumber(tokens.reduce((sum, t) => sum + t.volume24h, 0))}</span>
          <span className="stat-name">24h Volume</span>
        </div>
        <div className="footer-stat">
          <span className="stat-number">{tokens.reduce((sum, t) => sum + t.holders, 0).toLocaleString()}</span>
          <span className="stat-name">Total Holders</span>
        </div>
      </div>
    </div>
  );
};

export default TokenListPro;
