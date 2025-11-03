import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchMultipleTokensData, mergeDexDataWithToken } from '../utils/dexscreener';

const TokenList = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('trending'); // Changed default to trending
  const [filterTier, setFilterTier] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [favorites, setFavorites] = useState(new Set());
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [activeFilters, setActiveFilters] = useState(new Set());
  const [liveTransactions, setLiveTransactions] = useState([]);

  // Enhanced mock data with real metrics (fallback olarak kullanılacak)
  const getEnhancedMockTokens = () => {
    return [
      {
        id: 1,
        name: 'BSC Doge',
        symbol: 'BDOGE',
        address: '0x742d35Cc6634C0532925a3b8D4B9991a1f4D8E5F',
        creator: '0x8932d5b5e1b6f5e8a7a3c8d4e5f6a7b8c9d0e1f2',
        totalSupply: '1000000000',
        description: 'The first Doge token on BSC Network with amazing community and automatic liquidity generation.',
        createdAt: new Date().toISOString(),
        isReal: true,
        website: 'https://bscdoge.com',
        telegram: 'https://t.me/bscdoge',
        twitter: 'https://twitter.com/bscdoge',
        tier: 'premium',
        marketCap: 2500000,
        liquidity: 500000,
        holders: 1250,
        price: 0.0000025,
        priceChange24h: 15.5,
        volume24h: 125000,
        tax: { buy: 8, sell: 10 },
        features: ['auto-liquidity', 'auto-burn', 'marketing-wallet'],
        socialScore: 85
      },
      {
        id: 2,
        name: 'Moon Token',
        symbol: 'MOON',
        address: '0x842d35Cc6634C0532925a3b8D4B9991a1f4D8E5F',
        creator: '0x9932d5b5e1b6f5e8a7a3c8d4e5f6a7b8c9d0e1f2',
        totalSupply: '500000000',
        description: 'To the moon and beyond! Community driven moon mission with reflection rewards for holders.',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        isReal: true,
        website: 'https://moontoken.bsc',
        telegram: 'https://t.me/moontoken',
        twitter: 'https://twitter.com/moontoken',
        tier: 'standard',
        marketCap: 1500000,
        liquidity: 350000,
        holders: 850,
        price: 0.000003,
        priceChange24h: -3.2,
        volume24h: 85000,
        tax: { buy: 5, sell: 7 },
        features: ['reflection', 'marketing-wallet'],
        socialScore: 72
      },
      {
        id: 3,
        name: 'BSC Diamond',
        symbol: 'DIAMOND',
        address: '0x942d35Cc6634C0532925a3b8D4B9991a1f4D8E5F',
        creator: '0x8932d5b5e1b6f5e8a7a3c8d4e5f6a7b8c9d0e1f2',
        totalSupply: '10000000',
        description: 'Rare and valuable like diamond. Limited supply token on BSC with deflationary mechanics.',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        isReal: true,
        website: 'https://bscdiamond.com',
        telegram: 'https://t.me/bscdiamond',
        twitter: 'https://twitter.com/bscdiamond',
        tier: 'premium',
        marketCap: 750000,
        liquidity: 200000,
        holders: 420,
        price: 0.075,
        priceChange24h: 8.7,
        volume24h: 45000,
        tax: { buy: 6, sell: 8 },
        features: ['auto-burn', 'deflationary', 'limited-supply'],
        socialScore: 68
      },
      {
        id: 4,
        name: 'BSC Shiba',
        symbol: 'BSHIBA',
        address: '0xa42d35Cc6634C0532925a3b8D4B9991a1f4D8E5F',
        creator: '0x7932d5b5e1b6f5e8a7a3c8d4e5f6a7b8c9d0e1f2',
        totalSupply: '1000000000000',
        description: 'Shiba Inu on BSC Network. Woof woof! Community token with charity donations.',
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        isReal: true,
        website: 'https://bscshiba.com',
        telegram: 'https://t.me/bscshiba',
        twitter: 'https://twitter.com/bscshiba',
        tier: 'basic',
        marketCap: 500000,
        liquidity: 150000,
        holders: 1200,
        price: 0.0000005,
        priceChange24h: 2.1,
        volume24h: 25000,
        tax: { buy: 3, sell: 5 },
        features: ['charity', 'community-driven'],
        socialScore: 79
      },
      {
        id: 5,
        name: 'Safe BSC',
        symbol: 'SAFEBSC',
        address: '0xb52d35Cc6634C0532925a3b8D4B9991a1f4D8E5F',
        creator: '0x6932d5b5e1b6f5e8a7a3c8d4e5f6a7b8c9d0e1f2',
        totalSupply: '1000000000000',
        description: 'Safe and secure BSC token with verified contract and locked liquidity.',
        createdAt: new Date(Date.now() - 345600000).toISOString(),
        isReal: true,
        website: 'https://safebsc.com',
        telegram: 'https://t.me/safebsc',
        twitter: 'https://twitter.com/safebsc',
        tier: 'standard',
        marketCap: 1800000,
        liquidity: 400000,
        holders: 950,
        price: 0.0000018,
        priceChange24h: -1.5,
        volume24h: 68000,
        tax: { buy: 4, sell: 6 },
        features: ['locked-liquidity', 'verified-contract'],
        socialScore: 81
      }
    ];
  };

  useEffect(() => {
    fetchTokens();
    const savedFavorites = JSON.parse(localStorage.getItem('tokenFavorites') || '[]');
    setFavorites(new Set(savedFavorites));

    // Auto-refresh every 15 seconds
    const refreshInterval = setInterval(() => {
      fetchTokens();
    }, 15000);

    return () => clearInterval(refreshInterval);
  }, []);

  const fetchTokens = async () => {
    try {
      console.log('🔄 Fetching tokens from backend...');
      const response = await fetch(process.env.REACT_APP_BACKEND_URL + '/api/tokens');
      
      if (!response.ok) {
        throw new Error(`API response was not ok: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        console.log(`✅ Loaded ${data.length} tokens from backend`);
        
        // Backend'den gelen verileri formatlayarak kullan
        const formattedTokens = data.map(token => ({
          ...token,
          // PostgreSQL'den gelen alanları doğru formata dönüştür
          address: token.address ? token.address.toLowerCase() : null,
          creator: token.creatorAddress ? token.creatorAddress.toLowerCase() : null,
          marketCap: parseFloat(token.marketCap) || 0,
          liquidity: parseFloat(token.liquidity) || 0,
          holders: parseInt(token.holders) || 0,
          price: parseFloat(token.price) || 0,
          priceChange24h: parseFloat(token.priceChange24h) || 0,
          volume24h: parseFloat(token.volume24h) || 0,
          tax: token.tax ? (typeof token.tax === 'string' ? JSON.parse(token.tax) : token.tax) : { buy: 0, sell: 0 },
          tier: token.tier || 'basic',
          features: token.features ? (typeof token.features === 'string' ? JSON.parse(token.features) : token.features) : [],
          socialScore: parseInt(token.socialScore) || 0,
          createdAt: new Date(token.createdAt).toISOString()
        }));
        
        console.log('📊 Fetching live data from DexScreener...');
        
        // DexScreener'dan canlı verileri çek
        const tokenAddresses = formattedTokens.map(t => t.address).filter(Boolean);
        const dexData = await fetchMultipleTokensData(tokenAddresses);
        
        // DexScreener verileri ile birleştir
        const enhancedTokens = formattedTokens.map(token => {
          const dexInfo = dexData[token.address?.toLowerCase()];
          if (dexInfo) {
            console.log(`✅ Live data found for ${token.symbol}:`, dexInfo);
            return mergeDexDataWithToken(dexInfo, token);
          }
          console.log(`⚠️ No live data for ${token.symbol}, using database values`);
          return token;
        });
        
        setTokens(enhancedTokens);
      } else {
        console.warn('⚠️ Backend returned empty or invalid data, using enhanced mock data');
        setTokens(getEnhancedMockTokens());
      }
      
    } catch (error) {
      console.error('❌ Error fetching tokens from backend:', error);
      console.log('🔄 Falling back to enhanced mock data...');
      // Hata durumunda enhanced mock data kullan
      setTokens(getEnhancedMockTokens());
    } finally {
      setLoading(false);
    }
  };

  const filteredTokens = useMemo(() => {
    let filtered = tokens.filter(token => {
      if (!token || typeof token !== 'object') return false;
      
      const matchesSearch = 
        token.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.address?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTier = filterTier === 'all' || token.tier === filterTier;
      const matchesFavorite = !showOnlyFavorites || favorites.has(token.address);
      
      return matchesSearch && matchesTier && matchesFavorite;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'marketcap':
          return (b.marketCap || 0) - (a.marketCap || 0);
        case 'volume':
          return (b.volume24h || 0) - (a.volume24h || 0);
        case 'holders':
          return (b.holders || 0) - (a.holders || 0);
        case 'price':
          return (b.price || 0) - (a.price || 0);
        case 'social':
          return (b.socialScore || 0) - (a.socialScore || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [tokens, searchTerm, sortBy, filterTier, showOnlyFavorites, favorites]);

  const shortenAddress = (address) => {
    if (!address || address.length < 10) return 'N/A';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const formatNumber = (num) => {
    if (!num && num !== 0) return '0';
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const formatPrice = (price) => {
    if (!price) return '$0.00';
    if (price < 0.000001) return `$${price.toExponential(2)}`;
    if (price < 0.01) return `$${price.toFixed(8)}`;
    return `$${price.toFixed(6)}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getPriceChangeColor = (change) => {
    if (!change) return '#94A3B8';
    return change >= 0 ? '#10B981' : '#EF4444';
  };

  const getTierBadge = (tier) => {
    const badges = {
      basic: { label: 'Basic', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)' },
      standard: { label: 'Standard', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
      premium: { label: 'Premium', color: '#F0B90B', bg: 'rgba(240, 185, 11, 0.1)' }
    };
    return badges[tier] || badges.basic;
  };

  const getSocialScoreColor = (score) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const toggleFavorite = (tokenAddress) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(tokenAddress)) {
      newFavorites.delete(tokenAddress);
    } else {
      newFavorites.add(tokenAddress);
    }
    setFavorites(newFavorites);
    localStorage.setItem('tokenFavorites', JSON.stringify([...newFavorites]));
  };

  const shareToken = (token, platform) => {
    const text = `🚀 Check out ${token.name} (${token.symbol}) on BSC Network! \n\n` +
                `💰 Market Cap: $${formatNumber(token.marketCap)}\n` +
                `📈 24h Volume: $${formatNumber(token.volume24h)}\n` +
                `👥 Holders: ${formatNumber(token.holders)}\n\n` +
                `Join the community: ${token.website || window.location.origin}`;
    
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(text)}`,
      copy: text
    };

    if (platform === 'copy') {
      navigator.clipboard.writeText(text);
      alert('Token info copied to clipboard!');
    } else {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
  };

  const TokenCard = ({ token }) => {
    const tierBadge = getTierBadge(token.tier);
    const isFavorite = favorites.has(token.address);
    const hasLiveData = token.dexScreenerUrl ? true : false;

    return (
      <div className="token-card">
        {hasLiveData && (
          <div className="live-indicator">
            <span className="live-dot"></span>
            <span className="live-text">LIVE</span>
          </div>
        )}
        <div className="card-header">
          <div className="token-identity">
            <div className="token-logo-container">
              <div 
                className="token-logo"
                style={{ background: `linear-gradient(135deg, ${tierBadge.color}, ${tierBadge.color}99)` }}
              >
                <span className="logo-text">{token.symbol?.charAt(0)}</span>
              </div>
              <button 
                className={`favorite-btn ${isFavorite ? 'active' : ''}`}
                onClick={() => toggleFavorite(token.address)}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                {isFavorite ? '★' : '☆'}
              </button>
            </div>
            <div className="token-info">
              <h3 className="token-name">{token.name}</h3>
              <div className="token-meta">
                <span className="token-symbol">{token.symbol}</span>
                <span 
                  className="tier-badge"
                  style={{ 
                    color: tierBadge.color, 
                    background: tierBadge.bg,
                    border: `1px solid ${tierBadge.color}33`
                  }}
                >
                  {tierBadge.label}
                </span>
                {token.isReal && <span className="verified-badge">✓ Verified</span>}
              </div>
            </div>
          </div>
          <div className="token-stats">
            <div className="price-section">
              <div className="price">{formatPrice(token.price)}</div>
              <div 
                className="price-change"
                style={{ color: getPriceChangeColor(token.priceChange24h) }}
              >
                {token.priceChange24h >= 0 ? '↗' : '↘'} {Math.abs(token.priceChange24h || 0)}%
              </div>
            </div>
          </div>
        </div>

        <div className="market-data">
          <div className="market-stats">
            <div className="stat">
              <span className="label">Market Cap</span>
              <span className="value">${formatNumber(token.marketCap)}</span>
            </div>
            <div className="stat">
              <span className="label">24h Volume</span>
              <span className="value">${formatNumber(token.volume24h)}</span>
            </div>
            <div className="stat">
              <span className="label">Holders</span>
              <span className="value">{formatNumber(token.holders)}</span>
            </div>
          </div>
          {token.socialScore && (
            <div className="social-score">
              <span className="label">Social Score</span>
              <div className="score-bar">
                <div 
                  className="score-fill"
                  style={{ 
                    width: `${token.socialScore}%`,
                    background: getSocialScoreColor(token.socialScore)
                  }}
                ></div>
                <span className="score-text">{token.socialScore}</span>
              </div>
            </div>
          )}
        </div>

        <div className="tax-info">
          <div className="tax-badges">
            <div className="tax-badge buy">
              <span>BUY</span>
              <strong>{token.tax?.buy || 0}%</strong>
            </div>
            <div className="tax-badge sell">
              <span>SELL</span>
              <strong>{token.tax?.sell || 0}%</strong>
            </div>
          </div>
        </div>

        {token.features && token.features.length > 0 && (
          <div className="features-section">
            <div className="features-label">Features:</div>
            <div className="features-list">
              {token.features.map((feature, index) => (
                <span key={index} className="feature-tag">
                  {feature.replace('-', ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="contract-info">
          <div className="info-row">
            <span className="label">Contract:</span>
            <span 
              className="value clickable"
              onClick={() => navigator.clipboard.writeText(token.address)}
              title="Click to copy"
            >
              {shortenAddress(token.address)}
            </span>
          </div>
          <div className="info-row">
            <span className="label">Creator:</span>
            <span 
              className="value clickable"
              onClick={() => navigator.clipboard.writeText(token.creator)}
              title="Click to copy"
            >
              {shortenAddress(token.creator)}
            </span>
          </div>
          <div className="info-row">
            <span className="label">Created:</span>
            <span className="value">{formatDate(token.createdAt)}</span>
          </div>
        </div>

        {token.description && (
          <div className="description">
            <p>{token.description}</p>
          </div>
        )}

        <div className="card-actions">
          <div className="primary-actions">
            <Link to={`/token/${token.address}`} className="btn primary">
              📊 Token Details
            </Link>
          </div>
          <div className="social-actions">
            {token.website && (
              <a href={token.website} target="_blank" rel="noopener noreferrer" className="social-btn" title="Website">
                🌐
              </a>
            )}
            {token.telegram && (
              <a href={token.telegram} target="_blank" rel="noopener noreferrer" className="social-btn" title="Telegram">
                📢
              </a>
            )}
            {token.twitter && (
              <a href={token.twitter} target="_blank" rel="noopener noreferrer" className="social-btn" title="Twitter">
                🐦
              </a>
            )}
            <button 
              className="social-btn share-btn"
              onClick={() => shareToken(token, 'copy')}
              title="Share token info"
            >
              📤
            </button>
          </div>
        </div>

        <div className="blockchain-links">
          <a 
            href={`https://testnet.bscscan.com/token/${token.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="blockchain-link"
          >
            🔗 BscScan
          </a>
          <a 
            href={`https://pancakeswap.finance/swap?outputCurrency=${token.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="blockchain-link"
          >
            🥞 PancakeSwap
          </a>
          {token.dexScreenerUrl ? (
            <a 
              href={token.dexScreenerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="blockchain-link dexscreener"
            >
              📊 DexScreener
            </a>
          ) : (
            <a 
              href={`https://dexscreener.com/bsc/${token.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="blockchain-link"
            >
              📊 DexScreener
            </a>
          )}
        </div>
      </div>
    );
  };

  const TokenListView = ({ token }) => {
    const tierBadge = getTierBadge(token.tier);
    const isFavorite = favorites.has(token.address);

    return (
      <div className="token-list-item">
        <div className="list-item-content">
          <div className="token-main-info">
            <div className="token-identity">
              <div className="token-logo-container">
                <div 
                  className="token-logo"
                  style={{ background: `linear-gradient(135deg, ${tierBadge.color}, ${tierBadge.color}99)` }}
                >
                  <span className="logo-text">{token.symbol?.charAt(0)}</span>
                </div>
                <button 
                  className={`favorite-btn ${isFavorite ? 'active' : ''}`}
                  onClick={() => toggleFavorite(token.address)}
                >
                  {isFavorite ? '★' : '☆'}
                </button>
              </div>
              <div className="token-details">
                <h3 className="token-name">{token.name}</h3>
                <div className="token-meta">
                  <span className="token-symbol">{token.symbol}</span>
                  <span 
                    className="tier-badge"
                    style={{ 
                      color: tierBadge.color, 
                      background: tierBadge.bg 
                    }}
                  >
                    {tierBadge.label}
                  </span>
                  {token.isReal && <span className="verified-badge">✓</span>}
                </div>
              </div>
            </div>

            <div className="price-section">
              <div className="price">{formatPrice(token.price)}</div>
              <div 
                className="price-change"
                style={{ color: getPriceChangeColor(token.priceChange24h) }}
              >
                {token.priceChange24h >= 0 ? '↗' : '↘'} {Math.abs(token.priceChange24h || 0)}%
              </div>
            </div>

            <div className="market-data-list">
              <div className="stat">
                <span className="label">MCap</span>
                <span className="value">${formatNumber(token.marketCap)}</span>
              </div>
              <div className="stat">
                <span className="label">Volume</span>
                <span className="value">${formatNumber(token.volume24h)}</span>
              </div>
              <div className="stat">
                <span className="label">Holders</span>
                <span className="value">{formatNumber(token.holders)}</span>
              </div>
            </div>

            <div className="tax-info-list">
              <div className="tax-badge">
                <span>BUY {token.tax?.buy || 0}%</span>
              </div>
              <div className="tax-badge">
                <span>SELL {token.tax?.sell || 0}%</span>
              </div>
            </div>

            <div className="list-actions">
              <Link to={`/token/${token.address}`} className="btn primary small">
                Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="token-list-container">
        <div className="loading-container">
          <div className="loading-content">
            <div className="spinner"></div>
            <h3>Loading Tokens...</h3>
            <p>Fetching real-time data from blockchain</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="token-list-container">
      <div className="header-section">
        <div className="header-content">
          <div className="title-section">
            <h1 className="main-title">🚀 BSC Token Marketplace</h1>
            <p className="subtitle">
              Discover {tokens.length} community-created tokens with real-time metrics, 
              advanced filtering, and comprehensive analytics.
            </p>
          </div>
          
          <div className="header-actions">
            <button 
              onClick={fetchTokens} 
              className="refresh-btn"
              disabled={loading}
              title="Refresh live data"
            >
              <span className={`refresh-icon ${loading ? 'spinning' : ''}`}>🔄</span>
              Refresh
            </button>
            <Link to="/create" className="create-token-btn">
              <span className="btn-icon">🎨</span>
              Create Token
            </Link>
          </div>
        </div>

        <div className="advanced-controls">
          <div className="control-group">
            <div className="search-container">
              <div className="search-icon">🔍</div>
              <input
                type="text"
                placeholder="Search tokens by name, symbol, contract..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="clear-search-btn">
                  ✕
                </button>
              )}
            </div>

            <div className="view-toggle">
              <button 
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                ⬜⬜
              </button>
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                ☰
              </button>
            </div>
          </div>

          <div className="filter-group">
            <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)} className="filter-select">
              <option value="all">All Tiers</option>
              <option value="basic">Basic</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </select>

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name">Name A-Z</option>
              <option value="marketcap">Market Cap</option>
              <option value="volume">Volume</option>
              <option value="holders">Holders</option>
              <option value="price">Price</option>
              <option value="social">Social Score</option>
            </select>

            <button 
              className={`favorite-filter-btn ${showOnlyFavorites ? 'active' : ''}`}
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            >
              {showOnlyFavorites ? '★' : '☆'} Favorites
            </button>

            <div className="results-info">
              <span className="results-count">{filteredTokens.length}</span>
              <span className="results-text">tokens found</span>
            </div>
          </div>
        </div>
      </div>

      <div className="tokens-content">
        {filteredTokens.length === 0 ? (
          <div className="empty-state">
            <div className="empty-illustration">🔍</div>
            <h3 className="empty-title">
              {searchTerm || filterTier !== 'all' || showOnlyFavorites 
                ? 'No tokens match your criteria' 
                : 'No tokens created yet'
              }
            </h3>
            <p className="empty-text">
              {searchTerm 
                ? 'Try adjusting your search terms or browse all tokens' 
                : 'Be the first to create a token and start building your community!'
              }
            </p>
            <Link to="/create" className="empty-action-btn">
              🎨 Create First Token
            </Link>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="tokens-grid">
            {filteredTokens.map((token) => (
              <TokenCard key={token.address} token={token} />
            ))}
          </div>
        ) : (
          <div className="tokens-list">
            {filteredTokens.map((token) => (
              <TokenListView key={token.address} token={token} />
            ))}
          </div>
        )}
      </div>

      <div className="footer-stats">
        <div className="stat-item">
          <span className="stat-number">{tokens.length}</span>
          <span className="stat-label">Total Tokens</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">
            {tokens.filter(t => t.tier === 'premium').length}
          </span>
          <span className="stat-label">Premium Tokens</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">
            ${formatNumber(tokens.reduce((sum, token) => sum + (token.marketCap || 0), 0))}
          </span>
          <span className="stat-label">Total Market Cap</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">
            {tokens.reduce((sum, token) => sum + (token.holders || 0), 0)}
          </span>
          <span className="stat-label">Total Holders</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{favorites.size}</span>
          <span className="stat-label">Favorites</span>
        </div>
      </div>

      <style jsx>{`
        .token-list-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #1E2026 0%, #2B2F36 50%, #1E2026 100%);
          color: #FFFFFF;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .header-section {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem 1rem 1rem 1rem;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .title-section {
          flex: 1;
        }

        .main-title {
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 800;
          margin: 0 0 0.5rem 0;
          background: linear-gradient(135deg, #F0B90B, #F8D33A, #F0B90B);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }

        .subtitle {
          font-size: clamp(1rem, 3vw, 1.2rem);
          color: #CBD5E1;
          margin: 0;
          font-weight: 400;
          max-width: 600px;
          line-height: 1.6;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .refresh-btn {
          background: rgba(255, 255, 255, 0.1);
          color: #FFFFFF;
          padding: 1rem 1.5rem;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 700;
          font-size: 1rem;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          white-space: nowrap;
          border: 1px solid rgba(255, 255, 255, 0.2);
          cursor: pointer;
        }

        .refresh-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .refresh-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .refresh-icon {
          font-size: 1.2rem;
          display: inline-block;
          transition: transform 0.3s ease;
        }

        .refresh-icon.spinning {
          animation: spin 1s linear infinite;
        }

        .create-token-btn {
          background: linear-gradient(135deg, #F0B90B, #F8D33A);
          color: #1E2026;
          padding: 1rem 2rem;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 700;
          font-size: 1rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(240, 185, 11, 0.3);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          white-space: nowrap;
          border: none;
          cursor: pointer;
        }

        .create-token-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(240, 185, 11, 0.4);
        }

        .btn-icon {
          font-size: 1.2rem;
        }

        .advanced-controls {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          background: rgba(43, 47, 54, 0.6);
          padding: 1.5rem;
          border-radius: 16px;
          border: 1px solid rgba(240, 185, 11, 0.2);
          backdrop-filter: blur(10px);
        }

        .control-group {
          display: flex;
          gap: 1.5rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .search-container {
          position: relative;
          flex: 1;
          min-width: 300px;
          max-width: 500px;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1.2rem;
          color: #F0B90B;
        }

        .search-input {
          padding: 1rem 1rem 1rem 3rem;
          border: 1px solid rgba(240, 185, 11, 0.3);
          border-radius: 12px;
          font-size: 1rem;
          background: rgba(30, 32, 38, 0.8);
          color: #FFFFFF;
          width: 100%;
          outline: none;
          transition: all 0.3s ease;
        }

        .search-input:focus {
          border-color: #F0B90B;
          box-shadow: 0 0 0 3px rgba(240, 185, 11, 0.1);
        }

        .clear-search-btn {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #CBD5E1;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          transition: all 0.2s ease;
        }

        .clear-search-btn:hover {
          background: rgba(240, 185, 11, 0.2);
          color: #F0B90B;
        }

        .view-toggle {
          display: flex;
          gap: 0.5rem;
          background: rgba(30, 32, 38, 0.8);
          padding: 0.5rem;
          border-radius: 12px;
          border: 1px solid rgba(240, 185, 11, 0.3);
        }

        .view-btn {
          padding: 0.75rem;
          border: none;
          background: transparent;
          color: #CBD5E1;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 1.2rem;
        }

        .view-btn.active {
          background: #F0B90B;
          color: #1E2026;
        }

        .view-btn:hover {
          background: rgba(240, 185, 11, 0.2);
          color: #F0B90B;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .filter-select, .sort-select {
          padding: 1rem 1.5rem;
          border: 1px solid rgba(240, 185, 11, 0.3);
          border-radius: 12px;
          font-size: 0.9rem;
          background: rgba(30, 32, 38, 0.8);
          color: #FFFFFF;
          outline: none;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 140px;
        }

        .filter-select:focus, .sort-select:focus {
          border-color: #F0B90B;
        }

        .favorite-filter-btn {
          padding: 1rem 1.5rem;
          border: 1px solid rgba(240, 185, 11, 0.3);
          border-radius: 12px;
          font-size: 0.9rem;
          background: rgba(30, 32, 38, 0.8);
          color: #CBD5E1;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .favorite-filter-btn.active {
          background: rgba(240, 185, 11, 0.2);
          color: #F0B90B;
          border-color: #F0B90B;
        }

        .favorite-filter-btn:hover {
          background: rgba(240, 185, 11, 0.1);
          color: #F0B90B;
        }

        .results-info {
          background: rgba(240, 185, 11, 0.1);
          color: #F0B90B;
          padding: 0.75rem 1.5rem;
          border-radius: 20px;
          font-size: 0.9rem;
          border: 1px solid rgba(240, 185, 11, 0.3);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
        }

        .results-count {
          font-weight: 800;
          font-size: 1.1rem;
        }

        .tokens-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 1rem 2rem 1rem;
        }

        .tokens-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 2rem;
        }

        .token-card {
          background: linear-gradient(135deg, rgba(43, 47, 54, 0.8), rgba(30, 32, 38, 0.6));
          padding: 2rem;
          border-radius: 20px;
          border: 1px solid rgba(240, 185, 11, 0.2);
          backdrop-filter: blur(15px);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .live-indicator {
          position: absolute;
          top: 1rem;
          right: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(16, 185, 129, 0.2);
          padding: 0.5rem 1rem;
          border-radius: 20px;
          border: 1px solid rgba(16, 185, 129, 0.4);
          z-index: 10;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          background: #10B981;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        .live-text {
          font-size: 0.75rem;
          font-weight: 700;
          color: #10B981;
          letter-spacing: 0.05em;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.2);
          }
        }

        .token-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #F0B90B, transparent);
          transform: scaleX(0);
          transition: transform 0.4s ease;
        }

        .token-card:hover::before {
          transform: scaleX(1);
        }

        .token-card:hover {
          background: linear-gradient(135deg, rgba(43, 47, 54, 0.9), rgba(30, 32, 38, 0.7));
          border-color: rgba(240, 185, 11, 0.4);
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(240, 185, 11, 0.15);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .token-identity {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
        }

        .token-logo-container {
          position: relative;
        }

        .token-logo {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 1.5rem;
          color: #1E2026;
          flex-shrink: 0;
          box-shadow: 0 4px 15px rgba(240, 185, 11, 0.3);
        }

        .logo-text {
          color: #1E2026;
          font-weight: 800;
        }

        .favorite-btn {
          position: absolute;
          top: -5px;
          right: -5px;
          width: 24px;
          height: 24px;
          border: none;
          border-radius: 50%;
          background: rgba(30, 32, 38, 0.9);
          color: #CBD5E1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          transition: all 0.3s ease;
          border: 1px solid rgba(240, 185, 11, 0.3);
        }

        .favorite-btn.active {
          color: #F0B90B;
          background: rgba(240, 185, 11, 0.2);
          border-color: #F0B90B;
        }

        .favorite-btn:hover {
          transform: scale(1.1);
        }

        .token-info {
          flex: 1;
          min-width: 0;
        }

        .token-name {
          font-size: 1.3rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
          color: #FFFFFF;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .token-meta {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .token-symbol {
          font-size: 0.95rem;
          color: #F0B90B;
          font-weight: 700;
          background: rgba(240, 185, 11, 0.1);
          padding: 0.4rem 0.8rem;
          border-radius: 8px;
          border: 1px solid rgba(240, 185, 11, 0.3);
        }

        .tier-badge {
          font-size: 0.75rem;
          padding: 0.3rem 0.6rem;
          border-radius: 6px;
          font-weight: 600;
        }

        .verified-badge {
          font-size: 0.75rem;
          color: #10B981;
          background: rgba(16, 185, 129, 0.1);
          padding: 0.3rem 0.6rem;
          border-radius: 6px;
          font-weight: 600;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .token-stats {
          text-align: right;
        }

        .price-section {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.25rem;
        }

        .price {
          font-size: 1.1rem;
          font-weight: 700;
          color: #FFFFFF;
        }

        .price-change {
          font-size: 0.85rem;
          font-weight: 600;
        }

        .market-data {
          margin-bottom: 1.5rem;
        }

        .market-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .label {
          font-size: 0.8rem;
          color: #94A3B8;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .value {
          font-size: 0.9rem;
          color: #FFFFFF;
          font-weight: 700;
        }

        .social-score {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .score-bar {
          position: relative;
          height: 20px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          overflow: hidden;
        }

        .score-fill {
          height: 100%;
          border-radius: 10px;
          transition: width 0.3s ease;
        }

        .score-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 0.8rem;
          font-weight: 700;
          color: #FFFFFF;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .tax-info {
          margin-bottom: 1.5rem;
        }

        .tax-badges {
          display: flex;
          gap: 1rem;
        }

        .tax-badge {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.75rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .tax-badge.buy {
          background: rgba(16, 185, 129, 0.1);
          color: #10B981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .tax-badge.sell {
          background: rgba(239, 68, 68, 0.1);
          color: #EF4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .tax-badge strong {
          font-size: 1.1rem;
          margin-top: 0.25rem;
        }

        .features-section {
          margin-bottom: 1.5rem;
        }

        .features-label {
          font-size: 0.8rem;
          color: #94A3B8;
          font-weight: 600;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .features-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .feature-tag {
          font-size: 0.75rem;
          color: #F0B90B;
          background: rgba(240, 185, 11, 0.1);
          padding: 0.3rem 0.6rem;
          border-radius: 6px;
          border: 1px solid rgba(240, 185, 11, 0.3);
          text-transform: capitalize;
        }

        .contract-info {
          margin-bottom: 1.5rem;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .clickable {
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .clickable:hover {
          color: #F0B90B;
        }

        .description {
          background: rgba(255, 255, 255, 0.03);
          padding: 1rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          margin-bottom: 1.5rem;
        }

        .description p {
          margin: 0;
          font-size: 0.9rem;
          color: #CBD5E1;
          line-height: 1.5;
        }

        .card-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .primary-actions {
          display: flex;
          gap: 0.75rem;
          flex: 1;
        }

        .btn {
          padding: 1rem 1.5rem;
          border: none;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 700;
          transition: all 0.3s ease;
          cursor: pointer;
          flex: 1;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .btn.primary {
          background: linear-gradient(135deg, #F0B90B, #F8D33A);
          color: #1E2026;
        }

        .btn.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(240, 185, 11, 0.4);
        }

        .btn.secondary {
          background: rgba(255, 255, 255, 0.1);
          color: #FFFFFF;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .btn.secondary:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .social-actions {
          display: flex;
          gap: 0.5rem;
        }

        .social-btn {
          width: 48px;
          height: 48px;
          border: none;
          border-radius: 12px;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          background: rgba(255, 255, 255, 0.1);
          color: #CBD5E1;
        }

        .social-btn:hover {
          transform: translateY(-2px) scale(1.1);
          background: rgba(240, 185, 11, 0.2);
          color: #F0B90B;
        }

        .blockchain-links {
          display: flex;
          gap: 1rem;
          justify-content: space-between;
        }

        .blockchain-link {
          flex: 1;
          text-align: center;
          padding: 0.75rem 1rem;
          background: rgba(16, 185, 129, 0.1);
          color: #10B981;
          text-decoration: none;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
          border: 1px solid rgba(16, 185, 129, 0.3);
          transition: all 0.3s ease;
        }

        .blockchain-link.dexscreener {
          background: rgba(240, 185, 11, 0.1);
          color: #F0B90B;
          border-color: rgba(240, 185, 11, 0.3);
        }

        .blockchain-link.dexscreener:hover {
          background: rgba(240, 185, 11, 0.2);
        }

        .blockchain-link:hover {
          background: rgba(16, 185, 129, 0.2);
          transform: translateY(-2px);
        }

        .tokens-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .token-list-item {
          background: linear-gradient(135deg, rgba(43, 47, 54, 0.8), rgba(30, 32, 38, 0.6));
          border: 1px solid rgba(240, 185, 11, 0.2);
          border-radius: 16px;
          padding: 1.5rem;
          transition: all 0.3s ease;
        }

        .token-list-item:hover {
          border-color: rgba(240, 185, 11, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(240, 185, 11, 0.1);
        }

        .list-item-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .token-main-info {
          display: flex;
          align-items: center;
          gap: 2rem;
          flex: 1;
        }

        .token-details {
          min-width: 200px;
        }

        .market-data-list {
          display: flex;
          gap: 2rem;
        }

        .tax-info-list {
          display: flex;
          gap: 1rem;
        }

        .list-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn.small {
          padding: 0.75rem 1rem;
          font-size: 0.8rem;
          text-decoration: none;
        }

        .empty-state {
          text-align: center;
          padding: 6rem 2rem;
        }

        .empty-illustration {
          font-size: 6rem;
          margin-bottom: 2rem;
          opacity: 0.7;
          filter: grayscale(1);
        }

        .empty-title {
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 1rem 0;
          color: #FFFFFF;
        }

        .empty-text {
          font-size: 1.2rem;
          color: #CBD5E1;
          margin: 0 0 3rem 0;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
        }

        .empty-action-btn {
          background: linear-gradient(135deg, #F0B90B, #F8D33A);
          color: #1E2026;
          padding: 1.2rem 2.5rem;
          border-radius: 16px;
          text-decoration: none;
          font-weight: 700;
          font-size: 1.1rem;
          transition: all 0.3s ease;
          display: inline-block;
        }

        .empty-action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(240, 185, 11, 0.4);
        }

        .loading-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
        }

        .loading-content {
          text-align: center;
        }

        .spinner {
          width: 80px;
          height: 80px;
          border: 4px solid rgba(240, 185, 11, 0.3);
          border-top: 4px solid #F0B90B;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 2rem auto;
        }

        .loading-content h3 {
          font-size: 1.8rem;
          font-weight: 700;
          margin: 0 0 1rem 0;
          color: #FFFFFF;
        }

        .loading-content p {
          font-size: 1.1rem;
          color: #CBD5E1;
          margin: 0;
        }

        .footer-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 2rem;
          max-width: 1200px;
          margin: 4rem auto 0 auto;
          padding: 3rem 1rem 0 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stat-item {
          text-align: center;
          padding: 2rem 1rem;
          background: rgba(43, 47, 54, 0.6);
          border-radius: 16px;
          border: 1px solid rgba(240, 185, 11, 0.1);
          transition: all 0.3s ease;
        }

        .stat-item:hover {
          border-color: rgba(240, 185, 11, 0.3);
          transform: translateY(-5px);
        }

        .stat-number {
          display: block;
          font-size: 2.5rem;
          font-weight: 800;
          color: #F0B90B;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          font-size: 1rem;
          color: #CBD5E1;
          font-weight: 600;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .token-card, .token-list-item {
          animation: fadeIn 0.6s ease-out;
        }

        @media (max-width: 768px) {
          .header-content {
            flex-direction: column;
            text-align: center;
          }

          .create-token-btn {
            width: 100%;
            justify-content: center;
          }

          .advanced-controls {
            flex-direction: column;
          }

          .control-group {
            flex-direction: column;
          }

          .search-container {
            min-width: auto;
            max-width: none;
          }

          .filter-group {
            flex-direction: column;
            align-items: stretch;
          }

          .tokens-grid {
            grid-template-columns: 1fr;
          }

          .card-actions {
            flex-direction: column;
          }

          .primary-actions {
            width: 100%;
          }

          .social-actions {
            width: 100%;
            justify-content: center;
          }

          .blockchain-links {
            flex-direction: column;
          }

          .token-main-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .market-data-list {
            flex-wrap: wrap;
            gap: 1rem;
          }

          .list-actions {
            width: 100%;
            justify-content: center;
          }

          .footer-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .header-section {
            padding: 1rem 0.5rem 0.5rem 0.5rem;
          }

          .tokens-content {
            padding: 0 0.5rem 1rem 0.5rem;
          }

          .main-title {
            font-size: 2rem;
          }

          .market-stats {
            grid-template-columns: 1fr;
          }

          .footer-stats {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .token-card {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default TokenList;

