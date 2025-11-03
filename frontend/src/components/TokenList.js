import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchMultipleTokensData, mergeDexDataWithToken } from '../utils/dexscreener';
import { FaGlobe, FaTelegramPlane, FaTwitter, FaStar, FaChartLine, FaDollarSign, FaChartBar, FaPlus, FaArrowUp, FaArrowDown, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { FiSearch } from 'react-icons/fi';
import { BiUserCircle } from 'react-icons/bi';
import HypeSlider from './HypeSlider';
import CampaignSlider from './CampaignSlider';
import useAutoRefresh from '../hooks/useAutoRefresh';
import useVisibilityChange from '../hooks/useVisibilityChange';
import './TokenList.css';

const TokenList = () => {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [tokensPerPage] = useState(20);
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMarketCapMin, setFilterMarketCapMin] = useState(0);
  const [filterMarketCapMax, setFilterMarketCapMax] = useState(Infinity);
  const [filterLiquidityMin, setFilterLiquidityMin] = useState(0);
  const [filterVolumeMin, setFilterVolumeMin] = useState(0);

  // Sort state
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');

  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveTransactions, setLiveTransactions] = useState([]);
  const [showFeatured, setShowFeatured] = useState(false);
  const [favorites, setFavorites] = useState(new Set());

  // Enhanced mock data (fallback)
  const getEnhancedMockTokens = () => {
    return [
      {
        id: 1,
        name: 'BSC Doge',
        symbol: 'BDOGE',
        address: '0x742d35Cc6634C0532925a3b8D4B9991a1f4D8E5F',
        creator: '0x8932d5b5e1b6f5e8a7a3c8d4e5f6a7b8c9d0e1f2',
        totalSupply: '1000000000',
        description: 'The first Doge token on BSC Network with amazing community.',
        createdAt: new Date().toISOString(),
        marketCap: 2500000,
        liquidity: 500000,
        holders: 1250,
        price: 0.0000025,
        priceChange24h: 15.5,
        volume24h: 125000,
        liveOnDex: true,
        featured: true,
        tags: ['meme'],
        website: 'https://bscdoge.com',
        telegram: 'https://t.me/bscdoge',
        twitter: 'https://twitter.com/bscdoge'
      },
      {
        id: 2,
        name: 'Moon Token',
        symbol: 'MOON',
        address: '0x842d35Cc6634C0532925a3b8D4B9991a1f4D8E5F',
        creator: '0x9932d5b5e1b6f5e8a7a3c8d4e5f6a7b8c9d0e1f2',
        totalSupply: '500000000',
        description: 'To the moon and beyond! Community driven moon mission.',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        marketCap: 1500000,
        liquidity: 350000,
        holders: 850,
        price: 0.000003,
        priceChange24h: -3.2,
        volume24h: 85000,
        liveOnDex: true,
        tags: ['defi'],
        website: 'https://moontoken.io',
        telegram: 'https://t.me/moontoken',
        twitter: 'https://twitter.com/moontoken'
      },
      {
        id: 3,
        name: 'BSC Diamond',
        symbol: 'DIAMOND',
        address: '0x942d35Cc6634C0532925a3b8D4B9991a1f4D8E5F',
        creator: '0x8932d5b5e1b6f5e8a7a3c8d4e5f6a7b8c9d0e1f2',
        totalSupply: '10000000',
        description: 'Rare and valuable like diamond. Limited supply token.',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        marketCap: 750000,
        liquidity: 200000,
        holders: 420,
        price: 0.075,
        priceChange24h: 8.7,
        volume24h: 45000,
        liveOnDex: false,
        featured: true,
        tags: ['nft'],
        website: 'https://bscdiamond.com',
        twitter: 'https://twitter.com/bscdiamond'
      }
    ];
  };

  // Simulated live transactions ticker
  useEffect(() => {
    // Polling ile her 2 saniyede bir canlı işlemleri backend'den çek
    let intervalId;
    const fetchLiveTransactions = () => {
      const backendURL = process.env.REACT_APP_BACKEND_URL || '${getBackendURL()}';
      fetch(`${backendURL}/api/trades/recent/BSC?limit=30`)
        .then(res => res.json())
        .then(data => {
          console.log('Backend trade response:', data);
          if (data && data.success && Array.isArray(data.trades)) {
            console.log('Backend trades count:', data.trades.length);
            console.log('Backend trades preview:', data.trades.slice(0, 10));
          }
          if (data && data.success && Array.isArray(data.trades)) {
            data.trades.forEach(trade => {
              const type = trade.type || (trade.dataValues && trade.dataValues.type) || '';
              const action = type.toUpperCase() === 'SELL' ? 'Sold' : (type.toUpperCase() === 'BUY' ? 'Bought' : 'Unknown');
              console.log('Trade mapping:', { type, action, trade });
            });
          }
          if (data && data.success && Array.isArray(data.trades)) {
            const formatAddress = (address) => {
              if (!address || typeof address !== 'string') return 'unknown';
              return address.slice(0, 6) + '...' + address.slice(-4);
            };
            // Hem BUY hem SELL işlemlerini göstermek için limit artırıldı
            const txs = data.trades.map(trade => {
              const type = trade.type || (trade.dataValues && trade.dataValues.type) || '';
              return {
                user: formatAddress(trade.user || trade.userAddress || (trade.dataValues && trade.dataValues.user) || 'unknown'),
                action: type.toUpperCase() === 'SELL' ? 'Sold' : (type.toUpperCase() === 'BUY' ? 'Bought' : 'Unknown'),
                amount: (trade.amount || (trade.dataValues && trade.dataValues.amount)) ? `${trade.amount || (trade.dataValues && trade.dataValues.amount)} ${trade.tokenSymbol || (trade.dataValues && trade.dataValues.tokenSymbol) || ''}` : '',
                token: trade.tokenSymbol || (trade.dataValues && trade.dataValues.tokenSymbol) || trade.token || ''
              };
            });
            // Ticker'da işlemler database sırasına göre (geliş sırası) gösterilecek
            setLiveTransactions(txs);
          } else {
            setLiveTransactions([]);
          }
        })
        .catch(() => {
          setLiveTransactions([]);
        });
    };
    fetchLiveTransactions();
    intervalId = setInterval(fetchLiveTransactions, 2000);
    return () => clearInterval(intervalId);
  }, []);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = JSON.parse(localStorage.getItem('tokenFavorites') || '[]');
    setFavorites(new Set(savedFavorites));
  }, []);

  const fetchTokens = useCallback(async () => {
    try {
      setLoading(true);
      const backendURL = process.env.REACT_APP_BACKEND_URL || '${getBackendURL()}';
      
      // Build query params
      const params = new URLSearchParams({
        page: currentPage,
        limit: tokensPerPage,
        search: searchTerm,
        sortBy: sortBy === 'trending' ? 'createdAt' : sortBy === 'volume' ? 'totalVolume' : sortBy === 'marketcap' ? 'marketCap' : 'createdAt',
        sortOrder: sortOrder
      });

      // Add filters
      if (filterMarketCapMin > 0) {
        params.append('minMarketCap', filterMarketCapMin);
      }
      if (filterMarketCapMax !== Infinity) {
        params.append('maxMarketCap', filterMarketCapMax);
      }
      if (filterLiquidityMin > 0) {
        params.append('minLiquidity', filterLiquidityMin);
      }
      if (filterVolumeMin > 0) {
        params.append('minVolume', filterVolumeMin);
      }

      const response = await fetch(`${backendURL}/api/tokens?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setTokens(data.data);
        setTotalTokens(data.pagination.total);
        setTotalPages(data.pagination.pages);
      } else {
        setTokens(getEnhancedMockTokens());
        setTotalTokens(3);
        setTotalPages(1);
      }
      
    } catch (error) {
      console.error('Token fetch error:', error);
      setTokens(getEnhancedMockTokens());
      setTotalTokens(3);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, tokensPerPage, searchTerm, sortBy, sortOrder, filterMarketCapMin, filterMarketCapMax, filterLiquidityMin, filterVolumeMin]);

  // Fetch tokens when dependencies change
  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  // Auto-refresh: When tab becomes visible
  useVisibilityChange(fetchTokens);

  // Filter and sort tokens with useMemo
  const filteredTokens = useMemo(() => {
    let filtered = tokens.filter(token => {
      if (!token || typeof token !== 'object') return false;
      
      const matchesSearch = token.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          token.symbol?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFeatured = !showFeatured || token.featured;
      return matchesSearch && matchesFeatured;
    });

    filtered.sort((a, b) => {
      switch(sortBy) {
        case 'trending':
          return (b.priceChange24h || 0) - (a.priceChange24h || 0);
        case 'volume':
          return (b.volume24h || 0) - (a.volume24h || 0);
        case 'marketcap':
          return (b.marketCap || 0) - (a.marketCap || 0);
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        default:
          return 0;
      }
    });

    return filtered;
  }, [tokens, searchTerm, sortBy, showFeatured]);

  const formatNumber = (num) => {
    const n = Number(num);
    if (isNaN(n) || !n) return '0';
    if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(2) + 'K';
    return n.toFixed(2);
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  return (
    <div style={styles.container}>
      {/* Live Transaction Ticker */}
      <div style={styles.ticker}>
        <div style={styles.tickerContent}>
          {/* Döngüsel ticker için işlemler array'ini uzatıyoruz */}
          {console.log('Ticker render: liveTransactions.length =', liveTransactions.length)}
          {Array.from({ length: liveTransactions.length * 3 }).map((_, i) => {
            const tx = liveTransactions[i % liveTransactions.length];
            return (
              <div key={i} style={styles.tickerItem}>
                <BiUserCircle style={styles.tickerAvatarIcon} />
                <span style={styles.tickerUser}>{tx.user}</span>
                <span style={{
                  ...styles.tickerAction,
                  color: tx.action === 'Bought' ? '#00FFA3' : '#FF4D4D'
                }}>
                  {tx.action} ({tx.action === 'Bought' ? 'BUY' : (tx.action === 'Sold' ? 'SELL' : 'UNKNOWN')})
                </span>
                <span style={styles.tickerAmount}>{tx.amount}</span>
                <span style={styles.tickerToken}>{tx.token}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hero Section - Create Token + Hype Slider (Top Row) */}
      <div style={styles.heroTopRow}>
        {/* Left - Create Token Card */}
        <Link to="/create" style={styles.createTokenCard}>
          <h2 style={styles.createTokenTitle}>Create Your Token</h2>
          <h4 style={styles.createTokenSubtitle}>Get started with your own token</h4>
          <div style={styles.createTokenButton}>
            <span>Launch Token</span>
            <span className="create-token-arrow" style={styles.createArrow}>→</span>
          </div>
        </Link>

        {/* Right - Hype Slider */}
        <div style={styles.hypeSliderWrapper}>
          <HypeSlider />
        </div>
      </div>

      {/* Campaign Slider - Full Width Thin Row */}
      <div style={styles.campaignSliderSection}>
        <CampaignSlider />
      </div>

      {/* Main Content */}
      <div className="token-list-container">
        {/* Header */}
        <div className="token-list-header">
          <h1>🚀 Explore Tokens</h1>
          <p>Discover trending meme tokens on BSC Network</p>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search tokens by name or symbol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="sort-buttons">
            <button
              className={`sort-btn ${sortBy === 'trending' ? 'active' : ''}`}
              onClick={() => setSortBy('trending')}
            >
              🔥 Trending
            </button>
            <button
              className={`sort-btn ${sortBy === 'volume' ? 'active' : ''}`}
              onClick={() => setSortBy('volume')}
            >
              💰 Volume
            </button>
            <button
              className={`sort-btn ${sortBy === 'marketcap' ? 'active' : ''}`}
              onClick={() => setSortBy('marketcap')}
            >
              📊 Market Cap
            </button>
            <button
              className={`sort-btn ${sortBy === 'newest' ? 'active' : ''}`}
              onClick={() => setSortBy('newest')}
            >
              ✨ Newest
            </button>
            <button
              className={`sort-btn ${showFeatured ? 'active' : ''}`}
              onClick={() => setShowFeatured(!showFeatured)}
            >
              ⭐ Featured
            </button>
          </div>
        </div>

        {/* Token Grid */}
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <div className="token-grid">
            {filteredTokens.map((token) => (
              <div
                key={token.address}
                className={`token-card ${token.featured ? 'featured' : ''}`}
                onClick={() => window.location.href = `/token/${token.address}`}
              >
                {/* Badges */}
                <div className="token-badges">
                  {token.featured && <span className="badge featured">⭐ Featured</span>}
                  {token.liveOnDex && <span className="badge live">🔴 Live</span>}
                </div>

                {/* Header */}
                <div className="token-card-header">
                  <div className="token-logo">
                    {token.logoURL ? (
                      <img 
                        src={token.logoURL.startsWith('http') ? token.logoURL : `${process.env.REACT_APP_BACKEND_URL || '${getBackendURL()}'}${token.logoURL}`}
                        alt={token.name}
                        style={{width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover'}}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.textContent = token.symbol?.[0] || '?';
                        }}
                      />
                    ) : (
                      token.symbol?.[0] || '?'
                    )}
                  </div>
                  
                  <div className="token-info">
                    <div className="token-name">{token.name || 'Unknown'}</div>
                    <div className="token-symbol">{token.symbol || 'N/A'}</div>
                  </div>
                  
                  <button 
                    className={`token-favorite ${favorites.has(token.address) ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      const newFavorites = new Set(favorites);
                      if (newFavorites.has(token.address)) {
                        newFavorites.delete(token.address);
                      } else {
                        newFavorites.add(token.address);
                      }
                      setFavorites(newFavorites);
                      localStorage.setItem('tokenFavorites', JSON.stringify([...newFavorites]));
                    }}
                  >
                    <FaStar />
                  </button>
                </div>

                {/* Price */}
                <div className="token-price-section">
                  <div className="token-price">
                    ${token.price ? Number(token.price).toFixed(8) : '0.00'}
                  </div>
                  {token.priceChange24h !== undefined && (
                    <div className={`token-change ${Number(token.priceChange24h || 0) >= 0 ? 'positive' : 'negative'}`}>
                      {Number(token.priceChange24h || 0) >= 0 ? <FaArrowUp /> : <FaArrowDown />}
                      {Math.abs(Number(token.priceChange24h || 0)).toFixed(2)}%
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="token-stats">
                  <div className="stat-item">
                    <div className="stat-label">Market Cap</div>
                    <div className="stat-value">${formatNumber(token.marketCap || token.fdv)}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Volume 24h</div>
                    <div className="stat-value">${formatNumber(token.volume24h)}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Liquidity</div>
                    <div className="stat-value">${formatNumber(token.liquidity)}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Holders</div>
                    <div className="stat-value">{formatNumber(token.holders || 0)}</div>
                  </div>
                </div>

                {/* Footer */}
                <div className="token-card-footer">
                  <div className="token-social-links" onClick={(e) => e.stopPropagation()}>
                    {token.website && (
                      <a
                        href={token.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-icon"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FaGlobe />
                      </a>
                    )}
                    {token.telegram && (
                      <a
                        href={token.telegram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-icon"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FaTelegramPlane />
                      </a>
                    )}
                    {token.twitter && (
                      <a
                        href={token.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-icon"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FaTwitter />
                      </a>
                    )}
                  </div>
                  
                  <button className="view-token-btn">
                    View Token
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredTokens.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FiSearch />
            </div>
            <h3>No tokens found</h3>
            <p>Try adjusting your filters or search term</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .token-card {
          transition: all 0.3s ease;
          text-decoration: none;
        }
        
        .token-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 40px rgba(240, 185, 11, 0.3);
        }
        
        a[style*="socialButton"]:hover,
        .social-button:hover {
          background: rgba(240, 185, 11, 0.2) !important;
          border-color: rgba(240, 185, 11, 0.5) !important;
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
    color: '#FFFFFF',
    fontFamily: "'Inter', -apple-system, sans-serif",
  },
  
  // Live Transaction Ticker
  ticker: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderBottom: 'none',
    overflow: 'hidden',
    padding: '12px 0',
  },
  tickerContent: {
    display: 'flex',
    animation: 'scroll 30s linear infinite',
    gap: '3rem',
  },
  tickerItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    whiteSpace: 'nowrap',
    fontSize: '0.9rem',
  },
  tickerAvatarIcon: {
    fontSize: '1.3rem',
    color: '#94A3B8',
  },
  tickerUser: {
    color: '#94A3B8',
    fontFamily: 'monospace',
  },
  tickerAction: {
    fontWeight: '600',
  },
  tickerAmount: {
    color: '#F0B90B',
    fontWeight: '600',
  },
  tickerToken: {
    color: '#CBD5E1',
  },

  // Hero Top Row - Create Token + Hype Slider (Same Height)
  heroTopRow: {
    maxWidth: '1400px',
    margin: '30px auto 0',
    padding: '0 1.5rem',
    display: 'grid',
    gridTemplateColumns: '400px 1fr',
    gap: '24px',
    alignItems: 'stretch',
  },

  // Create Token Card
  createTokenCard: {
    background: 'linear-gradient(145deg, rgba(240, 185, 11, 0.05) 0%, rgba(240, 185, 11, 0.02) 100%)',
    border: '2px solid rgba(240, 185, 11, 0.1)',
    borderRadius: '20px',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    minHeight: '180px',
  },
  createTokenSubtitle: {
    fontSize: '16px',
    color: 'rgba(255, 255, 255, 0.7)',
    margin: '0 0 24px 0',
  },

  createTokenIcon: {
    width: '40px',
    height: '40px',
    background: 'linear-gradient(135deg, #F0B90B, #FFC940)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#000',
    marginBottom: '20px',
    boxShadow: '0 8px 24px rgba(240, 185, 11, 0.3)',
  },

  createTokenTitle: {
    fontSize: '26px',
    fontWeight: '800',
    color: '#F0B90B',
    margin: '0 0 12px 0',
    textShadow: '0 0 20px rgba(240, 185, 11, 0.3)',
  },

  createTokenDesc: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: '1.6',
    marginBottom: '20px',
  },

  createTokenFeatures: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '24px',
  },

  createFeature: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.8)',
    paddingLeft: '8px',
  },

  createTokenButton: {
    background: 'linear-gradient(135deg, #F0B90B, #FFC940)',
    color: '#000',
    padding: '14px 24px',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 4px 16px rgba(240, 185, 11, 0.3)',
    transition: 'all 0.3s ease',
  },

  createArrow: {
    fontSize: '20px',
    transition: 'transform 0.3s ease',
  },

  // Hype Slider Wrapper (Same height as Create Token)
  hypeSliderWrapper: {
    minHeight: '180px',
    display: 'flex',
    alignItems: 'stretch',
  },

  // Campaign Slider - Full Width Thin Row
  campaignSliderSection: {
    maxWidth: '1400px',
    margin: '20px auto 30px',
    padding: '0 1.5rem',
  },
  
  // Main Content
  content: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '1.5rem 1.5rem',
  },
  
  // Header & Filters
  header: {
    marginBottom: '1.5rem',
  },
  filterSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1rem',
    flexWrap: 'wrap',
  },
  filterButton: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#CBD5E1',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  filterButtonActive: {
    background: 'linear-gradient(135deg, #F0B90B, #F8D33A)',
    color: '#000',
    border: '1px solid #F0B90B',
    boxShadow: '0 2px 8px rgba(240, 185, 11, 0.3)',
  },
  
  // Controls
  controls: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  searchBar: {
    flex: 1,
    minWidth: '220px',
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '0.5rem 0.875rem',
    transition: 'all 0.2s',
  },
  searchIconSvg: {
    marginRight: '0.625rem',
    fontSize: '1rem',
    color: '#94A3B8',
  },
  searchInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    color: '#FFFFFF',
    fontSize: '0.875rem',
    outline: 'none',
  },
  sortSelect: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#FFFFFF',
    padding: '0.5rem 0.875rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.2s',
  },
  
  // Token Grid
  tokenGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1rem',
  },
  
  // Token Card
  tokenCard: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '1rem',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.875rem',
    transition: 'all 0.2s ease',
  },
  
  // Card Header
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
  },
  tokenLogoContainer: {
    flexShrink: 0,
  },
  tokenLogo: {
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    objectFit: 'cover',
  },
  tokenLogoPlaceholder: {
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #F0B90B, #F8D33A)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#000',
  },
  tokenInfo: {
    flex: 1,
    minWidth: 0,
  },
  tokenNameRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
    marginBottom: '0.25rem',
  },
  tokenName: {
    fontSize: '1.05rem',
    fontWeight: '700',
    margin: 0,
    color: '#FFFFFF',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  priceChange: {
    padding: '0.2rem 0.5rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '700',
    flexShrink: 0,
  },
  tokenSymbol: {
    color: '#94A3B8',
    fontSize: '0.85rem',
    fontWeight: '500',
  },
  
  // Card Body
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.625rem',
    paddingTop: '0.75rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
  },
  stat: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: '0.8rem',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: '0.875rem',
    fontWeight: '600',
  },
  
  // Card Footer
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '0.75rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
  },
  creatorInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  },
  creatorLabel: {
    color: '#94A3B8',
    fontSize: '0.7rem',
  },
  creatorAddress: {
    color: '#CBD5E1',
    fontSize: '0.8rem',
    fontFamily: 'monospace',
    fontWeight: '500',
  },
  liveBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    background: 'rgba(0, 255, 163, 0.1)',
    color: '#00FFA3',
    padding: '0.3rem 0.6rem',
    borderRadius: '6px',
    fontSize: '0.7rem',
    fontWeight: '700',
  },
  liveDot: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    background: '#00FFA3',
    animation: 'pulse 2s infinite',
  },
  
  // Description
  description: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'flex-start',
    fontSize: '0.8rem',
    color: '#94A3B8',
    lineHeight: '1.5',
  },
  descriptionTag: {
    background: 'rgba(240, 185, 11, 0.15)',
    color: '#F0B90B',
    padding: '0.2rem 0.45rem',
    borderRadius: '5px',
    fontSize: '0.7rem',
    fontWeight: '600',
    flexShrink: 0,
  },
  descriptionText: {
    flex: 1,
  },
  
  // Social Links
  socialLinks: {
    display: 'flex',
    gap: '0.4rem',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: '0.625rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.04)',
  },
  socialButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '26px',
    height: '26px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '6px',
    fontSize: '0.8rem',
    color: '#CBD5E1',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textDecoration: 'none',
  },
  
  // Loading State
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
    gap: '1rem',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(240, 185, 11, 0.2)',
    borderTop: '3px solid #F0B90B',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: '0.875rem',
  },
  
  // Empty State
  emptyState: {
    textAlign: 'center',
    padding: '3rem 2rem',
  },
  emptyIconSvg: {
    fontSize: '3rem',
    color: '#94A3B8',
    marginBottom: '1rem',
  },
  emptyTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    margin: '0 0 0.5rem 0',
    color: '#FFFFFF',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: '0.875rem',
  },
};

// Inline CSS for hover effects and responsive
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  .token-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(240, 185, 11, 0.15);
    border-color: rgba(240, 185, 11, 0.2);
  }
  
  input[style*="searchInput"]:focus,
  select[style*="sortSelect"]:focus,
  div[style*="searchBar"]:focus-within {
    border-color: rgba(240, 185, 11, 0.3) !important;
  }
  
  button[style*="filterButton"]:hover:not([style*="filterButtonActive"]) {
    background: rgba(255, 255, 255, 0.08) !important;
    border-color: rgba(255, 255, 255, 0.15) !important;
  }
  
  a[style*="socialButton"]:hover {
    background: rgba(240, 185, 11, 0.15) !important;
    border-color: rgba(240, 185, 11, 0.3) !important;
    color: #F0B90B !important;
  }
  
  a[style*="createTokenCard"]:hover {
    transform: translateY(-4px) !important;
    border-color: rgba(240, 185, 11, 0.6) !important;
    box-shadow: 0 12px 40px rgba(240, 185, 11, 0.3) !important;
  }
  
  .create-token-arrow {
    transition: transform 0.3s ease;
  }
  
  a[style*="createTokenCard"]:hover .create-token-arrow {
    transform: translateX(6px);
  }
  
  @media (max-width: 968px) {
    div[style*="heroSection"] {
      grid-template-columns: 1fr !important;
    }
    
    div[style*="rightSlidersWrapper"] {
      width: 100%;
    }
    
    a[style*="createTokenCard"] {
      min-height: 280px;
    }
  }
  
  @media (max-width: 768px) {
    div[style*="heroSection"] {
      padding: 0 1rem !important;
      gap: 20px !important;
      margin: 20px auto !important;
    }
    
    div[style*="rightSlidersWrapper"] {
      gap: 16px !important;
    }
    
    a[style*="createTokenCard"] {
      padding: 24px !important;
    }
  }
  
  @media (max-width: 480px) {
    a[style*="createTokenCard"] {
      padding: 20px !important;
    }
    
    div[style*="createTokenIcon"] {
      width: 64px !important;
      height: 64px !important;
    }
    
    h2[style*="createTokenTitle"] {
      font-size: 22px !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default TokenList;

