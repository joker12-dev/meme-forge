import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchMultipleTokensData, mergeDexDataWithToken } from '../utils/dexscreener';

const TokenList = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('trending');
  const [activeTag, setActiveTag] = useState('all');
  const [liveTransactions, setLiveTransactions] = useState([]);
  const [showFeatured, setShowFeatured] = useState(false);

  // Simulated live transactions ticker
  useEffect(() => {
    const transactions = [
      { user: '0xb1...f6f914', action: 'Bought', amount: '0.69 BNB', token: 'BDOGE' },
      { user: '0x57...765ad5', action: 'Sold', amount: '0.99 BNB', token: 'MOON' },
      { user: '0xcb...a5aaf7', action: 'Bought', amount: '0.29 BNB', token: 'DIAMOND' },
      { user: '0x26...90933c', action: 'Bought', amount: '0.2 BNB', token: 'BSHIBA' },
    ];
    setLiveTransactions(transactions);
  }, []);

  // Fetch tokens from backend
  useEffect(() => {
    fetchTokens();
    const interval = setInterval(fetchTokens, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchTokens = async () => {
    try {
      const response = await fetch(process.env.REACT_APP_BACKEND_URL + '/api/tokens');
      const data = await response.json();
      
      if (data && data.length > 0) {
        const addresses = data.map(token => token.address);
        const dexData = await fetchMultipleTokensData(addresses);
        const enhancedTokens = data.map(token => {
          const dexInfo = dexData[token.address.toLowerCase()];
          return dexInfo ? mergeDexDataWithToken(dexInfo, token) : token;
        });
        setTokens(enhancedTokens);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tokens:', error);
      setLoading(false);
    }
  };

  // Filter and sort tokens
  const filteredTokens = tokens
    .filter(token => {
      const matchesSearch = token.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          token.symbol?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTag = activeTag === 'all' || token.tags?.includes(activeTag);
      const matchesFeatured = !showFeatured || token.featured;
      return matchesSearch && matchesTag && matchesFeatured;
    })
    .sort((a, b) => {
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

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
    return num.toFixed(2);
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
          {[...liveTransactions, ...liveTransactions].map((tx, index) => (
            <div key={index} style={styles.tickerItem}>
              <span style={styles.tickerAvatar}>👤</span>
              <span style={styles.tickerUser}>{tx.user}</span>
              <span style={{
                ...styles.tickerAction,
                color: tx.action === 'Bought' ? '#00FFA3' : '#FF4D4D'
              }}>
                {tx.action}
              </span>
              <span style={styles.tickerAmount}>{tx.amount}</span>
              <span style={styles.tickerToken}>{tx.token}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.content}>
        {/* Header with Filters */}
        <div style={styles.header}>
          <div style={styles.filterSection}>
            <button
              style={{
                ...styles.filterButton,
                ...(showFeatured ? styles.filterButtonActive : {})
              }}
              onClick={() => setShowFeatured(!showFeatured)}
            >
              ⭐ Featured
            </button>
            
            <div style={styles.tagFilters}>
              {['all', 'meme', 'defi', 'nft', 'gaming'].map(tag => (
                <button
                  key={tag}
                  style={{
                    ...styles.tagButton,
                    ...(activeTag === tag ? styles.tagButtonActive : {})
                  }}
                  onClick={() => setActiveTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.controls}>
            <div style={styles.searchBar}>
              <span style={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search tokens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={styles.sortSelect}
            >
              <option value="trending">📈 Trending</option>
              <option value="volume">💰 Volume</option>
              <option value="marketcap">📊 Market Cap</option>
              <option value="newest">🆕 Newest</option>
            </select>
          </div>
        </div>

        {/* Token Grid */}
        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Loading tokens...</p>
          </div>
        ) : (
          <div style={styles.tokenGrid}>
            {filteredTokens.map((token) => (
              <Link
                key={token.address}
                to={`/token/${token.address}`}
                style={styles.tokenCard}
                className="token-card"
              >
                {/* Token Header */}
                <div style={styles.cardHeader}>
                  <div style={styles.tokenLogoContainer}>
                    {token.image ? (
                      <img src={token.image} alt={token.name} style={styles.tokenLogo} />
                    ) : (
                      <div style={styles.tokenLogoPlaceholder}>
                        {token.symbol?.[0] || '?'}
                      </div>
                    )}
                  </div>
                  
                  <div style={styles.tokenInfo}>
                    <div style={styles.tokenNameRow}>
                      <h3 style={styles.tokenName}>{token.name || 'Unknown'}</h3>
                      {token.priceChange24h && (
                        <div style={{
                          ...styles.priceChange,
                          color: token.priceChange24h >= 0 ? '#00FFA3' : '#FF4D4D',
                          background: token.priceChange24h >= 0 
                            ? 'rgba(0, 255, 163, 0.15)' 
                            : 'rgba(255, 77, 77, 0.15)'
                        }}>
                          {token.priceChange24h >= 0 ? '+' : ''}
                          {token.priceChange24h.toFixed(1)}%
                        </div>
                      )}
                    </div>
                    <div style={styles.tokenSymbol}>{token.symbol || 'N/A'}</div>
                  </div>
                </div>

                {/* Token Stats */}
                <div style={styles.cardBody}>
                  <div style={styles.stat}>
                    <span style={styles.statLabel}>Market Cap</span>
                    <span style={styles.statValue}>
                      ${formatNumber(token.marketCap || token.fdv)}
                    </span>
                  </div>

                  <div style={styles.stat}>
                    <span style={styles.statLabel}>24h Volume</span>
                    <span style={styles.statValue}>
                      ${formatNumber(token.volume24h)}
                    </span>
                  </div>

                  <div style={styles.stat}>
                    <span style={styles.statLabel}>Liquidity</span>
                    <span style={styles.statValue}>
                      ${formatNumber(token.liquidity)}
                    </span>
                  </div>
                </div>

                {/* Token Footer */}
                <div style={styles.cardFooter}>
                  <div style={styles.creatorInfo}>
                    <span style={styles.creatorLabel}>Created by:</span>
                    <span style={styles.creatorAddress}>
                      {formatAddress(token.creator)}
                    </span>
                  </div>
                  
                  {token.liveOnDex && (
                    <div style={styles.liveBadge}>
                      <span style={styles.liveDot}></span>
                      LIVE
                    </div>
                  )}
                </div>

                {/* Description */}
                {token.description && (
                  <div style={styles.description}>
                    <span style={styles.descriptionTag}>Meme</span>
                    <span style={styles.descriptionText}>
                      {token.description.slice(0, 60)}
                      {token.description.length > 60 ? '...' : ''}
                    </span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {filteredTokens.length === 0 && !loading && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🔍</div>
            <h3 style={styles.emptyTitle}>No tokens found</h3>
            <p style={styles.emptyText}>Try adjusting your filters or search term</p>
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
    borderBottom: '1px solid rgba(240, 185, 11, 0.2)',
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
  tickerAvatar: {
    fontSize: '1.2rem',
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
  
  // Main Content
  content: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '2rem 1.5rem',
  },
  
  // Header & Filters
  header: {
    marginBottom: '2rem',
  },
  filterSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
  },
  filterButton: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#CBD5E1',
    padding: '0.75rem 1.5rem',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  filterButtonActive: {
    background: 'linear-gradient(135deg, #F0B90B, #F8D33A)',
    color: '#000',
    border: '1px solid #F0B90B',
  },
  tagFilters: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  tagButton: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#94A3B8',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '500',
    transition: 'all 0.2s',
    textTransform: 'capitalize',
  },
  tagButtonActive: {
    background: 'rgba(240, 185, 11, 0.2)',
    color: '#F0B90B',
    border: '1px solid rgba(240, 185, 11, 0.5)',
  },
  
  // Controls
  controls: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  searchBar: {
    flex: 1,
    minWidth: '250px',
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '0.75rem 1rem',
  },
  searchIcon: {
    marginRight: '0.75rem',
    fontSize: '1.2rem',
  },
  searchInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    color: '#FFFFFF',
    fontSize: '0.95rem',
    outline: 'none',
  },
  sortSelect: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#FFFFFF',
    padding: '0.75rem 1rem',
    borderRadius: '12px',
    fontSize: '0.95rem',
    fontWeight: '500',
    cursor: 'pointer',
    outline: 'none',
  },
  
  // Token Grid
  tokenGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1.5rem',
  },
  
  // Token Card
  tokenCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '1.5rem',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  
  // Card Header
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
  },
  tokenLogoContainer: {
    flexShrink: 0,
  },
  tokenLogo: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    objectFit: 'cover',
  },
  tokenLogoPlaceholder: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #F0B90B, #F8D33A)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
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
    gap: '0.75rem',
    marginBottom: '0.25rem',
  },
  tokenName: {
    fontSize: '1.25rem',
    fontWeight: '700',
    margin: 0,
    color: '#FFFFFF',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  priceChange: {
    padding: '0.25rem 0.75rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '700',
    flexShrink: 0,
  },
  tokenSymbol: {
    color: '#94A3B8',
    fontSize: '0.95rem',
    fontWeight: '500',
  },
  
  // Card Body
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    paddingTop: '1rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  stat: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: '0.85rem',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: '0.95rem',
    fontWeight: '600',
  },
  
  // Card Footer
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '1rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  creatorInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  creatorLabel: {
    color: '#94A3B8',
    fontSize: '0.75rem',
  },
  creatorAddress: {
    color: '#CBD5E1',
    fontSize: '0.85rem',
    fontFamily: 'monospace',
    fontWeight: '500',
  },
  liveBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    background: 'rgba(0, 255, 163, 0.15)',
    color: '#00FFA3',
    padding: '0.4rem 0.75rem',
    borderRadius: '8px',
    fontSize: '0.75rem',
    fontWeight: '700',
  },
  liveDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#00FFA3',
    animation: 'pulse 2s infinite',
  },
  
  // Description
  description: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'flex-start',
    fontSize: '0.85rem',
    color: '#94A3B8',
    lineHeight: '1.5',
  },
  descriptionTag: {
    background: 'rgba(240, 185, 11, 0.2)',
    color: '#F0B90B',
    padding: '0.25rem 0.5rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
    flexShrink: 0,
  },
  descriptionText: {
    flex: 1,
  },
  
  // Loading State
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '1rem',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid rgba(240, 185, 11, 0.2)',
    borderTop: '4px solid #F0B90B',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: '1rem',
  },
  
  // Empty State
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
  },
  emptyIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
  },
  emptyTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    margin: '0 0 0.5rem 0',
    color: '#FFFFFF',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: '1rem',
  },
};

export default TokenList;

